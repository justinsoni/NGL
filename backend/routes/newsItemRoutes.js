const express = require('express');
const { body } = require('express-validator');
const { createNewsItem, getAllNewsItems, getNewsItemById, updateNewsItem, deleteNewsItem } = require('../controllers/adminNewsItemController');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { validateRequest } = require('../middleware/validation');

const router = express.Router();

// @route   POST /api/news
<<<<<<< HEAD
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
=======
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
>>>>>>> c2993bc032a26f6e84ff085a81c8101413c869db
    validateRequest
  ],
  createNewsItem
);


router.get('/', getAllNewsItems);

router.get('/:id', getNewsItemById);

router.put('/:id',
  authenticateToken,
<<<<<<< HEAD
  requireRole(['admin', 'clubManager']),
=======
  requireRole('admin'),
>>>>>>> c2993bc032a26f6e84ff085a81c8101413c869db
  updateNewsItem
);

router.delete('/:id',
  authenticateToken,
<<<<<<< HEAD
  requireRole(['admin', 'clubManager']),
=======
  requireRole('admin'),
>>>>>>> c2993bc032a26f6e84ff085a81c8101413c869db
  deleteNewsItem
);

module.exports = router;