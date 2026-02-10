const express = require('express');
const router = express.Router();

// Import controllers
const {
    getProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct
} = require('../controllers/productController');

// Import middleware
const { authenticateToken, requireRole } = require('../middleware/auth');

// @route   GET /api/products
// @desc    Get all products
// @access  Public
router.get('/', getProducts);

// @route   GET /api/products/:id
// @desc    Get single product by ID
// @access  Public
router.get('/:id', getProductById);

// @route   POST /api/products
// @desc    Create new product
// @access  Private (Admin only)
router.post('/',
    authenticateToken,
    requireRole(['admin']),
    createProduct
);

// @route   PUT /api/products/:id
// @desc    Update product
// @access  Private (Admin only)
router.put('/:id',
    authenticateToken,
    requireRole(['admin']),
    updateProduct
);

// @route   DELETE /api/products/:id
// @desc    Delete product
// @access  Private (Admin only)
router.delete('/:id',
    authenticateToken,
    requireRole(['admin']),
    deleteProduct
);

module.exports = router;
