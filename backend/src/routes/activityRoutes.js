import express from 'express';
import {
  createActivity,
  getAllActivities,
  getActivityById,
  updateActivity,
  deleteActivity,
  getTeacherActivities,
  generateAIQuestions,
} from '../controllers/activityController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';
import { getOrCreateTeacherProfile } from '../utils/teacherHelper.js';

const router = express.Router();

// Get all activities
router.get('/', protect, getAllActivities);

// Teacher's own activities (MUST be before /:id to avoid conflict)
router.get('/teacher/me', protect, authorize('teacher', 'admin'), async (req, res, next) => {
  try {
    const teacher = await getOrCreateTeacherProfile(req.user._id);
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

// Generate AI questions/prompts (MUST be before /:id routes)
router.post('/generate-questions', protect, authorize('teacher', 'admin'), generateAIQuestions);

// Create activity
router.post('/', protect, authorize('teacher', 'admin'), createActivity);

// Update activity
router.put('/:id', protect, authorize('teacher', 'admin'), updateActivity);

// Delete activity
router.delete('/:id', protect, authorize('teacher', 'admin'), deleteActivity);

export default router;
