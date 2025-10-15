const express = require('express');
const { body } = require('express-validator');
const { createNewsItem, getAllNewsItems, getNewsItemById, updateNewsItem, deleteNewsItem } = require('../controllers/adminNewsItemController');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { validateRequest } = require('../middleware/validation');

const router = express.Router();

// @route   POST /api/news
// @access  Private (Admin only)
router.post('/',
  authenticateToken,
  requireRole('admin'),
  [
    body('title').notEmpty().withMessage('Title is required'),
    body('tag').optional().isString(),
    body('imageUrl').optional().isString(),
    body('subtitle').optional().isString(),
    body('content').notEmpty().withMessage('Content is required'),
    validateRequest
  ],
  createNewsItem
);


router.get('/', getAllNewsItems);

router.get('/:id', getNewsItemById);

router.put('/:id',
  authenticateToken,
  requireRole('admin'),
  updateNewsItem
);

router.delete('/:id',
  authenticateToken,
  requireRole('admin'),
  deleteNewsItem
);

module.exports = router;