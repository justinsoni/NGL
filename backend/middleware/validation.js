const { body, param, query, validationResult } = require('express-validator');

// Middleware to handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(error => ({
        field: error.path,
        message: error.msg,
        value: error.value
      }))
    });
  }
  
  next();
};

// Validation rules for user registration
const validateUserRegistration = [
  body('firebaseUid')
    .notEmpty()
    .withMessage('Firebase UID is required')
    .isLength({ min: 1, max: 128 })
    .withMessage('Firebase UID must be between 1 and 128 characters'),
    
  body('name')
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters')
    .trim(),
    
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail()
    .isLength({ max: 255 })
    .withMessage('Email must not exceed 255 characters'),
    
  body('role')
    .optional()
    .isIn(['admin', 'registeredUser', 'clubManager', 'coach'])
    .withMessage('Role must be one of: admin, registeredUser, clubManager, coach'),
    
  body('club')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Club name must not exceed 100 characters')
    .trim(),
    
  handleValidationErrors
];

// Validation rules for profile update
const validateProfileUpdate = [
  body('name')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters')
    .trim(),
    
  body('email')
    .optional()
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail()
    .isLength({ max: 255 })
    .withMessage('Email must not exceed 255 characters'),
    
  body('role')
    .optional()
    .isIn(['admin', 'registeredUser', 'clubManager', 'coach'])
    .withMessage('Role must be one of: admin, registeredUser, clubManager, coach'),
    
  body('club')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Club name must not exceed 100 characters')
    .trim(),
    
  body('profile.phone')
    .optional()
    .matches(/^[\+]?[1-9][\d]{0,15}$/)
    .withMessage('Please provide a valid phone number'),
    
  body('profile.dateOfBirth')
    .optional()
    .isISO8601()
    .withMessage('Please provide a valid date of birth in ISO format'),
    
  body('profile.nationality')
    .optional()
    .isLength({ max: 50 })
    .withMessage('Nationality must not exceed 50 characters')
    .trim(),
    
  body('profile.position')
    .optional()
    .isIn(['Goalkeeper', 'Defender', 'Midfielder', 'Forward', 'Coach', 'Manager', 'Other'])
    .withMessage('Position must be one of: Goalkeeper, Defender, Midfielder, Forward, Coach, Manager, Other'),
    
  body('profile.bio')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Bio must not exceed 500 characters')
    .trim(),
    
  body('profile.avatar')
    .optional()
    .isURL()
    .withMessage('Avatar must be a valid URL'),
    
  handleValidationErrors
];

// Validation for MongoDB ObjectId parameters
const validateObjectId = (paramName) => [
  param(paramName)
    .isMongoId()
    .withMessage(`${paramName} must be a valid MongoDB ObjectId`),
  handleValidationErrors
];

// Validation for pagination query parameters
const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer')
    .toInt(),
    
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
    .toInt(),
    
  query('sort')
    .optional()
    .isIn(['createdAt', '-createdAt', 'name', '-name', 'email', '-email', 'role', '-role'])
    .withMessage('Sort must be one of: createdAt, -createdAt, name, -name, email, -email, role, -role'),
    
  handleValidationErrors
];

// Validation for search query
const validateSearch = [
  query('search')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search query must be between 1 and 100 characters')
    .trim(),
    
  query('role')
    .optional()
    .isIn(['admin', 'registeredUser', 'clubManager', 'coach'])
    .withMessage('Role filter must be one of: admin, registeredUser, clubManager, coach'),
    
  query('club')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Club filter must not exceed 100 characters')
    .trim(),
    
  handleValidationErrors
];

// Validation for role update (admin only)
const validateRoleUpdate = [
  body('role')
    .notEmpty()
    .withMessage('Role is required')
    .isIn(['admin', 'registeredUser', 'clubManager', 'coach'])
    .withMessage('Role must be one of: admin, registeredUser, clubManager, coach'),
    
  body('club')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Club name must not exceed 100 characters')
    .trim(),
    
  handleValidationErrors
];

module.exports = {
  handleValidationErrors,
  validateRequest: handleValidationErrors, // Alias for backward compatibility
  validateUserRegistration,
  validateProfileUpdate,
  validateObjectId,
  validatePagination,
  validateSearch,
  validateRoleUpdate
};
