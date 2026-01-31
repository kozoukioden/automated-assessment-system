import express from 'express';
import {
  getMyProfile,
  updateEnglishLevel,
  updatePreferences,
} from '../controllers/studentController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes require authentication and student role
router.use(protect);
router.use(authorize('student'));

// Get student profile
router.get('/me', getMyProfile);

// Update English level
router.put('/me/english-level', updateEnglishLevel);

// Update preferences
router.put('/me/preferences', updatePreferences);

export default router;
