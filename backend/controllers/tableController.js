const LeagueTable = require('../models/LeagueTable');
const { initializeTableWithAllClubs } = require('../utils/leagueTable');

exports.getCurrentTable = async (req, res) => {
  try {
    const table = await LeagueTable.findOne({}, null, { sort: { updatedAt: -1 } }).populate('standings.club', 'name logo');
    if (!table) return res.status(200).json({ success: true, data: { standings: [] } });
    res.json({ success: true, data: table });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Failed to fetch league table' });
  }
};

exports.initializeTable = async (req, res) => {
  try {
    // Support both GET (query params) and POST (body)
    const season = req.query.season || req.body?.season || '2025';
    const name = req.query.name || req.body?.name || 'Default League';
    const table = await initializeTableWithAllClubs(season, name);
    res.json({ success: true, data: table, message: 'League table initialized with all clubs' });
  } catch (e) {
    console.error('Error initializing table:', e);
    res.status(500).json({ success: false, message: 'Failed to initialize league table' });
  }
};

