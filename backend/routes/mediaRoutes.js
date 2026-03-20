const express = require('express');
const router = express.Router();
const { getMedia, addMedia, updateMedia, deleteMedia } = require('../controllers/mediaController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

router.route('/')
  .get(getMedia)
  .post(authenticateToken, requireAdmin, addMedia);

router.route('/:id')
  .put(authenticateToken, requireAdmin, updateMedia)
  .delete(authenticateToken, requireAdmin, deleteMedia);

module.exports = router;
