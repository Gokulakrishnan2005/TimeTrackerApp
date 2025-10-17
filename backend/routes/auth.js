/**
 * Authentication Routes
 *
 * Defines API endpoints for user authentication and profile management
 * Uses authentication middleware to protect private routes
 */

const express = require('express');
const {
  register,
  login,
  getMe,
  updateProfile,
  changePassword,
  logout
} = require('../controllers/authController');
const { auth } = require('../middleware/auth');

const router = express.Router();

/**
 * @route POST /api/auth/register
 * @desc Register new user
 * @access Public
 */
router.post('/register', register);

/**
 * @route POST /api/auth/login
 * @desc Login user
 * @access Public
 */
router.post('/login', login);

/**
 * @route GET /api/auth/me
 * @desc Get current user profile
 * @access Private
 */
router.get('/me', auth, getMe);

/**
 * @route PUT /api/auth/profile
 * @desc Update user profile
 * @access Private
 */
router.put('/profile', auth, updateProfile);

/**
 * @route PUT /api/auth/password
 * @desc Change user password
 * @access Private
 */
router.put('/password', auth, changePassword);

/**
 * @route POST /api/auth/logout
 * @desc Logout user (client-side token removal)
 * @access Private
 */
router.post('/logout', auth, logout);

module.exports = router;
