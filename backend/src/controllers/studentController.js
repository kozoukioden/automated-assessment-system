import Student from '../models/Student.js';
import { HTTP_STATUS, CEFR_LEVELS } from '../config/constants.js';
import { asyncHandler, formatSuccessResponse } from '../utils/helpers.js';
import { AppError } from '../middleware/errorMiddleware.js';
import { getOrCreateStudentProfile } from '../utils/studentHelper.js';
import { logger } from '../utils/logger.js';

/**
 * @desc    Get student profile
 * @route   GET /api/students/me
 * @access  Private (Student)
 */
export const getMyProfile = asyncHandler(async (req, res) => {
  const student = await getOrCreateStudentProfile(req.user._id);
  await student.populate('userId', 'email name role');

  res.status(HTTP_STATUS.OK).json(
    formatSuccessResponse({ student })
  );
});

/**
 * @desc    Update student's English level
 * @route   PUT /api/students/me/english-level
 * @access  Private (Student)
 */
export const updateEnglishLevel = asyncHandler(async (req, res) => {
  const { englishLevel } = req.body;

  if (!Object.values(CEFR_LEVELS).includes(englishLevel)) {
    throw new AppError('Invalid CEFR level. Must be one of: A1, A2, B1, B2, C1, C2', HTTP_STATUS.BAD_REQUEST);
  }

  const student = await getOrCreateStudentProfile(req.user._id);
  student.englishLevel = englishLevel;
  await student.save();

  logger.info(`Student ${student.studentId} updated English level to ${englishLevel}`);

  res.status(HTTP_STATUS.OK).json(
    formatSuccessResponse({ student }, 'English level updated successfully')
  );
});

/**
 * @desc    Update student preferences
 * @route   PUT /api/students/me/preferences
 * @access  Private (Student)
 */
export const updatePreferences = asyncHandler(async (req, res) => {
  const { notificationEnabled, emailNotifications, language } = req.body;

  const student = await getOrCreateStudentProfile(req.user._id);

  if (notificationEnabled !== undefined) {
    student.preferences.notificationEnabled = notificationEnabled;
  }
  if (emailNotifications !== undefined) {
    student.preferences.emailNotifications = emailNotifications;
  }
  if (language !== undefined) {
    student.preferences.language = language;
  }

  await student.save();

  logger.info(`Student ${student.studentId} updated preferences`);

  res.status(HTTP_STATUS.OK).json(
    formatSuccessResponse({ student }, 'Preferences updated successfully')
  );
});

export default {
  getMyProfile,
  updateEnglishLevel,
  updatePreferences,
};
