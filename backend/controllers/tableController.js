const LeagueTable = require('../models/LeagueTable');

exports.getCurrentTable = async (req, res) => {
  try {
    const table = await LeagueTable.findOne({}, null, { sort: { updatedAt: -1 } }).populate('standings.club', 'name logo');
    if (!table) return res.status(200).json({ success: true, data: { standings: [] } });
    res.json({ success: true, data: table });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Failed to fetch league table' });
  }
};

