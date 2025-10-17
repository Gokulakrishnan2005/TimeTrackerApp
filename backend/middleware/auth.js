/**
 * Authentication Middleware
 *
 * Handles JWT token verification and user authentication
 * Protects routes that require authenticated users
 * Extracts user information from JWT token and attaches to request object
 *
 * Features:
 * - JWT token verification using jsonwebtoken
 * - User lookup and attachment to request object
 * - Error handling for invalid or missing tokens
 * - Token expiration handling
 * - Role-based access control support (extensible)
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Authentication middleware function
 * Verifies JWT token from request headers and attaches user to request object
 *
 * Expected token format in headers:
 * Authorization: Bearer <token>
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const auth = async (req, res, next) => {
  try {
    // Extract token from Authorization header
    // Format: "Bearer <token>"
    const authHeader = req.header('Authorization');

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        error: 'Access denied. No token provided.'
      });
    }

    // Check if header starts with "Bearer "
    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Access denied. Invalid token format.'
      });
    }

    // Extract the token part (remove "Bearer ")
    const token = authHeader.substring(7);

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Access denied. No token provided.'
      });
    }

    try {
      // Verify the JWT token
      // jwt.verify() throws an error if token is invalid or expired
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Find the user associated with the token
      const user = await User.findById(decoded.userId).select('-password');

      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'Access denied. User not found.'
        });
      }

      // Attach user object to request for use in route handlers
      req.user = user;

      // Continue to next middleware/route handler
      next();

    } catch (jwtError) {
      // Handle specific JWT errors
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          error: 'Access denied. Token has expired.'
        });
      }

      if (jwtError.name === 'JsonWebTokenError') {
        return res.status(401).json({
          success: false,
          error: 'Access denied. Invalid token.'
        });
      }

      // Generic JWT error
      return res.status(401).json({
        success: false,
        error: 'Access denied. Token verification failed.'
      });
    }

  } catch (error) {
    console.error('Authentication middleware error:', error);

    res.status(500).json({
      success: false,
      error: 'Server error during authentication'
    });
  }
};

/**
 * Optional authentication middleware
 * Similar to auth() but doesn't fail if no token is provided
 * Useful for routes that work for both authenticated and unauthenticated users
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // No token provided, continue without authentication
      return next();
    }

    const token = authHeader.substring(7);

    if (!token) {
      return next();
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId).select('-password');

      if (user) {
        req.user = user;
      }

      next();

    } catch (jwtError) {
      // Invalid token, continue without authentication
      next();
    }

  } catch (error) {
    console.error('Optional authentication middleware error:', error);
    next();
  }
};

/**
 * Role-based authorization middleware factory
 * Creates middleware that checks if user has required role(s)
 *
 * @param {string|Array} roles - Required role(s) for access
 * @returns {Function} Middleware function
 */
const authorize = (roles) => {
  return (req, res, next) => {
    // Check if user is authenticated
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    // For now, we don't have roles in our User model
    // This is prepared for future role-based access control
    // You can extend the User model to include roles

    // If you need role-based access control, you would check:
    // if (!roles.includes(req.user.role)) {
    //   return res.status(403).json({
    //     success: false,
    //     error: 'Access denied. Insufficient permissions.'
    //   });
    // }

    next();
  };
};

/**
 * Middleware to check if user owns the resource
 * Useful for operations that require resource ownership
 * 
 * NOTE: This is a simplified version that doesn't fetch from DB.
 * The actual ownership check is done in the controller after fetching the resource.
 * This middleware just ensures the user is authenticated.
 *
 * @param {string} resourceUserIdField - Field name containing user ID in the resource (not used in this simplified version)
 * @returns {Function} Middleware function
 */
const checkOwnership = (resourceUserIdField = 'userId') => {
  return (req, res, next) => {
    // Check if user is authenticated
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    // User is authenticated, continue to controller
    // Controller will fetch resource and check ownership
    next();
  };
};

module.exports = {
  auth,
  optionalAuth,
  authorize,
  checkOwnership
};
