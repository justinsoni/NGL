const express = require('express');
const router = express.Router();
const matchDataController = require('../controllers/matchDataController');
const { verifyFirebaseToken } = require('../middleware/auth');

// Public routes - no authentication required for viewing match data
router.get('/', matchDataController.getAllMatchData);
router.get('/:id', matchDataController.getMatchDataById);
router.get('/fixture/:fixtureId', matchDataController.getMatchDataByFixture);
router.get('/stats/team/:teamId', matchDataController.getTeamMatchStats);

// Protected routes - require authentication for creating/updating/deleting
router.use(verifyFirebaseToken);
router.post('/', matchDataController.createMatchData);
router.put('/:id', matchDataController.updateMatchData);
router.delete('/:id', matchDataController.deleteMatchData);

module.exports = router;
