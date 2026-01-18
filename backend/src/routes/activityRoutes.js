import express from 'express';
import {
  createActivity,
  getAllActivities,
  getActivityById,
  updateActivity,
  deleteActivity,
  getTeacherActivities,
} from '../controllers/activityController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';
import Teacher from '../models/Teacher.js';
import { HTTP_STATUS } from '../config/constants.js';

const router = express.Router();

// Get all activities
router.get('/', protect, getAllActivities);

// Teacher's own activities (MUST be before /:id to avoid conflict)
router.get('/teacher/me', protect, authorize('teacher', 'admin'), async (req, res, next) => {
  try {
    const teacher = await Teacher.findOne({ userId: req.user._id });
    if (!teacher) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Teacher profile not found'
      });
    }
    // Set teacherId param and forward to getTeacherActivities
    req.params.teacherId = teacher._id.toString();
    next();
  } catch (error) {
    next(error);
  }
}, getTeacherActivities);

// Teacher activities by ID (MUST be before /:id)
router.get('/teacher/:teacherId', protect, authorize('teacher', 'admin'), getTeacherActivities);

// Get single activity by ID (MUST be last among GET routes)
router.get('/:id', protect, getActivityById);

// Create activity
router.post('/', protect, authorize('teacher', 'admin'), createActivity);

// Update activity
router.put('/:id', protect, authorize('teacher', 'admin'), updateActivity);

// Delete activity
router.delete('/:id', protect, authorize('teacher', 'admin'), deleteActivity);

export default router;
