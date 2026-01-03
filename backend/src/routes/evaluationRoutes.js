import express from 'express';
import {
  getEvaluation,
  getEvaluationBySubmission,
  getEvaluationMistakes,
  reviewEvaluation,
  getPendingReviews,
  triggerEvaluation,
  retryEvaluation,
} from '../controllers/evaluationController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { isTeacherOrAdmin } from '../middleware/roleMiddleware.js';
import { mongoIdValidation } from '../utils/validators.js';
import { body } from 'express-validator';
import { handleValidationErrors } from '../utils/validators.js';
import { auditLog } from '../middleware/auditMiddleware.js';
import { AUDIT_ACTIONS } from '../config/constants.js';

const router = express.Router();

/**
 * @route   GET /api/evaluations/pending-review
 * @desc    Get evaluations pending teacher review
 * @access  Private (Teacher, Admin)
 */
router.get('/pending-review', authenticate, isTeacherOrAdmin, getPendingReviews);

/**
 * @route   POST /api/evaluations/evaluate/:submissionId
 * @desc    Manually trigger evaluation for submission
 * @access  Private (Teacher, Admin)
 */
router.post(
  '/evaluate/:submissionId',
  authenticate,
  isTeacherOrAdmin,
  mongoIdValidation,
  triggerEvaluation
);

/**
 * @route   POST /api/evaluations/retry/:submissionId
 * @desc    Retry failed evaluation
 * @access  Private (Teacher, Admin)
 */
router.post(
  '/retry/:submissionId',
  authenticate,
  isTeacherOrAdmin,
  mongoIdValidation,
  retryEvaluation
);

/**
 * @route   GET /api/evaluations/submission/:submissionId
 * @desc    Get evaluation by submission ID
 * @access  Private
 */
router.get(
  '/submission/:submissionId',
  authenticate,
  mongoIdValidation,
  getEvaluationBySubmission
);

/**
 * @route   GET /api/evaluations/:id/mistakes
 * @desc    Get mistakes for evaluation
 * @access  Private
 */
router.get('/:id/mistakes', authenticate, mongoIdValidation, getEvaluationMistakes);

/**
 * @route   PUT /api/evaluations/:id/review
 * @desc    Teacher review evaluation (FR11)
 * @access  Private (Teacher, Admin)
 */
router.put(
  '/:id/review',
  authenticate,
  isTeacherOrAdmin,
  mongoIdValidation,
  [
    body('overallScore')
      .optional()
      .isFloat({ min: 0, max: 100 })
      .withMessage('Overall score must be between 0 and 100'),
    body('grammarScore')
      .optional()
      .isFloat({ min: 0, max: 100 })
      .withMessage('Grammar score must be between 0 and 100'),
    body('vocabularyScore')
      .optional()
      .isFloat({ min: 0, max: 100 })
      .withMessage('Vocabulary score must be between 0 and 100'),
    body('pronunciationScore')
      .optional()
      .isFloat({ min: 0, max: 100 })
      .withMessage('Pronunciation score must be between 0 and 100'),
    body('logicScore')
      .optional()
      .isFloat({ min: 0, max: 100 })
      .withMessage('Logic score must be between 0 and 100'),
    body('teacherNotes')
      .optional()
      .isString()
      .withMessage('Teacher notes must be a string'),
    handleValidationErrors,
  ],
  auditLog(AUDIT_ACTIONS.UPDATE, 'Evaluation'),
  reviewEvaluation
);

/**
 * @route   GET /api/evaluations/:id
 * @desc    Get evaluation by ID
 * @access  Private
 */
router.get('/:id', authenticate, mongoIdValidation, getEvaluation);

export default router;
