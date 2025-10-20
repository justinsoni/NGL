const Fixture = require('../models/Fixture');
const MatchData = require('../models/MatchData');
const Club = require('../models/Club');
const LeagueConfig = require('../models/LeagueConfig');
const { ensureTableForSeason, updateTableForMatch, pickTopTwo } = require('../utils/leagueTable');

function generateRoundRobinPairings(clubIds) {
  const ids = [...clubIds];
  if (ids.length % 2 === 1) ids.push(null);
  const rounds = ids.length - 1;
  const half = ids.length / 2;
  const schedule = [];
  const arr = [...ids];
  for (let r = 0; r < rounds; r++) {
    const pairs = [];
    for (let i = 0; i < half; i++) {
      const home = arr[i];
      const away = arr[arr.length - 1 - i];
      if (home !== null && away !== null) {
        pairs.push({ home, away });
      }
    }
    schedule.push(pairs);
    const fixed = arr[0];
    const rest = arr.slice(1);
    rest.unshift(rest.pop());
    arr.splice(1, arr.length - 1, ...rest);
    arr[0] = fixed;
  }
  return schedule.flat();
}

// POST /api/fixtures/generate
exports.generateFixtures = async (req, res) => {
  try {
    const clubs = await Club.find({ isActive: true }).sort({ name: 1 });
    if (clubs.length < 2) return res.status(400).json({ success: false, message: 'At least 2 active clubs are required' });

    // Get league configuration
    let leagueConfig = await LeagueConfig.findOne({ isActive: true });
    if (!leagueConfig) {
      // Create default league config if none exists
      const now = new Date();
      const startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const endDate = new Date(now.getFullYear(), now.getMonth() + 2, now.getDate());
      leagueConfig = await LeagueConfig.create({
        season: '2025',
        name: 'NGL',
        startDate,
        endDate,
        isActive: true
      });
    }

    await ensureTableForSeason(leagueConfig.season, leagueConfig.name, clubs.map(c => c._id));

    const existing = await Fixture.find({ isFinal: false });
    if (existing.length) await Fixture.deleteMany({ isFinal: false });

    const pairings = generateRoundRobinPairings(clubs.map(c => c._id));
    // Assign conflict-free times with constraints:
    // 1) unique kickoffAt
    // 2) a club plays max 1 match per calendar day
    // 3) matches must be within league period
    const incrementMs = 2 * 60 * 60 * 1000; // 2 hours
    const leagueStart = new Date(leagueConfig.startDate);
    const leagueEnd = new Date(leagueConfig.endDate);
    
    // Start scheduling from league start date at 14:00
    leagueStart.setHours(14, 0, 0, 0);
    let slot = new Date(leagueStart);
    const docs = [];

    const sameDayRange = (d) => {
      const dayStart = new Date(d); dayStart.setHours(0,0,0,0);
      const dayEnd = new Date(d); dayEnd.setHours(23,59,59,999);
      return { dayStart, dayEnd };
    };

    const teamHasMatchOnDay = async (teamId, d) => {
      const { dayStart, dayEnd } = sameDayRange(d);
      return !!(await Fixture.exists({ kickoffAt: { $gte: dayStart, $lte: dayEnd }, $or: [{ homeTeam: teamId }, { awayTeam: teamId }] }));
    };

    for (const p of pairings) {
      let assigned = false;
      /* eslint no-await-in-loop: 0 */
      while (!assigned) {
        // Check if slot is within league period
        if (slot > leagueEnd) {
          return res.status(400).json({ 
            success: false, 
            message: `Cannot schedule all matches within league period (${leagueConfig.startDate.toLocaleDateString()} - ${leagueConfig.endDate.toLocaleDateString()}). Please extend the league period or reduce the number of clubs.` 
          });
        }
        
        // Ensure unique timestamp
        const taken = await Fixture.exists({ kickoffAt: slot });
        // Ensure both teams don't play another match on this same calendar day
        const violatesHomeDay = await teamHasMatchOnDay(p.home, slot);
        const violatesAwayDay = await teamHasMatchOnDay(p.away, slot);
        if (!taken && !violatesHomeDay && !violatesAwayDay) {
          const created = await Fixture.create({ homeTeam: p.home, awayTeam: p.away, status: 'scheduled', stage: 'league', isFinal: false, kickoffAt: new Date(slot), isScheduled: false });
          docs.push(created);
          assigned = true;
          // Next game moves forward 2h from current slot baseline
          slot = new Date(slot.getTime() + incrementMs);
        } else {
          // Move forward 2h; if we crossed midnight, that's fine — daily rule still holds
          slot = new Date(slot.getTime() + incrementMs);
        }
      }
    }
    res.status(201).json({ success: true, message: 'Fixtures generated', data: docs });
  } catch (e) {
    console.error('generateFixtures error', e);
    res.status(500).json({ success: false, message: 'Failed to generate fixtures' });
  }
};

// PUT /api/fixtures/:id/start
exports.startMatch = async (req, res) => {
  try {
    const match = await Fixture.findById(req.params.id).populate('homeTeam awayTeam');
    if (!match) return res.status(404).json({ success: false, message: 'Match not found' });
    if (match.status !== 'scheduled') return res.status(400).json({ success: false, message: 'Only scheduled matches can be started' });
    if (match.isScheduled !== true) return res.status(400).json({ success: false, message: 'Please click Schedule after setting teams, kickoff, and venue' });

    match.status = 'live';
    if (!match.kickoffAt) match.kickoffAt = new Date();
    // Initialize PES-style match time tracking
    match.matchStartedAt = new Date();
    match.currentMinute = 0;
    match.addedTime = 0;
    match.isHalfTime = false;
    match.isFullTime = false;
    match.matchPhase = 'first_half';
    match.stoppageTimeAccumulated = 0;
    match.lastEventTime = new Date();
    // Set default time acceleration (1 game minute = 1 real second for fast gameplay)
    match.timeAcceleration = 1;
    await match.save();

    const io = req.app.get('io');
    io.emit('match:started', match);
    res.json({ success: true, data: match });
  } catch (e) { res.status(500).json({ success: false, message: 'Failed to start match' }); }
};

// GET /api/fixtures/:id/time - Get current match time
exports.getMatchTime = async (req, res) => {
  try {
    const match = await Fixture.findById(req.params.id).populate('homeTeam awayTeam');
    if (!match) return res.status(404).json({ success: false, message: 'Match not found' });
    
    if (match.status !== 'live') {
      return res.json({ success: true, data: { minute: 0, display: '0\'' } });
    }
    
    const timeInfo = match.updateMatchTime();
    await match.save();
    
    res.json({ success: true, data: timeInfo });
  } catch (e) { 
    res.status(500).json({ success: false, message: 'Failed to get match time' }); 
  }
};

// PUT /api/fixtures/:id/event
exports.addEvent = async (req, res) => {
  try {
    const { minute, type, team, player, assist, goalType, fieldSide } = req.body;
    const match = await Fixture.findById(req.params.id).populate('homeTeam awayTeam');
    if (!match) return res.status(404).json({ success: false, message: 'Match not found' });
    if (match.status !== 'live') {
      // Auto-start if scheduled to avoid UX friction when admin adds first event
      if (match.status === 'scheduled') {
        match.status = 'live';
        if (!match.kickoffAt) match.kickoffAt = new Date();
        match.matchStartedAt = new Date();
        match.currentMinute = 0;
        match.addedTime = 0;
        match.isHalfTime = false;
        match.isFullTime = false;
        match.matchPhase = 'first_half';
        match.stoppageTimeAccumulated = 0;
        match.lastEventTime = new Date();
        match.timeAcceleration = match.timeAcceleration || 1;
      } else {
        return res.status(400).json({ success: false, message: 'Match not live' });
      }
    }
    
    // Create event object with basic fields
    const event = { minute: typeof minute === 'number' ? minute : Number(minute) || match.currentMinute || 0, type, team, player };
    
    // Add goal-specific fields if it's a goal
    if (type === 'goal') {
      if (assist) event.assist = assist;
      if (goalType) event.goalType = goalType;
      if (fieldSide) event.fieldSide = fieldSide;
    }
    // Allow shot metadata
    if (type === 'shot') {
      if (req.body.onTarget === true) event.onTarget = true;
      if (req.body.description) event.description = req.body.description;
    }
    // Corners and fouls need no extra fields
    
    match.events.push(event);
    if (type === 'goal') {
      if (team === 'home') match.score.home += 1; else match.score.away += 1;
    }
    
    // Add stoppage time based on event type (PES-style)
    match.addStoppageTime(type, minute);
    
    await match.save();
    const populated = await Fixture.findById(match._id).populate('homeTeam awayTeam');
    const io = req.app.get('io');
    io.emit('match:event', populated);
    res.json({ success: true, data: populated });
  } catch (e) { res.status(500).json({ success: false, message: 'Failed to add event' }); }
};

// PUT /api/fixtures/:id/finish
exports.finishMatch = async (req, res) => {
  try {
    const match = await Fixture.findById(req.params.id);
    if (!match) return res.status(404).json({ success: false, message: 'Match not found' });
    match.status = 'finished';
    match.finishedAt = new Date();
    await match.save();
    
    // Create comprehensive match data after finishing the match
    try {
      const matchData = await MatchData.createFromFixture(match);
      
      // Calculate team statistics from events
      const homeTeamEvents = match.events.filter(event => event.team === 'home');
      const awayTeamEvents = match.events.filter(event => event.team === 'away');
      
      // Compute shots and on-target using events, plus corners
      const homeShots = homeTeamEvents.filter(e => e.type === 'shot').length;
      const awayShots = awayTeamEvents.filter(e => e.type === 'shot').length;
      const homeOnTarget = homeTeamEvents.filter(e => e.type === 'shot' && (e.onTarget === true || e.description === 'on_target')).length;
      const awayOnTarget = awayTeamEvents.filter(e => e.type === 'shot' && (e.onTarget === true || e.description === 'on_target')).length;

      // Calculate possession based on match statistics
      const homePossession = calculatePossession(homeTeamEvents, awayTeamEvents, match.score.home, match.score.away);
      const awayPossession = 100 - homePossession;

      matchData.homeTeamStats = {
        teamId: match.homeTeam,
        teamName: match.homeTeam.name,
        finalScore: match.score.home,
        possession: homePossession,
        shots: homeShots,
        shotsOnTarget: homeOnTarget,
        corners: homeTeamEvents.filter(e => e.type === 'corner').length,
        fouls: homeTeamEvents.filter(e => e.type === 'foul').length,
        yellowCards: homeTeamEvents.filter(e => e.type === 'yellow_card').length,
        redCards: homeTeamEvents.filter(e => e.type === 'red_card').length,
        playerStats: calculatePlayerStats(homeTeamEvents)
      };
      
      matchData.awayTeamStats = {
        teamId: match.awayTeam,
        teamName: match.awayTeam.name,
        finalScore: match.score.away,
        possession: awayPossession,
        shots: awayShots,
        shotsOnTarget: awayOnTarget,
        corners: awayTeamEvents.filter(e => e.type === 'corner').length,
        fouls: awayTeamEvents.filter(e => e.type === 'foul').length,
        yellowCards: awayTeamEvents.filter(e => e.type === 'yellow_card').length,
        redCards: awayTeamEvents.filter(e => e.type === 'red_card').length,
        playerStats: calculatePlayerStats(awayTeamEvents)
      };
      
      // Add match summary based on events
      const goalEvents = match.events.filter(e => e.type === 'goal');
      const cardEvents = match.events.filter(e => e.type === 'yellow_card' || e.type === 'red_card');
      
      matchData.matchSummary = `Match completed with ${goalEvents.length} goals and ${cardEvents.length} cards shown.`;
      matchData.keyMoments = goalEvents.map(event => 
        `${event.minute}' - ${event.player} scored for ${event.team === 'home' ? match.homeTeam.name : match.awayTeam.name}`
      );
      
      await matchData.save();
      console.log('✅ Match data created successfully for fixture:', match._id);
      
      // Emit match data created event
      const io = req.app.get('io');
      io.emit('match-data:created', matchData);
      
    } catch (matchDataError) {
      console.error('⚠️ Failed to create match data:', matchDataError);
      // Continue with match finishing even if match data creation fails
    }
    
    const updatedTable = await updateTableForMatch({
      season: '2025',
      name: 'Default League',
      homeClubId: match.homeTeam,
      awayClubId: match.awayTeam,
      homeGoals: match.score.home,
      awayGoals: match.score.away
    });
    const populated = await Fixture.findById(match._id).populate('homeTeam awayTeam');
    const io = req.app.get('io');
    
    // Log final match completion
    if (match.isFinal) {
      console.log('🏆 Final match finished! Emitting events...');
    }
    
    io.emit('match:finished', populated);
    io.emit('table:updated', updatedTable);
    
    // Emit final:finished event if this is a final match
    if (match.isFinal) {
      io.emit('final:finished', populated);
    }

    // If all league matches finished, seed playoffs (semis then final)
    const remainingLeague = await Fixture.countDocuments({ stage: 'league', status: { $ne: 'finished' } });
    const existingSemis = await Fixture.find({ stage: 'semi' });
    const existingFinal = await Fixture.findOne({ stage: 'final' });
    if (remainingLeague === 0 && existingSemis.length === 0 && !existingFinal) {
      // Take top 4 from the table
      const standings = updatedTable.standings.slice(0, 4);
      if (standings.length >= 4) {
        const c1 = standings[0].club; const c2 = standings[1].club; const c3 = standings[2].club; const c4 = standings[3].club;
        const base = new Date(); base.setHours(18,0,0,0);
        const semi1 = await Fixture.create({ homeTeam: c1, awayTeam: c4, status: 'scheduled', stage: 'semi', isFinal: false, kickoffAt: base });
        const semi2 = await Fixture.create({ homeTeam: c2, awayTeam: c3, status: 'scheduled', stage: 'semi', isFinal: false, kickoffAt: new Date(base.getTime() + 2*60*60*1000) });
        const [s1,s2] = await Promise.all([
          Fixture.findById(semi1._id).populate('homeTeam awayTeam'),
          Fixture.findById(semi2._id).populate('homeTeam awayTeam')
        ]);
        io.emit('semi:created', s1);
        io.emit('semi:created', s2);
      }
    }

    // If both semis are finished and the final doesn't exist, create final
    const unfinishedSemis = await Fixture.countDocuments({ stage: 'semi', status: { $ne: 'finished' } });
    const finalExists = await Fixture.findOne({ stage: 'final' });
    if (unfinishedSemis === 0 && !finalExists) {
      // Determine winners by finished semi scores
      const semis = await Fixture.find({ stage: 'semi', status: 'finished' });
      if (semis.length === 2) {
        const winner = (m) => (m.score.home > m.score.away ? m.homeTeam : m.awayTeam);
        const w1 = winner(semis[0]);
        const w2 = winner(semis[1]);
        const finalKick = new Date(); finalKick.setHours(20,0,0,0);
        const final = await Fixture.create({ homeTeam: w1, awayTeam: w2, status: 'scheduled', stage: 'final', isFinal: true, kickoffAt: finalKick });
        const finalPop = await Fixture.findById(final._id).populate('homeTeam awayTeam');
        const io = req.app.get('io');
        io.emit('final:created', finalPop);
      }
    }

    res.json({ success: true, data: { match: populated, table: updatedTable } });
  } catch (e) { console.error(e); res.status(500).json({ success: false, message: 'Failed to finish match' }); }
};

// POST /api/fixtures/:id/simulate
exports.simulateMatch = async (req, res) => {
  try {
    const match = await Fixture.findById(req.params.id);
    if (!match) return res.status(404).json({ success: false, message: 'Match not found' });
    match.status = 'live';
    match.kickoffAt = new Date();
    const numEvents = Math.floor(Math.random() * 6); // up to 5 events
    for (let i = 0; i < numEvents; i++) {
      const minute = Math.floor(Math.random() * 90) + 1;
      const typePool = ['goal', 'yellow_card', 'foul', 'foul', 'yellow_card'];
      const type = typePool[Math.floor(Math.random() * typePool.length)];
      const team = Math.random() < 0.5 ? 'home' : 'away';
      const player = `Player ${Math.floor(Math.random() * 30) + 1}`;
      match.events.push({ minute, type, team, player });
      if (type === 'goal') team === 'home' ? match.score.home++ : match.score.away++;
    }
    match.status = 'finished';
    match.finishedAt = new Date();
    await match.save();
    const updatedTable = await updateTableForMatch({
      season: '2025',
      name: 'Default League',
      homeClubId: match.homeTeam,
      awayClubId: match.awayTeam,
      homeGoals: match.score.home,
      awayGoals: match.score.away
    });
    const populated = await Fixture.findById(match._id).populate('homeTeam awayTeam');
    const io = req.app.get('io');
    io.emit('match:finished', populated);
    io.emit('table:updated', updatedTable);
    
    // Emit final:finished event if this is a final match
    if (match.isFinal) {
      io.emit('final:finished', populated);
    }

    // Playoffs pipeline for simulation as well
    const remainingLeague = await Fixture.countDocuments({ stage: 'league', status: { $ne: 'finished' } });
    const existingSemis = await Fixture.find({ stage: 'semi' });
    const existingFinal = await Fixture.findOne({ stage: 'final' });
    if (remainingLeague === 0 && existingSemis.length === 0 && !existingFinal) {
      const standings = updatedTable.standings.slice(0, 4);
      if (standings.length >= 4) {
        const c1 = standings[0].club; const c2 = standings[1].club; const c3 = standings[2].club; const c4 = standings[3].club;
        const base = new Date(); base.setHours(18,0,0,0);
        const semi1 = await Fixture.create({ homeTeam: c1, awayTeam: c4, status: 'scheduled', stage: 'semi', isFinal: false, kickoffAt: base });
        const semi2 = await Fixture.create({ homeTeam: c2, awayTeam: c3, status: 'scheduled', stage: 'semi', isFinal: false, kickoffAt: new Date(base.getTime() + 2*60*60*1000) });
        const [s1,s2] = await Promise.all([
          Fixture.findById(semi1._id).populate('homeTeam awayTeam'),
          Fixture.findById(semi2._id).populate('homeTeam awayTeam')
        ]);
        io.emit('semi:created', s1);
        io.emit('semi:created', s2);
      }
    }
    const unfinishedSemis = await Fixture.countDocuments({ stage: 'semi', status: { $ne: 'finished' } });
    const finalExists = await Fixture.findOne({ stage: 'final' });
    if (unfinishedSemis === 0 && !finalExists) {
      const semis = await Fixture.find({ stage: 'semi', status: 'finished' });
      if (semis.length === 2) {
        const winner = (m) => (m.score.home > m.score.away ? m.homeTeam : m.awayTeam);
        const w1 = winner(semis[0]);
        const w2 = winner(semis[1]);
        const finalKick = new Date(); finalKick.setHours(20,0,0,0);
        const final = await Fixture.create({ homeTeam: w1, awayTeam: w2, status: 'scheduled', stage: 'final', isFinal: true, kickoffAt: finalKick });
        const finalPop = await Fixture.findById(final._id).populate('homeTeam awayTeam');
        io.emit('final:created', finalPop);
      }
    }

    res.json({ success: true, data: { match: populated, table: updatedTable } });
  } catch (e) { console.error(e); res.status(500).json({ success: false, message: 'Simulation failed' }); }
};

// PUT /api/fixtures/final/:id/finish-and-declare
exports.finishFinalAndDeclareChampion = async (req, res) => {
  try {
    const match = await Fixture.findById(req.params.id).populate('homeTeam awayTeam');
    if (!match || !match.isFinal) return res.status(404).json({ success: false, message: 'Final match not found' });
    match.status = 'finished';
    match.finishedAt = new Date();
    await match.save();
    const winner = match.score.home === match.score.away
      ? null
      : (match.score.home > match.score.away ? match.homeTeam : match.awayTeam);

    const io = req.app.get('io');
    io.emit('final:finished', match);
    if (winner) io.emit('league:champion', { championClub: winner });
    res.json({ success: true, data: { final: match, championClub: winner } });
  } catch (e) { res.status(500).json({ success: false, message: 'Failed to finish final' }); }
};

// GET /api/fixtures
exports.listFixtures = async (req, res) => {
  const fixtures = await Fixture.find().populate('homeTeam awayTeam').sort({ createdAt: 1 });
  
  // Add isScheduled field and match time to each fixture
  const fixturesWithScheduled = fixtures.map(fixture => {
    const fixtureObj = fixture.toObject();
    const isReady = !!(fixture.homeTeam && fixture.awayTeam && fixture.kickoffAt && fixture.venueName);
    fixtureObj.isScheduled = isReady;
    
    // Add current match time for live matches
    if (fixture.status === 'live') {
      const timeInfo = fixture.updateMatchTime();
      fixtureObj.currentTime = timeInfo;
    }
    
    return fixtureObj;
  });
  
  // Sort fixtures by priority: live > scheduled > finished, then by kickoff time
  const sortedFixtures = fixturesWithScheduled.sort((a, b) => {
    // Priority order: live (1), scheduled (2), finished (3)
    const getPriority = (fixture) => {
      if (fixture.status === 'live') return 1;
      if (fixture.status === 'scheduled' && fixture.isScheduled) return 2;
      if (fixture.status === 'scheduled' && !fixture.isScheduled) return 3;
      if (fixture.status === 'finished') return 4;
      return 5;
    };
    
    const priorityA = getPriority(a);
    const priorityB = getPriority(b);
    
    if (priorityA !== priorityB) {
      return priorityA - priorityB;
    }
    
    // Within same priority, sort by kickoff time (earliest first)
    const kickoffA = a.kickoffAt ? new Date(a.kickoffAt).getTime() : 0;
    const kickoffB = b.kickoffAt ? new Date(b.kickoffAt).getTime() : 0;
    
    if (kickoffA !== kickoffB) {
      return kickoffA - kickoffB;
    }
    
    // If no kickoff time, sort by creation time (newest first for unscheduled)
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
  
  res.json({ success: true, data: sortedFixtures });
};

// PUT /api/fixtures/:id/schedule
exports.scheduleMatch = async (req, res) => {
  try {
    const { kickoffAt, autoSimulate, venueName, homeTeamId, awayTeamId } = req.body;
    const match = await Fixture.findById(req.params.id);
    if (!match) return res.status(404).json({ success: false, message: 'Match not found' });

    // Prevent same club on both sides
    const finalHome = homeTeamId || (match.homeTeam && match.homeTeam.toString());
    const finalAway = awayTeamId || (match.awayTeam && match.awayTeam.toString());
    if (finalHome && finalAway && String(finalHome) === String(finalAway)) {
      return res.status(400).json({ success: false, message: 'Home and away teams must be different' });
    }

    if (kickoffAt) {
      const desired = new Date(kickoffAt);
      // Validate uniqueness and assign next available slot if taken
      const slotMs = 2 * 60 * 60 * 1000;
      let t = desired;
      let guard = 0;
      while (guard < 96) { // up to 8 days max guard
        const clash = await Fixture.exists({ _id: { $ne: match._id }, kickoffAt: t });
        if (!clash) break;
        t = new Date(t.getTime() + slotMs);
        guard++;
      }
      if (guard >= 96) return res.status(409).json({ success: false, message: 'Time slot already occupied. Please choose another time.' });
      match.kickoffAt = t;
    } else if (match.kickoffAt) {
      // Even if kickoffAt is not passed, validate the currently set time
      const slotMs = 2 * 60 * 60 * 1000;
      let t = new Date(match.kickoffAt);
      let guard = 0;
      while (guard < 96) {
        const clash = await Fixture.exists({ _id: { $ne: match._id }, kickoffAt: t });
        if (!clash) break;
        t = new Date(t.getTime() + slotMs);
        guard++;
      }
      if (guard >= 96) return res.status(409).json({ success: false, message: 'Time slot already occupied. Please choose another time.' });
      match.kickoffAt = t;
    }
    if (typeof autoSimulate === 'boolean') match.autoSimulate = autoSimulate;
    if (venueName !== undefined) match.venueName = venueName;
    if (homeTeamId) match.homeTeam = homeTeamId;
    if (awayTeamId) match.awayTeam = awayTeamId;

    // Mark as scheduled only when all fields present
    const isReady = !!(match.homeTeam && match.awayTeam && match.kickoffAt && match.venueName);
    match.isScheduled = isReady;
    try {
      await match.save();
    } catch (err) {
      // Handle unique index clashes from concurrent requests
      if (err && err.code === 11000 && err.keyPattern && err.keyPattern.kickoffAt) {
        return res.status(409).json({ success: false, message: 'Time slot already occupied. Please choose another time.' });
      }
      throw err;
    }
    const populated = await Fixture.findById(match._id).populate('homeTeam awayTeam');
    
    // Add isScheduled to the response
    const responseData = populated.toObject();
    responseData.isScheduled = isReady;
    
    res.json({ success: true, data: responseData });
  } catch (e) { res.status(500).json({ success: false, message: 'Failed to schedule match' }); }
};

// PUT /api/fixtures/:id/teams
exports.updateTeams = async (req, res) => {
  try {
    const { homeTeamId, awayTeamId } = req.body;
    const match = await Fixture.findById(req.params.id);
    if (!match) return res.status(404).json({ success: false, message: 'Match not found' });
    if (match.status !== 'scheduled') return res.status(400).json({ success: false, message: 'Teams can only be changed for scheduled matches' });
    if (!homeTeamId || !awayTeamId || homeTeamId === awayTeamId) return res.status(400).json({ success: false, message: 'Invalid team selection' });
    const Club = require('../models/Club');
    const home = await Club.findById(homeTeamId); const away = await Club.findById(awayTeamId);
    if (!home || !away) return res.status(400).json({ success: false, message: 'Club not found' });
    match.homeTeam = home._id; match.awayTeam = away._id;
    await match.save();
    const populated = await Fixture.findById(match._id).populate('homeTeam awayTeam');
    const io = req.app.get('io');
    io.emit('match:updated', populated);
    res.json({ success: true, data: populated });
  } catch (e) { res.status(500).json({ success: false, message: 'Failed to update teams' }); }
};

// POST /api/fixtures/reset
exports.resetLeague = async (req, res) => {
  try {
    await Fixture.deleteMany({});
    const LeagueTable = require('../models/LeagueTable');
    await LeagueTable.deleteMany({});
    res.json({ success: true, message: 'League reset: fixtures and table cleared' });
  } catch (e) {
    console.error('resetLeague error', e);
    res.status(500).json({ success: false, message: 'Failed to reset league' });
  }
};

// PUT /api/fixtures/:id/time-acceleration - Set time acceleration for PES-style gameplay
exports.setTimeAcceleration = async (req, res) => {
  try {
    const { acceleration } = req.body;
    const match = await Fixture.findById(req.params.id);
    if (!match) return res.status(404).json({ success: false, message: 'Match not found' });
    if (match.status !== 'live') return res.status(400).json({ success: false, message: 'Only live matches can have time acceleration changed' });
    
    match.setTimeAcceleration(acceleration);
    await match.save();
    
    res.json({ 
      success: true, 
      message: `Time acceleration set to ${acceleration} seconds per game minute`,
      data: { acceleration, phase: match.matchPhase }
    });
  } catch (e) {
    console.error('setTimeAcceleration error', e);
    res.status(500).json({ success: false, message: e.message || 'Failed to set time acceleration' });
  }
};

// PUT /api/fixtures/:id/manual-time - Manually set match time (for testing/admin)
exports.setManualTime = async (req, res) => {
  try {
    const { minute, phase } = req.body;
    const match = await Fixture.findById(req.params.id);
    if (!match) return res.status(404).json({ success: false, message: 'Match not found' });
    if (match.status !== 'live') return res.status(400).json({ success: false, message: 'Only live matches can have time set manually' });
    
    // Validate inputs
    if (minute < 0 || minute > 120) {
      return res.status(400).json({ success: false, message: 'Minute must be between 0 and 120' });
    }
    
    const validPhases = ['first_half', 'half_time', 'second_half', 'extra_time', 'full_time'];
    if (phase && !validPhases.includes(phase)) {
      return res.status(400).json({ success: false, message: 'Invalid phase' });
    }
    
    // Set manual time
    match.currentMinute = minute;
    if (phase) match.matchPhase = phase;
    
    // Update related flags
    match.isHalfTime = (phase === 'half_time');
    match.isFullTime = (phase === 'full_time');
    
    // Set timestamps for phase transitions
    const now = new Date();
    if (phase === 'half_time' && !match.firstHalfEndedAt) {
      match.firstHalfEndedAt = now;
    } else if (phase === 'second_half' && !match.secondHalfStartedAt) {
      match.secondHalfStartedAt = now;
    } else if (phase === 'extra_time' && !match.secondHalfEndedAt) {
      match.secondHalfEndedAt = now;
    } else if (phase === 'full_time' && !match.extraTimeEndedAt) {
      match.extraTimeEndedAt = now;
    }
    
    await match.save();
    
    const timeInfo = match.calculateCurrentTime();
    
    res.json({ 
      success: true, 
      message: `Match time set to ${minute}' (${phase || match.matchPhase})`,
      data: timeInfo
    });
  } catch (e) {
    console.error('setManualTime error', e);
    res.status(500).json({ success: false, message: 'Failed to set manual time' });
  }
};

// Helper function to calculate possession based on match statistics
function calculatePossession(homeEvents, awayEvents, homeGoals, awayGoals) {
  // Base possession starts at 50%
  let homePossession = 50;
  
  // Calculate statistics for both teams
  const homeShots = homeEvents.filter(e => e.type === 'shot').length;
  const awayShots = awayEvents.filter(e => e.type === 'shot').length;
  const homeShotsOnTarget = homeEvents.filter(e => e.type === 'shot' && (e.onTarget === true || e.description === 'on_target')).length;
  const awayShotsOnTarget = awayEvents.filter(e => e.type === 'shot' && (e.onTarget === true || e.description === 'on_target')).length;
  const homeCorners = homeEvents.filter(e => e.type === 'corner').length;
  const awayCorners = awayEvents.filter(e => e.type === 'corner').length;
  const homeFouls = homeEvents.filter(e => e.type === 'foul').length;
  const awayFouls = awayEvents.filter(e => e.type === 'foul').length;
  
  // Calculate total activity for normalization
  const totalShots = homeShots + awayShots;
  const totalShotsOnTarget = homeShotsOnTarget + awayShotsOnTarget;
  const totalCorners = homeCorners + awayCorners;
  const totalFouls = homeFouls + awayFouls;
  
  // Adjust possession based on different factors
  let possessionAdjustment = 0;
  
  // Goals scored (strongest factor) - 15% weight
  if (homeGoals > awayGoals) {
    possessionAdjustment += 15;
  } else if (awayGoals > homeGoals) {
    possessionAdjustment -= 15;
  }
  
  // Shots on target (strong factor) - 10% weight
  if (totalShotsOnTarget > 0) {
    const shotsOnTargetRatio = homeShotsOnTarget / totalShotsOnTarget;
    possessionAdjustment += (shotsOnTargetRatio - 0.5) * 20; // Scale to ±10%
  }
  
  // Total shots (medium factor) - 8% weight
  if (totalShots > 0) {
    const shotsRatio = homeShots / totalShots;
    possessionAdjustment += (shotsRatio - 0.5) * 16; // Scale to ±8%
  }
  
  // Corners (medium factor) - 6% weight
  if (totalCorners > 0) {
    const cornersRatio = homeCorners / totalCorners;
    possessionAdjustment += (cornersRatio - 0.5) * 12; // Scale to ±6%
  }
  
  // Fouls (negative factor) - 4% weight
  // More fouls = less possession (defensive play)
  if (totalFouls > 0) {
    const foulsRatio = homeFouls / totalFouls;
    possessionAdjustment -= (foulsRatio - 0.5) * 8; // Scale to ±4%
  }
  
  // Apply adjustment to base possession
  homePossession += possessionAdjustment;
  
  // Ensure possession stays within realistic bounds (20% - 80%)
  homePossession = Math.max(20, Math.min(80, homePossession));
  
  // Round to nearest integer
  return Math.round(homePossession);
}

// Helper function to calculate player statistics from events
function calculatePlayerStats(teamEvents) {
  const playerMap = new Map();
  
  teamEvents.forEach(event => {
    if (event.player) {
      if (!playerMap.has(event.player)) {
        playerMap.set(event.player, {
          playerName: event.player,
          goals: 0,
          assists: 0,
          yellowCards: 0,
          redCards: 0,
          fouls: 0,
          minutesPlayed: 90 // Default
        });
      }
      
      const playerStats = playerMap.get(event.player);
      
      switch (event.type) {
        case 'goal':
          playerStats.goals++;
          break;
        case 'shot':
          // Count shots in team-level, on-target rolled up later
          break;
        case 'assist':
          playerStats.assists++;
          break;
        case 'yellow_card':
          playerStats.yellowCards++;
          break;
        case 'red_card':
          playerStats.redCards++;
          break;
        case 'foul':
          playerStats.fouls++;
          break;
      }
    }
  });
  
  return Array.from(playerMap.values());
}

