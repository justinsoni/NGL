const express = require('express');
const router = express.Router();
const { getCurrentTable, initializeTable } = require('../controllers/tableController');
const { authenticateToken, requireRole } = require('../middleware/auth');

router.get('/', getCurrentTable);
router.get('/initialize', initializeTable); // Public - auto-initialize if needed
router.post('/initialize', authenticateToken, requireRole(['admin']), initializeTable); // Admin only

module.exports = router;

