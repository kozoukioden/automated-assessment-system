import Teacher from '../models/Teacher.js';
import Student from '../models/Student.js';
import User from '../models/User.js';
import Activity from '../models/Activity.js';
import Submission from '../models/Submission.js';
import Evaluation from '../models/Evaluation.js';
import { HTTP_STATUS, USER_ROLES } from '../config/constants.js';
import { asyncHandler, formatSuccessResponse } from '../utils/helpers.js';
import { AppError } from '../middleware/errorMiddleware.js';
import { getOrCreateTeacherProfile } from '../utils/teacherHelper.js';
import bcrypt from 'bcrypt';
import { logger } from '../utils/logger.js';

/**
 * @desc    Get current teacher profile
 * @route   GET /api/teacher/me
 * @access  Private (Teacher)
 */
export const getTeacherProfile = asyncHandler(async (req, res) => {
  const teacher = await getOrCreateTeacherProfile(req.user._id);
  await teacher.populate('userId', 'email name role');

  res.status(HTTP_STATUS.OK).json(
    formatSuccessResponse(
      { teacher },
      'Teacher profile retrieved successfully'
    )
  );
});

/**
 * @desc    Get students who submitted to teacher's activities
 * @route   GET /api/teacher/students
 * @access  Private (Teacher)
 */
export const getTeacherStudents = asyncHandler(async (req, res) => {
  const teacher = await getOrCreateTeacherProfile(req.user._id);

  // Get all activities by this teacher
  const activities = await Activity.find({ createdBy: teacher._id });
  const activityIds = activities.map(a => a._id);

  // Get all submissions for these activities
  const submissions = await Submission.find({ activityId: { $in: activityIds } })
    .populate({
      path: 'studentId',
      populate: {
        path: 'userId',
        select: 'email name'
      }
    });

  // Get unique students
  const studentMap = new Map();
  for (const sub of submissions) {
    if (sub.studentId && !studentMap.has(sub.studentId._id.toString())) {
      studentMap.set(sub.studentId._id.toString(), {
        _id: sub.studentId._id,
        studentId: sub.studentId.studentId,
        user: sub.studentId.userId,
        submissionCount: 1
      });
    } else if (sub.studentId) {
      const existing = studentMap.get(sub.studentId._id.toString());
      existing.submissionCount++;
    }
  }

  const students = Array.from(studentMap.values());

  res.status(HTTP_STATUS.OK).json(
    formatSuccessResponse(
      { students, count: students.length },
      'Students retrieved successfully'
    )
  );
});

/**
 * @desc    Get teacher analytics/dashboard data
 * @route   GET /api/teacher/analytics
 * @access  Private (Teacher)
 */
export const getTeacherAnalytics = asyncHandler(async (req, res) => {
  const { timeRange = 30 } = req.query;

  const teacher = await getOrCreateTeacherProfile(req.user._id);

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - parseInt(timeRange));

  // Get all activities by this teacher
  const activities = await Activity.find({ createdBy: teacher._id });
  const activityIds = activities.map(a => a._id);

  // Get submissions stats
  const submissions = await Submission.find({
    activityId: { $in: activityIds },
    createdAt: { $gte: startDate }
  });

  // Get evaluations for these submissions
  const submissionIds = submissions.map(s => s._id);
  const evaluations = await Evaluation.find({
    submissionId: { $in: submissionIds }
  });

  // Calculate stats
  const totalSubmissions = submissions.length;
  const completedEvaluations = evaluations.filter(e => e.status === 'completed').length;
  const pendingReviews = evaluations.filter(e => !e.teacherReviewed).length;

  const scores = evaluations
    .filter(e => e.overallScore !== undefined)
    .map(e => e.overallScore);
  const avgScore = scores.length > 0
    ? scores.reduce((a, b) => a + b, 0) / scores.length
    : 0;

  // Submissions by activity type
  const byType = {
    speaking: submissions.filter(s => s.contentType === 'speaking').length,
    writing: submissions.filter(s => s.contentType === 'writing').length,
    quiz: submissions.filter(s => s.contentType === 'quiz').length
  };

  // Submissions trend (last 7 days)
  const trend = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    const count = submissions.filter(s =>
      s.createdAt.toISOString().split('T')[0] === dateStr
    ).length;
    trend.push({ date: dateStr, count });
  }

  res.status(HTTP_STATUS.OK).json(
    formatSuccessResponse(
      {
        overview: {
          totalActivities: activities.length,
          totalSubmissions,
          completedEvaluations,
          pendingReviews,
          averageScore: Math.round(avgScore * 10) / 10
        },
        byType,
        trend,
        timeRange: parseInt(timeRange)
      },
      'Analytics retrieved successfully'
    )
  );
});

/**
 * @desc    Create a new student (Teacher can add students)
 * @route   POST /api/teacher/students
 * @access  Private (Teacher)
 */
export const createStudent = asyncHandler(async (req, res) => {
  const { email, password, name } = req.body;

  // Validate required fields
  if (!email || !password || !name) {
    throw new AppError('Email, password, and name are required', HTTP_STATUS.BAD_REQUEST);
  }

  // Check if user already exists
  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    throw new AppError('A user with this email already exists', HTTP_STATUS.CONFLICT);
  }

  // Hash password
  const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 10;
  const passwordHash = await bcrypt.hash(password, saltRounds);

  // Create user with student role
  const user = await User.create({
    email: email.toLowerCase(),
    passwordHash,
    name,
    role: USER_ROLES.STUDENT,
    isActive: true
  });

  // Create student profile
  const student = await Student.create({
    userId: user._id
  });

  logger.info(`Student created by teacher: ${user.email}`);

  res.status(HTTP_STATUS.CREATED).json(
    formatSuccessResponse(
      {
        student: {
          id: student._id,
          studentId: student.studentId,
          email: user.email,
          name: user.name,
        },
      },
      'Student created successfully'
    )
  );
});

export default {
  getTeacherProfile,
  getTeacherStudents,
  getTeacherAnalytics,
  createStudent
};
