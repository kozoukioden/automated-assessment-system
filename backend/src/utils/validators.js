// Simple validators compatible with Vercel serverless
import { HTTP_STATUS } from '../config/constants.js';
import mongoose from 'mongoose';

/**
 * Email validation
 */
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Password validation
 */
const isValidPassword = (password) => {
  return password && password.length >= 8 && /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password);
};

/**
 * MongoDB ObjectId validation
 */
const isValidMongoId = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
};

/**
 * Create validation error response
 */
const validationError = (res, errors) => {
  return res.status(HTTP_STATUS.BAD_REQUEST).json({
    success: false,
    errors: errors,
  });
};

/**
 * Register validation middleware
 */
export const registerValidation = (req, res, next) => {
  const errors = [];
  const { email, password, name, role } = req.body;

  if (!email || !isValidEmail(email)) {
    errors.push({ field: 'email', message: 'Please provide a valid email' });
  }

  if (!password || !isValidPassword(password)) {
    errors.push({
      field: 'password',
      message: 'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one number',
    });
  }

  if (!name || name.length < 2 || name.length > 100) {
    errors.push({ field: 'name', message: 'Name must be between 2 and 100 characters' });
  }

  if (!role || !['student', 'teacher', 'admin'].includes(role)) {
    errors.push({ field: 'role', message: 'Role must be student, teacher, or admin' });
  }

  if (errors.length > 0) {
    return validationError(res, errors);
  }

  next();
};

/**
 * Login validation middleware
 */
export const loginValidation = (req, res, next) => {
  const errors = [];
  const { email, password } = req.body;

  if (!email || !isValidEmail(email)) {
    errors.push({ field: 'email', message: 'Please provide a valid email' });
  }

  if (!password) {
    errors.push({ field: 'password', message: 'Password is required' });
  }

  if (errors.length > 0) {
    return validationError(res, errors);
  }

  next();
};

/**
 * Submission validation middleware
 */
export const submissionValidation = (req, res, next) => {
  const errors = [];
  const { activityId, contentType, content } = req.body;

  if (!activityId || !isValidMongoId(activityId)) {
    errors.push({ field: 'activityId', message: 'Invalid activity ID' });
  }

  if (!contentType || !['speaking', 'writing', 'quiz'].includes(contentType)) {
    errors.push({ field: 'contentType', message: 'Content type must be speaking, writing, or quiz' });
  }

  if (!content) {
    errors.push({ field: 'content', message: 'Content is required' });
  }

  if (errors.length > 0) {
    return validationError(res, errors);
  }

  next();
};

/**
 * Activity validation middleware
 */
export const activityValidation = (req, res, next) => {
  const errors = [];
  const { title, description, activityType, difficulty } = req.body;

  if (!title || title.length < 3 || title.length > 200) {
    errors.push({ field: 'title', message: 'Title must be between 3 and 200 characters' });
  }

  if (!description || description.length < 10 || description.length > 2000) {
    errors.push({ field: 'description', message: 'Description must be between 10 and 2000 characters' });
  }

  if (!activityType || !['speaking', 'writing', 'quiz'].includes(activityType)) {
    errors.push({ field: 'activityType', message: 'Activity type must be speaking, writing, or quiz' });
  }

  if (difficulty && !['beginner', 'intermediate', 'advanced'].includes(difficulty)) {
    errors.push({ field: 'difficulty', message: 'Difficulty must be beginner, intermediate, or advanced' });
  }

  if (errors.length > 0) {
    return validationError(res, errors);
  }

  next();
};

/**
 * MongoDB ID validation middleware
 */
export const mongoIdValidation = (req, res, next) => {
  const { id } = req.params;

  if (!id || !isValidMongoId(id)) {
    return validationError(res, [{ field: 'id', message: 'Invalid ID format' }]);
  }

  next();
};

/**
 * Pagination validation middleware
 */
export const paginationValidation = (req, res, next) => {
  const errors = [];
  const { page, limit } = req.query;

  if (page && (isNaN(page) || parseInt(page) < 1)) {
    errors.push({ field: 'page', message: 'Page must be a positive integer' });
  }

  if (limit && (isNaN(limit) || parseInt(limit) < 1 || parseInt(limit) > 100)) {
    errors.push({ field: 'limit', message: 'Limit must be between 1 and 100' });
  }

  if (errors.length > 0) {
    return validationError(res, errors);
  }

  next();
};

export default {
  registerValidation,
  loginValidation,
  submissionValidation,
  activityValidation,
  mongoIdValidation,
  paginationValidation,
};
