/**
 * User Model & Authentication Schema
 *
 * Defines the User schema for MongoDB using Mongoose ODM
 * Handles user registration, authentication, and profile management
 *
 * Features:
 * - Password hashing with bcrypt (salt rounds: 10)
 * - Password comparison method for authentication
 * - Email and username uniqueness validation
 * - Password strength requirements
 * - Timestamps for creation and updates
 * - Security best practices (password not returned in queries)
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

/**
 * User Schema Definition
 * Defines the structure of user documents in MongoDB
 */
const userSchema = new mongoose.Schema({
  // User's display name
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [50, 'Name cannot be more than 50 characters']
  },

  // Unique username for user identification
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    lowercase: true,
    minlength: [3, 'Username must be at least 3 characters'],
    maxlength: [30, 'Username cannot be more than 30 characters'],
    match: [/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores']
  },

  // Unique email address for authentication and communication
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Please provide a valid email address'
    ]
  },

  // Hashed password for secure authentication
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false // Don't include password in queries by default
  },

  // User's avatar/profile picture URL (optional)
  avatar: {
    type: String,
    default: null
  },

  // Account creation and last update timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

/**
 * Pre-save middleware to hash password before saving to database
 *
 * This middleware runs before every save operation
 * Hashes the password only if it has been modified
 * Uses bcrypt with salt rounds of 10 for security
 *
 * Why we hash passwords:
 * - Prevents plaintext password storage in database
 * - Makes it computationally expensive to crack passwords
 * - Salt prevents rainbow table attacks
 * - 10 salt rounds provides good security vs performance balance
 */
userSchema.pre('save', async function(next) {
  // Only hash password if it has been modified (or is new)
  if (!this.isModified('password')) return next();

  try {
    // Generate salt for password hashing
    const salt = await bcrypt.genSalt(10);

    // Hash password using bcrypt
    // bcrypt.hash() is async and returns a promise
    this.password = await bcrypt.hash(this.password, salt);

    next();
  } catch (error) {
    next(error);
  }
});

/**
 * Instance method to compare candidate password with stored hash
 *
 * Used during login to verify user credentials
 * Compares plaintext password with stored hash
 *
 * @param {string} candidatePassword - Plaintext password to check
 * @returns {Promise<boolean>} True if passwords match, false otherwise
 */
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    // Use bcrypt.compare() to verify password
    // Returns true if candidatePassword matches the stored hash
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw error;
  }
};

/**
 * Instance method to generate JWT token for user authentication
 *
 * Creates a signed JWT token containing user's ID
 * Token expires in 30 days (configurable via environment variable)
 * Used for stateless authentication in API requests
 *
 * @returns {string} Signed JWT token
 */
userSchema.methods.generateAuthToken = function() {
  // Create payload with user ID
  const payload = {
    userId: this._id,
    email: this.email
  };

  // Sign token with secret key from environment variables
  // Token expires in 30 days (configurable)
  return jwt.sign(
    payload,
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRE || '30d'
    }
  );
};

/**
 * Virtual for user's profile (without sensitive data)
 * Returns user object without password and other sensitive fields
 */
userSchema.virtual('profile').get(function() {
  return {
    id: this._id,
    name: this.name,
    username: this.username,
    email: this.email,
    avatar: this.avatar,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt
  };
});

/**
 * Update the updatedAt field before saving
 * Ensures updatedAt is always current when document is modified
 */
userSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Create indexes for better query performance
// Compound index on email and username for faster lookups
userSchema.index({ email: 1 });
userSchema.index({ username: 1 });

// Create and export User model
const User = mongoose.model('User', userSchema);

module.exports = User;
