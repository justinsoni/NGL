const express = require('express');
const router = express.Router();

// Import controllers
const {
  getClubs,
  getClub,
  createClub,
  updateClub,
  deleteClub,
  getClubStats
} = require('../controllers/clubController');

// Import middleware
const { authenticateToken, requireRole } = require('../middleware/auth');
const { validateCreateClub, validateUpdateClub } = require('../middleware/clubValidation');

// @route   GET /api/clubs/stats
// @desc    Get club statistics
// @access  Public
router.get('/stats', getClubStats);

// @route   GET /api/clubs
// @desc    Get all clubs with pagination and filtering
// @access  Public
router.get('/', getClubs);

// @route   GET /api/clubs/:id
// @desc    Get single club by ID
// @access  Public
router.get('/:id', getClub);

// @route   POST /api/clubs
// @desc    Create new club
// @access  Private (Admin only)
router.post('/', 
  authenticateToken, 
  requireRole(['admin']), 
  validateCreateClub, 
  createClub
);

// @route   PUT /api/clubs/:id
// @desc    Update club
// @access  Private (Admin only)
router.put('/:id', 
  authenticateToken, 
  requireRole(['admin']), 
  validateUpdateClub, 
  updateClub
);

// @route   DELETE /api/clubs/:id
// @desc    Delete club (hard delete - permanently removes from database)
// @access  Private (Admin only)
router.delete('/:id', 
  authenticateToken, 
  requireRole(['admin']), 
  deleteClub
);

module.exports = router;
