/**
 * Global Error Handling Middleware
 *
 * Centralized error handling for the Express.js application
 * Catches errors from routes and middleware, formats them consistently
 * Logs errors appropriately and sends user-friendly responses
 *
 * Features:
 * - Mongoose validation error formatting
 * - JWT error handling
 * - Development vs production error responses
 * - Structured error logging
 * - User-friendly error messages
 */

const mongoose = require('mongoose');

/**
 * Global error handler middleware
 * Must be the last middleware in the stack
 *
 * @param {Error} err - The error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const errorHandler = (err, req, res, next) => {
  // Log error for debugging (in development)
  if (process.env.NODE_ENV === 'development') {
    console.error('🔥 Error occurred:', err);
    console.error('📍 Stack trace:', err.stack);
  }

  // Default error status and message
  let statusCode = 500;
  let message = 'Internal Server Error';

  // Mongoose bad ObjectId error
  if (err.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid resource ID format';
  }

  // Mongoose duplicate key error
  else if (err.code === 11000) {
    statusCode = 400;
    const field = Object.keys(err.keyValue)[0];
    message = `${field} already exists`;
  }

  // Mongoose validation error
  else if (err.name === 'ValidationError') {
    statusCode = 400;
    const errors = Object.values(err.errors).map(val => val.message);
    message = `Validation Error: ${errors.join(', ')}`;
  }

  // JWT errors
  else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  }

  // JWT expired error
  else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  }

  // Custom application errors
  else if (err.statusCode) {
    statusCode = err.statusCode;
    message = err.message;
  }

  // Send error response
  res.status(statusCode).json({
    success: false,
    error: message,
    // Include stack trace only in development
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

/**
 * Create and throw custom application errors
 * Allows controllers to throw specific errors with custom status codes
 *
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code (default: 500)
 * @returns {Error} Custom error object
 */
const createError = (message, statusCode = 500) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

/**
 * Async error wrapper
 * Wraps async route handlers to catch rejected promises
 * Eliminates need for try-catch blocks in route handlers
 *
 * @param {Function} fn - Async function to wrap
 * @returns {Function} Wrapped function with error handling
 */
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

module.exports = {
  errorHandler,
  createError,
  asyncHandler
};
