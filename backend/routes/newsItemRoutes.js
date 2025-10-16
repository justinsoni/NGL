const express = require('express');
const { body } = require('express-validator');
const { createNewsItem, getAllNewsItems, getNewsItemById, updateNewsItem, deleteNewsItem } = require('../controllers/adminNewsItemController');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { validateRequest } = require('../middleware/validation');

const router = express.Router();

// @route   POST /api/news
// @access  Private (Admin and Club Manager)
router.post('/',
  authenticateToken,
  requireRole(['admin', 'clubManager']),
  [
    body('title').notEmpty().withMessage('Title is required'),
    body('category').optional().isString(),
    body('type').optional().isString(),
    body('imageUrl').optional().isString(),
    body('summary').optional().isString(),
    body('content').optional().isString(),
    validateRequest
  ],
  createNewsItem
);


router.get('/', getAllNewsItems);

router.get('/:id', getNewsItemById);

router.put('/:id',
  authenticateToken,
  requireRole(['admin', 'clubManager']),
  updateNewsItem
);

router.delete('/:id',
  authenticateToken,
  requireRole(['admin', 'clubManager']),
  deleteNewsItem
);

module.exports = router;