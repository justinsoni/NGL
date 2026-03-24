const express = require('express');
const router = express.Router();
const scoutController = require('../controllers/scoutController');
const { authenticateToken } = require('../middleware/auth');

router.post('/ask', authenticateToken, scoutController.askScoutAdvisor);
router.get('/players', authenticateToken, scoutController.getScoutPlayers);
router.get('/players/:id', authenticateToken, scoutController.getPlayerDetail);       // NEW: full detail
router.post('/players/:id/reject', authenticateToken, scoutController.rejectProspect);

module.exports = router;