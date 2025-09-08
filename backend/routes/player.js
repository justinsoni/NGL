const express = require('express');
const {
  registerPlayer,
  getPendingPlayers,
  approvePlayer,
  rejectPlayer,
  getApprovedPlayers
} = require('../controllers/playerController');
const router = express.Router();

router.post('/register', registerPlayer);

router.get('/', getPendingPlayers);
router.get('/approved', getApprovedPlayers);

router.post('/:registrationId/approve', approvePlayer);
router.post('/:registrationId/reject', rejectPlayer);

module.exports = router;