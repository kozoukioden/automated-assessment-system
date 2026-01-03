import express from 'express';
import {
  createRubric,
  getRubrics,
  getRubric,
  updateRubric,
  deleteRubric,
  getTemplateRubrics,
  duplicateRubric,
} from '../controllers/rubricController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { isTeacherOrAdmin } from '../middleware/roleMiddleware.js';
import { mongoIdValidation } from '../utils/validators.js';
import { body } from 'express-validator';
import { handleValidationErrors } from '../utils/validators.js';
import { auditLog } from '../middleware/auditMiddleware.js';
import { AUDIT_ACTIONS } from '../config/constants.js';

const router = express.Router();

/**
 * @route   POST /api/rubrics
 * @desc    Create new rubric (FR12)
 * @access  Private (Teacher, Admin)
 */
router.post(
  '/',
  authenticate,
  isTeacherOrAdmin,
  [
    body('name')
      .notEmpty()
      .withMessage('Rubric name is required')
      .isLength({ min: 3, max: 200 })
      .withMessage('Name must be between 3 and 200 characters'),
    body('activityType')
      .isIn(['speaking', 'writing', 'quiz', 'general'])
      .withMessage('Invalid activity type'),
    body('criteria')
      .isArray({ min: 1 })
      .withMessage('At least one criterion is required'),
    body('criteria.*.name')
      .notEmpty()
      .withMessage('Criterion name is required'),
    body('criteria.*.weight')
      .isFloat({ min: 0, max: 1 })
      .withMessage('Criterion weight must be between 0 and 1'),
    handleValidationErrors,
  ],
  auditLog(AUDIT_ACTIONS.CREATE, 'Rubric'),
  createRubric
);

/**
 * @route   GET /api/rubrics/templates/:activityType
 * @desc    Get template rubrics for activity type
 * @access  Private
 */
router.get('/templates/:activityType', authenticate, getTemplateRubrics);

/**
 * @route   POST /api/rubrics/:id/duplicate
 * @desc    Duplicate rubric (create from template)
 * @access  Private (Teacher, Admin)
 */
router.post(
  '/:id/duplicate',
  authenticate,
  isTeacherOrAdmin,
  mongoIdValidation,
  auditLog(AUDIT_ACTIONS.CREATE, 'Rubric'),
  duplicateRubric
);

/**
 * @route   GET /api/rubrics
 * @desc    Get all rubrics with filters
 * @access  Private
 */
router.get('/', authenticate, getRubrics);

/**
 * @route   GET /api/rubrics/:id
 * @desc    Get rubric by ID
 * @access  Private
 */
router.get('/:id', authenticate, mongoIdValidation, getRubric);

/**
 * @route   PUT /api/rubrics/:id
 * @desc    Update rubric
 * @access  Private (Teacher - own, Admin - all)
 */
router.put(
  '/:id',
  authenticate,
  isTeacherOrAdmin,
  mongoIdValidation,
  [
    body('name')
      .optional()
      .isLength({ min: 3, max: 200 })
      .withMessage('Name must be between 3 and 200 characters'),
    body('criteria')
      .optional()
      .isArray({ min: 1 })
      .withMessage('At least one criterion is required'),
    handleValidationErrors,
  ],
  auditLog(AUDIT_ACTIONS.UPDATE, 'Rubric'),
  updateRubric
);

/**
 * @route   DELETE /api/rubrics/:id
 * @desc    Delete rubric (soft delete)
 * @access  Private (Teacher - own, Admin - all)
 */
router.delete(
  '/:id',
  authenticate,
  isTeacherOrAdmin,
  mongoIdValidation,
  auditLog(AUDIT_ACTIONS.DELETE, 'Rubric'),
  deleteRubric
);

export default router;
