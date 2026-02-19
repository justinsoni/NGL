const express = require('express');
const {
  registerPlayer,
  getPendingPlayers,
  approvePlayer,
  rejectPlayer,
  getApprovedPlayers,
  recruitPlayer,
  verifyDocuments,
  unverifyDocuments
} = require('../controllers/playerController');
const { verifyFirebaseToken, requireClubManager } = require('../middleware/auth');
const router = express.Router();

router.post('/register', registerPlayer);
router.post('/recruit', verifyFirebaseToken, requireClubManager, recruitPlayer);

router.get('/', getPendingPlayers);
router.get('/approved', getApprovedPlayers);

router.post('/:registrationId/approve', verifyFirebaseToken, requireClubManager, approvePlayer);
// Update and delete approved players by id
router.put('/:playerId', verifyFirebaseToken, requireClubManager, require('../controllers/playerController').updatePlayer);
router.delete('/:playerId', verifyFirebaseToken, requireClubManager, require('../controllers/playerController').deletePlayer);
router.post('/:registrationId/reject', verifyFirebaseToken, requireClubManager, rejectPlayer);

// Document verification actions
router.post('/:playerId/verify-documents', verifyFirebaseToken, requireClubManager, verifyDocuments);
router.post('/:playerId/unverify-documents', verifyFirebaseToken, requireClubManager, unverifyDocuments);

module.exports = router;