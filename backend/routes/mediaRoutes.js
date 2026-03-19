const express = require('express');
const router = express.Router();
const { getMedia, addMedia } = require('../controllers/mediaController');
const { verifyFirebaseToken, requireAdmin } = require('../middleware/auth');

router.route('/')
  .get(getMedia)
  .post(verifyFirebaseToken, requireAdmin, addMedia);

module.exports = router;
