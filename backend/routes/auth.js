const express = require('express');
const router = express.Router();

// Import controllers
const {
  registerUser,
  getUserProfile,
  updateUserProfile,
  getAllUsers,
  updateUserRole,
  checkAuthMethod,
  checkUserExists
} = require('../controllers/authController');

// Import User model for additional routes
const User = require('../models/User');

// Import middleware
const {
  verifyFirebaseToken,
  requireAdmin,
  requireOwnershipOrAdmin
} = require('../middleware/auth');

const {
  validateUserRegistration,
  validateProfileUpdate,
  validateObjectId,
  validatePagination,
  validateSearch,
  validateRoleUpdate
} = require('../middleware/validation');

// @route   POST /api/auth/register
// @desc    Register new user profile after Firebase signup
// @access  Public (but requires valid Firebase user)
router.post('/register', validateUserRegistration, registerUser);

// @route   POST /api/auth/check-auth-method
// @desc    Check if user signed up with Google or email/password
// @access  Public
router.post('/check-auth-method', checkAuthMethod);

// @route   POST /api/auth/check-user-exists
// @desc    Check if user exists by email
// @access  Public
router.post('/check-user-exists', checkUserExists);

// @route   GET /api/auth/profile
// @desc    Get current user profile
// @access  Private
router.get('/profile', verifyFirebaseToken, getUserProfile);

// @route   PUT /api/auth/update-profile
// @desc    Update current user profile
// @access  Private
router.put('/update-profile', verifyFirebaseToken, validateProfileUpdate, updateUserProfile);

// @route   GET /api/auth/users
// @desc    Get all users with pagination and filtering (Admin only)
// @access  Private (Admin only)
router.get('/users', verifyFirebaseToken, requireAdmin, validatePagination, validateSearch, getAllUsers);

// @route   PUT /api/auth/users/:userId/role
// @desc    Update user role (Admin only)
// @access  Private (Admin only)
router.put('/users/:userId/role', 
  verifyFirebaseToken, 
  requireAdmin, 
  validateObjectId('userId'), 
  validateRoleUpdate, 
  updateUserRole
);

// @route   GET /api/auth/users/:userId
// @desc    Get specific user profile (Admin or own profile)
// @access  Private
router.get('/users/:userId', 
  verifyFirebaseToken, 
  validateObjectId('userId'), 
  requireOwnershipOrAdmin, 
  async (req, res) => {
    try {
      const { userId } = req.params;
      
      const user = await User.findById(userId).select('-__v');
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      res.status(200).json({
        success: true,
        data: { user }
      });

    } catch (error) {
      console.error('Get user error:', error.message);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve user',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

// @route   DELETE /api/auth/users/:userId
// @desc    Deactivate user account (Admin only)
// @access  Private (Admin only)
router.delete('/users/:userId', 
  verifyFirebaseToken, 
  requireAdmin, 
  validateObjectId('userId'), 
  async (req, res) => {
    try {
      const { userId } = req.params;
      
      const user = await User.findById(userId);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Prevent deactivating the last admin
      if (user.role === 'admin') {
        const adminCount = await User.countDocuments({ role: 'admin', isActive: true });
        if (adminCount <= 1) {
          return res.status(400).json({
            success: false,
            message: 'Cannot deactivate the last admin user'
          });
        }
      }

      user.isActive = false;
      await user.save();

      res.status(200).json({
        success: true,
        message: 'User account deactivated successfully'
      });

    } catch (error) {
      console.error('Deactivate user error:', error.message);
      res.status(500).json({
        success: false,
        message: 'Failed to deactivate user',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

module.exports = router;
