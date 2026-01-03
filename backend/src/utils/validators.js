import { body, param, query, validationResult } from 'express-validator';
import { HTTP_STATUS } from '../config/constants.js';

/**
 * Middleware to handle validation results
 */
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      errors: errors.array().map((err) => ({
        field: err.path,
        message: err.msg,
      })),
    });
  }
  next();
};

/**
 * User validation rules
 */
export const registerValidation = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail()
    .trim(),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  body('name')
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters')
    .trim(),
  body('role')
    .isIn(['student', 'teacher', 'admin'])
    .withMessage('Role must be student, teacher, or admin'),
  handleValidationErrors,
];

export const loginValidation = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail()
    .trim(),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  handleValidationErrors,
];

/**
 * Submission validation rules
 */
export const submissionValidation = [
  body('activityId')
    .isMongoId()
    .withMessage('Invalid activity ID'),
  body('contentType')
    .isIn(['speaking', 'writing', 'quiz'])
    .withMessage('Content type must be speaking, writing, or quiz'),
  body('content')
    .notEmpty()
    .withMessage('Content is required'),
  handleValidationErrors,
];

/**
 * Activity validation rules
 */
export const activityValidation = [
  body('title')
    .isLength({ min: 3, max: 200 })
    .withMessage('Title must be between 3 and 200 characters')
    .trim(),
  body('description')
    .isLength({ min: 10, max: 2000 })
    .withMessage('Description must be between 10 and 2000 characters')
    .trim(),
  body('activityType')
    .isIn(['speaking', 'writing', 'quiz'])
    .withMessage('Activity type must be speaking, writing, or quiz'),
  body('difficulty')
    .optional()
    .isIn(['beginner', 'intermediate', 'advanced'])
    .withMessage('Difficulty must be beginner, intermediate, or advanced'),
  handleValidationErrors,
];

/**
 * ID parameter validation
 */
export const mongoIdValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid ID format'),
  handleValidationErrors,
];

/**
 * Pagination validation
 */
export const paginationValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  handleValidationErrors,
];

export default {
  handleValidationErrors,
  registerValidation,
  loginValidation,
  submissionValidation,
  activityValidation,
  mongoIdValidation,
  paginationValidation,
};
