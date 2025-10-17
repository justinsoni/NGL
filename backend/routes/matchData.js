const express = require('express');
const router = express.Router();
const matchDataController = require('../controllers/matchDataController');
const { verifyFirebaseToken } = require('../middleware/auth');

// Apply authentication middleware to all routes
router.use(verifyFirebaseToken);

// GET /api/match-data - Get all match data with optional filtering
router.get('/', matchDataController.getAllMatchData);

// GET /api/match-data/:id - Get specific match data by ID
router.get('/:id', matchDataController.getMatchDataById);

// GET /api/match-data/fixture/:fixtureId - Get match data by fixture ID
router.get('/fixture/:fixtureId', matchDataController.getMatchDataByFixture);

// GET /api/match-data/stats/team/:teamId - Get team's match statistics
router.get('/stats/team/:teamId', matchDataController.getTeamMatchStats);

// POST /api/match-data - Create new match data from completed fixture
router.post('/', matchDataController.createMatchData);

// PUT /api/match-data/:id - Update existing match data
router.put('/:id', matchDataController.updateMatchData);

// DELETE /api/match-data/:id - Delete match data
router.delete('/:id', matchDataController.deleteMatchData);

module.exports = router;
