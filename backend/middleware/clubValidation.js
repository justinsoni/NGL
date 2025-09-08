const { body } = require('express-validator');

// Validation rules for creating a club
const validateCreateClub = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Club name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Club name must be between 2 and 100 characters'),
  
  body('logo')
    .trim()
    .notEmpty()
    .withMessage('Club logo URL is required')
    .isURL()
    .withMessage('Please provide a valid logo URL'),
  
  body('stadium')
    .trim()
    .notEmpty()
    .withMessage('Stadium name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Stadium name must be between 2 and 100 characters'),
  
  body('stadiumCapacity')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Stadium capacity must be a positive number'),
  
  body('founded')
    .isInt({ min: 1800, max: new Date().getFullYear() })
    .withMessage(`Founded year must be between 1800 and ${new Date().getFullYear()}`),
  
  body('website')
    .optional()
    .trim()
    .isURL()
    .withMessage('Please provide a valid website URL'),
  
  body('email')
    .optional()
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  
  body('phone')
    .optional()
    .trim()
    .matches(/^[\+]?[1-9][\d]{0,15}$/)
    .withMessage('Please provide a valid phone number'),
  
  body('city')
    .trim()
    .notEmpty()
    .withMessage('City is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('City must be between 2 and 50 characters'),
  
  body('country')
    .trim()
    .notEmpty()
    .withMessage('Country is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('Country must be between 2 and 50 characters'),
  
  body('colors.primary')
    .optional()
    .trim()
    .isLength({ max: 20 })
    .withMessage('Primary color must be less than 20 characters'),
  
  body('colors.secondary')
    .optional()
    .trim()
    .isLength({ max: 20 })
    .withMessage('Secondary color must be less than 20 characters'),
  
  body('honours')
    .optional()
    .isArray()
    .withMessage('Honours must be an array'),
  
  body('honours.*.name')
    .if(body('honours').exists())
    .trim()
    .notEmpty()
    .withMessage('Honour name is required'),
  
  body('honours.*.count')
    .if(body('honours').exists())
    .isInt({ min: 0 })
    .withMessage('Honour count must be a positive number'),
  
  body('honours.*.years')
    .optional()
    .isArray()
    .withMessage('Honour years must be an array'),
  
  body('honours.*.years.*')
    .if(body('honours.*.years').exists())
    .isInt({ min: 1800, max: new Date().getFullYear() })
    .withMessage(`Year must be between 1800 and ${new Date().getFullYear()}`),
  
  // body('group')
  //   .optional()
  //   .isIn(['A', 'B', 'C', 'D'])
  //   .withMessage('Group must be A, B, C, or D'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description must be less than 1000 characters'),
  
  body('socialMedia.twitter')
    .optional()
    .trim()
    .isURL()
    .withMessage('Twitter URL must be valid'),
  
  body('socialMedia.facebook')
    .optional()
    .trim()
    .isURL()
    .withMessage('Facebook URL must be valid'),
  
  body('socialMedia.instagram')
    .optional()
    .trim()
    .isURL()
    .withMessage('Instagram URL must be valid'),
  
  body('socialMedia.youtube')
    .optional()
    .trim()
    .isURL()
    .withMessage('YouTube URL must be valid')
];

// Validation rules for updating a club (all fields optional except those that shouldn't change)
const validateUpdateClub = [
  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Club name cannot be empty')
    .isLength({ min: 2, max: 100 })
    .withMessage('Club name must be between 2 and 100 characters'),
  
  body('logo')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Club logo URL cannot be empty')
    .isURL()
    .withMessage('Please provide a valid logo URL'),
  
  body('stadium')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Stadium name cannot be empty')
    .isLength({ min: 2, max: 100 })
    .withMessage('Stadium name must be between 2 and 100 characters'),
  
  body('stadiumCapacity')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Stadium capacity must be a positive number'),
  
  body('founded')
    .optional()
    .isInt({ min: 1800, max: new Date().getFullYear() })
    .withMessage(`Founded year must be between 1800 and ${new Date().getFullYear()}`),
  
  body('website')
    .optional()
    .trim()
    .isURL()
    .withMessage('Please provide a valid website URL'),
  
  body('email')
    .optional()
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  
  body('phone')
    .optional()
    .trim()
    .matches(/^[\+]?[1-9][\d]{0,15}$/)
    .withMessage('Please provide a valid phone number'),
  
  body('city')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('City cannot be empty')
    .isLength({ min: 2, max: 50 })
    .withMessage('City must be between 2 and 50 characters'),
  
  body('country')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Country cannot be empty')
    .isLength({ min: 2, max: 50 })
    .withMessage('Country must be between 2 and 50 characters'),
  
  body('colors.primary')
    .optional()
    .trim()
    .isLength({ max: 20 })
    .withMessage('Primary color must be less than 20 characters'),
  
  body('colors.secondary')
    .optional()
    .trim()
    .isLength({ max: 20 })
    .withMessage('Secondary color must be less than 20 characters'),
  
  body('honours')
    .optional()
    .isArray()
    .withMessage('Honours must be an array'),
  
  body('honours.*.name')
    .if(body('honours').exists())
    .trim()
    .notEmpty()
    .withMessage('Honour name is required'),
  
  body('honours.*.count')
    .if(body('honours').exists())
    .isInt({ min: 0 })
    .withMessage('Honour count must be a positive number'),
  
  body('honours.*.years')
    .optional()
    .isArray()
    .withMessage('Honour years must be an array'),
  
  body('honours.*.years.*')
    .if(body('honours.*.years').exists())
    .isInt({ min: 1800, max: new Date().getFullYear() })
    .withMessage(`Year must be between 1800 and ${new Date().getFullYear()}`),
  
  body('group')
    .optional()
    .isIn(['A', 'B', 'C', 'D'])
    .withMessage('Group must be A, B, C, or D'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description must be less than 1000 characters'),
  
  body('socialMedia.twitter')
    .optional()
    .trim()
    .isURL()
    .withMessage('Twitter URL must be valid'),
  
  body('socialMedia.facebook')
    .optional()
    .trim()
    .isURL()
    .withMessage('Facebook URL must be valid'),
  
  body('socialMedia.instagram')
    .optional()
    .trim()
    .isURL()
    .withMessage('Instagram URL must be valid'),
  
  body('socialMedia.youtube')
    .optional()
    .trim()
    .isURL()
    .withMessage('YouTube URL must be valid')
];

module.exports = {
  validateCreateClub,
  validateUpdateClub
};
