const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/leagueConfigController');
const { authenticateToken, requireRole } = require('../middleware/auth');

// GET /api/league-config - Get current league configuration
router.get('/', ctrl.getLeagueConfig);

// PUT /api/league-config - Update league configuration (admin only)
router.put('/', authenticateToken, requireRole(['admin']), ctrl.updateLeagueConfig);

// POST /api/league-config/reset - Reset league configuration (admin only)
router.post('/reset', authenticateToken, requireRole(['admin']), ctrl.resetLeagueConfig);

module.exports = router;
