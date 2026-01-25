import express from 'express';
import {
  getTeacherProfile,
  getTeacherStudents,
  getTeacherAnalytics,
  createStudent
} from '../controllers/teacherController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { isTeacherOrAdmin } from '../middleware/roleMiddleware.js';

const router = express.Router();

/**
 * @route   GET /api/teacher/me
 * @desc    Get current teacher profile
 * @access  Private (Teacher, Admin)
 */
router.get('/me', authenticate, isTeacherOrAdmin, getTeacherProfile);

/**
 * @route   GET /api/teacher/students
 * @desc    Get students who submitted to teacher's activities
 * @access  Private (Teacher, Admin)
 */
router.get('/students', authenticate, isTeacherOrAdmin, getTeacherStudents);

/**
 * @route   POST /api/teacher/students
 * @desc    Create a new student account
 * @access  Private (Teacher, Admin)
 */
router.post('/students', authenticate, isTeacherOrAdmin, createStudent);

/**
 * @route   GET /api/teacher/analytics
 * @desc    Get teacher analytics/dashboard data
 * @access  Private (Teacher, Admin)
 */
router.get('/analytics', authenticate, isTeacherOrAdmin, getTeacherAnalytics);

export default router;
