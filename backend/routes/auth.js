const express = require('express');
const { body } = require('express-validator');
const { 
  registerUser, 
  getUserProfile, 
  updateUserProfile, 
  getAllUsers, 
  updateUserRole, 
  checkAuthMethod, 
  checkUserExists,
  validateUserForLogin
} = require('../controllers/authController');
const { 
  createManager, 
  getAllManagers, 
  getManagerById, 
  updateManager, 
  deactivateManager 
} = require('../controllers/managerController');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { validateRequest } = require('../middleware/validation');

const router = express.Router();

// Public routes
router.post('/register', [
  body('firebaseUid').notEmpty().withMessage('Firebase UID is required'),
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('role').optional().isIn(['admin', 'manager', 'clubManager', 'coach', 'registeredUser', 'user']).withMessage('Invalid role'),
  validateRequest
], registerUser);

router.post('/check-auth-method', [
  body('email').isEmail().withMessage('Valid email is required'),
  validateRequest
], checkAuthMethod);

router.post('/check-user-exists', [
  body('email').isEmail().withMessage('Valid email is required'),
  validateRequest
], checkUserExists);

router.post('/validate-user', [
  body('email').isEmail().withMessage('Valid email is required'),
  body('name').notEmpty().withMessage('Name is required for login'),
  validateRequest
], validateUserForLogin);

// Protected routes
router.get('/profile', authenticateToken, getUserProfile);

router.put('/update-profile', [
  authenticateToken,
  body('name').optional().notEmpty().withMessage('Name cannot be empty'),
  body('email').optional().isEmail().withMessage('Valid email is required'),
  validateRequest
], updateUserProfile);

// Admin only routes
router.get('/users', authenticateToken, requireRole('admin'), getAllUsers);

router.put('/users/:userId/role', [
  authenticateToken,
  requireRole('admin'),
  body('role').isIn(['admin', 'manager', 'clubManager', 'coach', 'registeredUser', 'user']).withMessage('Invalid role'),
  validateRequest
], updateUserRole);

// Manager management routes (Admin only)
router.post('/create-manager', [
  authenticateToken,
  requireRole('admin'),
  body('managerName').notEmpty().withMessage('Manager name is required'),
  body('managerEmail').isEmail().withMessage('Valid manager email is required'),
  body('clubName').notEmpty().withMessage('Club name is required'),
  validateRequest
], createManager);

router.get('/managers', authenticateToken, requireRole('admin'), getAllManagers);

router.get('/managers/:managerId', authenticateToken, requireRole('admin'), getManagerById);

router.put('/managers/:managerId', [
  authenticateToken,
  requireRole('admin'),
  body('name').optional().notEmpty().withMessage('Name cannot be empty'),
  body('club').optional().notEmpty().withMessage('Club cannot be empty'),
  validateRequest
], updateManager);

router.delete('/managers/:managerId', authenticateToken, requireRole('admin'), deactivateManager);

// Coach management routes (Club Manager only)
router.post('/create-coach', [
  authenticateToken,
  requireRole(['manager', 'clubManager']),
  body('name').notEmpty().withMessage('Coach name is required'),
  body('email').isEmail().withMessage('Valid coach email is required'),
  body('phone').notEmpty().withMessage('Phone number is required'),
  body('clubId').notEmpty().withMessage('Club ID is required'),
  validateRequest
], require('../controllers/coachController').createCoach);

module.exports = router;
