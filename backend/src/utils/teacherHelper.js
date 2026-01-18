import Teacher from '../models/Teacher.js';
import { logger } from './logger.js';

/**
 * Get existing Teacher profile or auto-create one if missing
 * This handles the case where a user with role='teacher' exists
 * but doesn't have a corresponding Teacher document yet
 *
 * @param {ObjectId} userId - The User document's _id
 * @returns {Promise<Teacher>} The Teacher document
 */
export const getOrCreateTeacherProfile = async (userId) => {
  let teacher = await Teacher.findOne({ userId });

  if (!teacher) {
    // Auto-create Teacher profile for existing teacher users
    // Use new + save() instead of create() to trigger pre-save hook
    // which auto-generates the teacherId field
    teacher = new Teacher({ userId });
    await teacher.save();
    logger.info(`Auto-created Teacher profile for userId: ${userId}, teacherId: ${teacher.teacherId}`);
  }

  return teacher;
};

export default { getOrCreateTeacherProfile };
