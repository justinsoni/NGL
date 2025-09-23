const Fixture = require('../models/Fixture');
const Club = require('../models/Club');
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
    const clubs = await Club.find({ isActive: true }).sort({ name: 1 }).limit(4);
    if (clubs.length !== 4) return res.status(400).json({ success: false, message: 'Exactly 4 active clubs are required' });

    await ensureTableForSeason('2025', 'Default League', clubs.map(c => c._id));

    const existing = await Fixture.find({ isFinal: false });
    if (existing.length) await Fixture.deleteMany({ isFinal: false });

    const pairings = generateRoundRobinPairings(clubs.map(c => c._id));
    const docs = await Fixture.insertMany(pairings.map(p => ({ homeTeam: p.home, awayTeam: p.away, status: 'scheduled', isFinal: false })));
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
    await match.save();

    const io = req.app.get('io');
    io.emit('match:started', match);
    res.json({ success: true, data: match });
  } catch (e) { res.status(500).json({ success: false, message: 'Failed to start match' }); }
};

// PUT /api/fixtures/:id/event
exports.addEvent = async (req, res) => {
  try {
    const { minute, type, team, player } = req.body;
    const match = await Fixture.findById(req.params.id);
    if (!match) return res.status(404).json({ success: false, message: 'Match not found' });
    if (match.status !== 'live') return res.status(400).json({ success: false, message: 'Match not live' });
    match.events.push({ minute, type, team, player });
    if (type === 'goal') {
      if (team === 'home') match.score.home += 1; else match.score.away += 1;
    }
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

    // Check if all league matches finished and final not created yet
    const remaining = await Fixture.countDocuments({ isFinal: false, status: { $ne: 'finished' } });
    const finalExists = await Fixture.findOne({ isFinal: true });
    if (remaining === 0 && !finalExists) {
      const populatedTable = updatedTable; // already sorted
      const [clubA, clubB] = pickTopTwo(populatedTable);
      const final = await Fixture.create({ homeTeam: clubA, awayTeam: clubB, status: 'scheduled', isFinal: true });
      const finalPop = await Fixture.findById(final._id).populate('homeTeam awayTeam');
      io.emit('final:created', finalPop);
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

    // Final creation check
    const remaining = await Fixture.countDocuments({ isFinal: false, status: { $ne: 'finished' } });
    const finalExists = await Fixture.findOne({ isFinal: true });
    if (remaining === 0 && !finalExists) {
      const [clubA, clubB] = pickTopTwo(updatedTable);
      const final = await Fixture.create({ homeTeam: clubA, awayTeam: clubB, status: 'scheduled', isFinal: true });
      const finalPop = await Fixture.findById(final._id).populate('homeTeam awayTeam');
      io.emit('final:created', finalPop);
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
  res.json({ success: true, data: fixtures });
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

    if (kickoffAt) match.kickoffAt = new Date(kickoffAt);
    if (typeof autoSimulate === 'boolean') match.autoSimulate = autoSimulate;
    if (venueName !== undefined) match.venueName = venueName;
    if (homeTeamId) match.homeTeam = homeTeamId;
    if (awayTeamId) match.awayTeam = awayTeamId;

    // Mark as scheduled only when all fields present
    const isReady = !!(match.homeTeam && match.awayTeam && match.kickoffAt && match.venueName);
    match.isScheduled = isReady;
    await match.save();
    const populated = await Fixture.findById(match._id).populate('homeTeam awayTeam');
    res.json({ success: true, data: populated });
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

