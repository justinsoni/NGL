const LeagueConfig = require('../models/LeagueConfig');

// GET /api/league-config
exports.getLeagueConfig = async (req, res) => {
  try {
    let config = await LeagueConfig.findOne({ isActive: true }).sort({ createdAt: -1 });
    
    // If no config exists, create a default one
    if (!config) {
      const now = new Date();
      const startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const endDate = new Date(now.getFullYear(), now.getMonth() + 2, now.getDate()); // 2 months from now
      
      config = await LeagueConfig.create({
        season: '2025',
        name: 'NGL',
        startDate,
        endDate,
        isActive: true
      });
    }
    
    res.json({ success: true, data: config });
  } catch (e) {
    console.error('getLeagueConfig error', e);
    res.status(500).json({ success: false, message: 'Failed to get league configuration' });
  }
};

// PUT /api/league-config
exports.updateLeagueConfig = async (req, res) => {
  try {
    const { startDate, endDate, name, description } = req.body;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ success: false, message: 'Start date and end date are required' });
    }
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (start >= end) {
      return res.status(400).json({ success: false, message: 'Start date must be before end date' });
    }
    
    if (start < new Date()) {
      return res.status(400).json({ success: false, message: 'Start date cannot be in the past' });
    }
    
    let config = await LeagueConfig.findOne({ isActive: true });
    
    if (config) {
      config.startDate = start;
      config.endDate = end;
      if (name) config.name = name;
      if (description !== undefined) config.description = description;
      await config.save();
    } else {
      config = await LeagueConfig.create({
        season: '2025',
        name: name || 'NGL',
        startDate: start,
        endDate: end,
        description,
        isActive: true
      });
    }
    
    res.json({ success: true, data: config, message: 'League configuration updated successfully' });
  } catch (e) {
    console.error('updateLeagueConfig error', e);
    res.status(500).json({ success: false, message: 'Failed to update league configuration' });
  }
};

// POST /api/league-config/reset
exports.resetLeagueConfig = async (req, res) => {
  try {
    // Deactivate current config
    await LeagueConfig.updateMany({ isActive: true }, { isActive: false });
    
    // Create new default config
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endDate = new Date(now.getFullYear(), now.getMonth() + 2, now.getDate());
    
    const config = await LeagueConfig.create({
      season: '2025',
      name: 'NGL',
      startDate,
      endDate,
      isActive: true
    });
    
    res.json({ success: true, data: config, message: 'League configuration reset successfully' });
  } catch (e) {
    console.error('resetLeagueConfig error', e);
    res.status(500).json({ success: false, message: 'Failed to reset league configuration' });
  }
};
