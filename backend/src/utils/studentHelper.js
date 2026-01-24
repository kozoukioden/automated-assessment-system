import Student from '../models/Student.js';
import { logger } from './logger.js';

/**
 * Get existing Student profile or auto-create one if missing
 * This handles the case where a user with role='student' exists
 * but doesn't have a corresponding Student document yet
 *
 * @param {ObjectId} userId - The User document's _id
 * @returns {Promise<Student>} The Student document
 */
export const getOrCreateStudentProfile = async (userId) => {
  let student = await Student.findOne({ userId });

  if (!student) {
    // Auto-create Student profile for existing student users
    // Use new + save() instead of create() to trigger pre-validate hook
    // which auto-generates the studentId field
    student = new Student({ userId });
    await student.save();
    logger.info(`Auto-created Student profile for userId: ${userId}, studentId: ${student.studentId}`);
  }

  return student;
};

export default { getOrCreateStudentProfile };
