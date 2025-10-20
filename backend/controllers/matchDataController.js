const MatchData = require('../models/MatchData');
const Fixture = require('../models/Fixture');

// GET /api/match-data - Get all match data
exports.getAllMatchData = async (req, res) => {
  try {
    const { page = 1, limit = 20, stage, team } = req.query;
    const query = {};
    
    if (stage) query.stage = stage;
    if (team) {
      query.$or = [
        { homeTeam: team },
        { awayTeam: team }
      ];
    }
    
    const matchData = await MatchData.find(query)
      .populate('homeTeam awayTeam fixtureId', 'name logo')
      .sort({ completedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await MatchData.countDocuments(query);
    
    res.json({
      success: true,
      data: matchData,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching match data:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch match data' });
  }
};

// GET /api/match-data/:id - Get specific match data
exports.getMatchDataById = async (req, res) => {
  try {
    const matchData = await MatchData.findById(req.params.id)
      .populate('homeTeam awayTeam fixtureId', 'name logo');
    
    if (!matchData) {
      return res.status(404).json({ success: false, message: 'Match data not found' });
    }
    
    res.json({ success: true, data: matchData });
  } catch (error) {
    console.error('Error fetching match data:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch match data' });
  }
};

// GET /api/match-data/fixture/:fixtureId - Get match data by fixture ID
exports.getMatchDataByFixture = async (req, res) => {
  try {
    const matchData = await MatchData.findOne({ fixtureId: req.params.fixtureId })
      .populate('homeTeam awayTeam fixtureId', 'name logo');
    
    if (!matchData) {
      return res.status(404).json({ success: false, message: 'Match data not found for this fixture' });
    }
    
    res.json({ success: true, data: matchData });
  } catch (error) {
    console.error('Error fetching match data by fixture:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch match data' });
  }
};

// POST /api/match-data - Create match data from completed fixture
exports.createMatchData = async (req, res) => {
  try {
    const { fixtureId, ...additionalData } = req.body;
    
    if (!fixtureId) {
      return res.status(400).json({ success: false, message: 'Fixture ID is required' });
    }
    
    // Check if match data already exists for this fixture
    const existingMatchData = await MatchData.findOne({ fixtureId });
    if (existingMatchData) {
      return res.status(409).json({ success: false, message: 'Match data already exists for this fixture' });
    }
    
    // Get the fixture and ensure it's finished
    const fixture = await Fixture.findById(fixtureId).populate('homeTeam awayTeam');
    if (!fixture) {
      return res.status(404).json({ success: false, message: 'Fixture not found' });
    }
    
    if (fixture.status !== 'finished') {
      return res.status(400).json({ success: false, message: 'Can only create match data for finished fixtures' });
    }
    
    // Create match data from fixture
    const matchData = await MatchData.createFromFixture(fixture);
    
    // Add any additional data provided
    if (additionalData) {
      Object.assign(matchData, additionalData);
    }
    
    // Calculate team statistics from events
    matchData.homeTeamStats = calculateTeamStats(fixture.events, 'home', fixture.homeTeam.name, fixture.homeTeam._id);
    matchData.awayTeamStats = calculateTeamStats(fixture.events, 'away', fixture.awayTeam.name, fixture.awayTeam._id);
    
    await matchData.save();
    
    const populatedMatchData = await MatchData.findById(matchData._id)
      .populate('homeTeam awayTeam fixtureId', 'name logo');
    
    res.status(201).json({ success: true, data: populatedMatchData });
  } catch (error) {
    console.error('Error creating match data:', error);
    res.status(500).json({ success: false, message: 'Failed to create match data' });
  }
};

// PUT /api/match-data/:id - Update match data
exports.updateMatchData = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    // Remove fields that shouldn't be updated
    delete updateData.fixtureId;
    delete updateData.createdAt;
    
    const matchData = await MatchData.findByIdAndUpdate(
      id,
      { ...updateData, updatedAt: new Date() },
      { new: true, runValidators: true }
    ).populate('homeTeam awayTeam fixtureId', 'name logo');
    
    if (!matchData) {
      return res.status(404).json({ success: false, message: 'Match data not found' });
    }
    
    res.json({ success: true, data: matchData });
  } catch (error) {
    console.error('Error updating match data:', error);
    res.status(500).json({ success: false, message: 'Failed to update match data' });
  }
};

// DELETE /api/match-data/:id - Delete match data
exports.deleteMatchData = async (req, res) => {
  try {
    const matchData = await MatchData.findByIdAndDelete(req.params.id);
    
    if (!matchData) {
      return res.status(404).json({ success: false, message: 'Match data not found' });
    }
    
    res.json({ success: true, message: 'Match data deleted successfully' });
  } catch (error) {
    console.error('Error deleting match data:', error);
    res.status(500).json({ success: false, message: 'Failed to delete match data' });
  }
};

// GET /api/match-data/stats/team/:teamId - Get team's match statistics
exports.getTeamMatchStats = async (req, res) => {
  try {
    const { teamId } = req.params;
    const { limit = 10 } = req.query;
    
    const matchData = await MatchData.find({
      $or: [{ homeTeam: teamId }, { awayTeam: teamId }]
    })
    .populate('homeTeam awayTeam', 'name logo')
    .sort({ completedAt: -1 })
    .limit(parseInt(limit));
    
    // Calculate aggregated statistics
    const stats = {
      totalMatches: matchData.length,
      wins: 0,
      draws: 0,
      losses: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      recentMatches: matchData
    };
    
    matchData.forEach(match => {
      const isHomeTeam = match.homeTeam._id.toString() === teamId;
      const teamScore = isHomeTeam ? match.finalScore.home : match.finalScore.away;
      const opponentScore = isHomeTeam ? match.finalScore.away : match.finalScore.home;
      
      stats.goalsFor += teamScore;
      stats.goalsAgainst += opponentScore;
      
      if (teamScore > opponentScore) stats.wins++;
      else if (teamScore === opponentScore) stats.draws++;
      else stats.losses++;
    });
    
    stats.goalDifference = stats.goalsFor - stats.goalsAgainst;
    stats.winPercentage = stats.totalMatches > 0 ? (stats.wins / stats.totalMatches * 100).toFixed(1) : 0;
    
    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('Error fetching team match stats:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch team statistics' });
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

// Helper function to calculate team statistics from events
function calculateTeamStats(events, team, teamName, teamId) {
  const teamEvents = events.filter(event => event.team === team);
  const opponentEvents = events.filter(event => event.team !== team);
  
  // Calculate goals for both teams
  const teamGoals = teamEvents.filter(e => e.type === 'goal').length;
  const opponentGoals = opponentEvents.filter(e => e.type === 'goal').length;
  
  // Calculate possession based on match statistics
  const possession = team === 'home' 
    ? calculatePossession(teamEvents, opponentEvents, teamGoals, opponentGoals)
    : 100 - calculatePossession(opponentEvents, teamEvents, opponentGoals, teamGoals);
  
  const stats = {
    teamId,
    teamName,
    finalScore: teamGoals,
    possession: possession,
    shots: teamEvents.filter(e => e.type === 'shot').length,
    shotsOnTarget: teamEvents.filter(e => e.type === 'shot' && (e.onTarget === true || e.description === 'on_target')).length,
    corners: teamEvents.filter(e => e.type === 'corner').length,
    fouls: teamEvents.filter(e => e.type === 'foul').length,
    yellowCards: teamEvents.filter(e => e.type === 'yellow_card').length,
    redCards: teamEvents.filter(e => e.type === 'red_card').length,
    playerStats: []
  };
  
  // Create player statistics
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
  
  stats.playerStats = Array.from(playerMap.values());
  
  return stats;
}
