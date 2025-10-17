/**
 * Authentication Controller
 *
 * Handles user authentication, registration, and profile management
 * Provides endpoints for login, signup, and user profile operations
 *
 * Features:
 * - User registration with validation
 * - Secure login with password verification
 * - JWT token generation and management
 * - User profile retrieval and updates
 * - Password change functionality
 * - Input validation and sanitization
 */

const User = require('../models/User');
const { createError, asyncHandler } = require('../middleware/errorHandler');

/**
 * Register new user
 * POST /api/auth/register
 *
 * @route POST /api/auth/register
 * @access Public
 * @body {name, username, email, password}
 */
const register = asyncHandler(async (req, res) => {
  const { name, username, email, password } = req.body;

  // Validate required fields
  if (!name || !username || !email || !password) {
    throw createError('Please provide name, username, email, and password', 400);
  }

  // Validate password length
  if (password.length < 6) {
    throw createError('Password must be at least 6 characters long', 400);
  }

  // Check if user already exists
  const existingUser = await User.findOne({
    $or: [
      { email: email.toLowerCase() },
      { username: username.toLowerCase() }
    ]
  });

  if (existingUser) {
    if (existingUser.email === email.toLowerCase()) {
      throw createError('User with this email already exists', 400);
    }
    if (existingUser.username === username.toLowerCase()) {
      throw createError('Username is already taken', 400);
    }
  }

  // Create new user
  const user = new User({
    name: name.trim(),
    username: username.toLowerCase().trim(),
    email: email.toLowerCase().trim(),
    password
  });

  // Save user to database (password will be hashed by pre-save middleware)
  await user.save();

  // Generate JWT token
  const token = user.generateAuthToken();

  // Return user data (without password) and token
  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: {
      user: user.profile,
      token
    }
  });
});

/**
 * Login user
 * POST /api/auth/login
 *
 * @route POST /api/auth/login
 * @access Public
 * @body {email, password}
 */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Validate required fields
  if (!email || !password) {
    throw createError('Please provide email and password', 400);
  }

  // Find user by email and include password for comparison
  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

  if (!user) {
    throw createError('Invalid email or password', 401);
  }

  // Compare provided password with stored hash
  const isPasswordValid = await user.comparePassword(password);

  if (!isPasswordValid) {
    throw createError('Invalid email or password', 401);
  }

  // Generate JWT token
  const token = user.generateAuthToken();

  // Return user data and token
  res.json({
    success: true,
    message: 'Login successful',
    data: {
      user: user.profile,
      token
    }
  });
});

/**
 * Get current user profile
 * GET /api/auth/me
 *
 * @route GET /api/auth/me
 * @access Private (requires authentication)
 */
const getMe = asyncHandler(async (req, res) => {
  // req.user is set by auth middleware
  const user = await User.findById(req.user._id);

  if (!user) {
    throw createError('User not found', 404);
  }

  res.json({
    success: true,
    data: {
      user: user.profile
    }
  });
});

/**
 * Update user profile
 * PUT /api/auth/profile
 *
 * @route PUT /api/auth/profile
 * @access Private (requires authentication)
 * @body {name, username, email, avatar}
 */
const updateProfile = asyncHandler(async (req, res) => {
  const { name, username, email, avatar } = req.body;

  // Find user and update profile fields
  const user = await User.findById(req.user._id);

  if (!user) {
    throw createError('User not found', 404);
  }

  // Update fields if provided
  if (name) user.name = name.trim();
  if (username) user.username = username.toLowerCase().trim();
  if (email) user.email = email.toLowerCase().trim();
  if (avatar !== undefined) user.avatar = avatar;

  // Save updated user
  await user.save();

  res.json({
    success: true,
    message: 'Profile updated successfully',
    data: {
      user: user.profile
    }
  });
});

/**
 * Change user password
 * PUT /api/auth/password
 *
 * @route PUT /api/auth/password
 * @access Private (requires authentication)
 * @body {currentPassword, newPassword}
 */
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  // Validate required fields
  if (!currentPassword || !newPassword) {
    throw createError('Please provide current password and new password', 400);
  }

  // Validate new password length
  if (newPassword.length < 6) {
    throw createError('New password must be at least 6 characters long', 400);
  }

  // Find user with password included for comparison
  const user = await User.findById(req.user._id).select('+password');

  if (!user) {
    throw createError('User not found', 404);
  }

  // Verify current password
  const isCurrentPasswordValid = await user.comparePassword(currentPassword);

  if (!isCurrentPasswordValid) {
    throw createError('Current password is incorrect', 400);
  }

  // Update password (will be hashed by pre-save middleware)
  user.password = newPassword;
  await user.save();

  res.json({
    success: true,
    message: 'Password changed successfully'
  });
});

/**
 * Logout user (client-side token removal)
 * POST /api/auth/logout
 *
 * Note: JWT tokens are stateless, so logout is handled client-side
 * This endpoint can be used for cleanup or logging purposes
 *
 * @route POST /api/auth/logout
 * @access Private (requires authentication)
 */
const logout = asyncHandler(async (req, res) => {
  // For stateless JWT, logout is handled client-side
  // This endpoint can be used for cleanup or audit logging

  res.json({
    success: true,
    message: 'Logout successful'
  });
});

module.exports = {
  register,
  login,
  getMe,
  updateProfile,
  changePassword,
  logout
};
