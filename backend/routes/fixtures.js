const express = require('express');
const router = express.Router();
const { authenticateToken, requireRole } = require('../middleware/auth');
const ctrl = require('../controllers/fixtureController');

router.post('/generate', authenticateToken, requireRole(['admin']), ctrl.generateFixtures);
router.get('/', ctrl.listFixtures);
router.put('/:id/start', authenticateToken, requireRole(['admin']), ctrl.startMatch);
router.put('/:id/event', authenticateToken, requireRole(['admin']), ctrl.addEvent);
router.post('/:id/simulate', authenticateToken, requireRole(['admin']), ctrl.simulateMatch);
router.put('/:id/finish', authenticateToken, requireRole(['admin']), ctrl.finishMatch);
router.put('/:id/schedule', authenticateToken, requireRole(['admin']), ctrl.scheduleMatch);
router.put('/:id/teams', authenticateToken, requireRole(['admin']), ctrl.updateTeams);
router.post('/reset', authenticateToken, requireRole(['admin']), ctrl.resetLeague);
router.put('/final/:id/finish-and-declare', authenticateToken, requireRole(['admin']), ctrl.finishFinalAndDeclareChampion);

module.exports = router;

