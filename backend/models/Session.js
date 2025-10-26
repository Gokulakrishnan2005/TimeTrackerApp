/**
 * Session Model for Time Tracking
 *
 * Defines the Session schema for tracking user work/study sessions
 * Handles session lifecycle from creation to completion
 * Calculates duration automatically and tracks session metadata
 *
 * Features:
 * - Auto-incrementing session numbers per user
 * - Duration calculation when session ends
 * - Experience notes for reflection
 * - Status tracking (active/completed)
 * - Only one active session per user at a time
 */

const mongoose = require('mongoose');

/**
 * Session Schema Definition
 * Defines the structure of session documents in MongoDB
 */
const sessionSchema = new mongoose.Schema({
  // Reference to the user who owns this session
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true // Index for faster queries by user
  },

  // Auto-incrementing session number for each user
  // Calculated based on previous sessions for the user
  sessionNumber: {
    type: Number,
    required: true,
    min: [1, 'Session number must be at least 1']
  },

  // When the session started
  startDateTime: {
    type: Date,
    required: [true, 'Start date and time is required'],
    index: true // Index for sorting and querying by start time
  },

  // When the session ended (null if still active)
  endDateTime: {
    type: Date,
    default: null,
    validate: {
      // Custom validator to ensure end time is after start time
      validator: function(value) {
        if (value && this.startDateTime) {
          return value > this.startDateTime;
        }
        return true; // Allow null values
      },
      message: 'End time must be after start time'
    }
  },

  // Calculated duration in milliseconds
  // Automatically calculated when session ends
  duration: {
    type: Number,
    default: 0,
    min: [0, 'Duration cannot be negative']
  },

  // User's reflection notes about the session
  // What they worked on, insights, challenges, etc.
  experience: {
    type: String,
    default: '',
    maxlength: [2000, 'Experience notes cannot exceed 2000 characters'],
    trim: true
  },

  // Optional tag describing the session focus (e.g., Work, Study, etc.)
  tag: {
    type: String,
    default: null,
    trim: true,
    maxlength: [50, 'Tag cannot exceed 50 characters']
  },

  // Session status - active or completed
  status: {
    type: String,
    enum: ['active', 'completed'],
    default: 'active',
    index: true // Index for filtering active sessions
  },

  // Timestamps for creation and updates
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
 * Pre-validate middleware to ensure sessionNumber exists before required validation
 * Auto-increments per user for new sessions
 */
sessionSchema.pre('validate', async function(next) {
  if (this.isNew && (this.sessionNumber === undefined || this.sessionNumber === null)) {
    try {
      const lastSession = await this.constructor.findOne(
        { userId: this.userId },
        { sessionNumber: 1 },
        { sort: { sessionNumber: -1 } }
      );
      this.sessionNumber = lastSession ? lastSession.sessionNumber + 1 : 1;
    } catch (err) {
      return next(err);
    }
  }
  next();
});

/**
 * Pre-save middleware to calculate duration and timestamps
 *
 * 1. Update updatedAt timestamp
 * 2. Calculate duration if session is being completed
 */
sessionSchema.pre('save', async function(next) {
  // Update the updatedAt field
  this.updatedAt = Date.now();

  // If session is being completed and endDateTime is set, calculate duration
  if (this.isModified('endDateTime') && this.endDateTime) {
    this.duration = this.endDateTime.getTime() - this.startDateTime.getTime();

    // Ensure duration is not negative
    if (this.duration < 0) {
      this.duration = 0;
    }

    // Update status to completed
    this.status = 'completed';
  }

  next();
});

/**
 * Static method to find active session for a user
 * Returns the currently active session (if any)
 *
 * @param {mongoose.Types.ObjectId} userId - The user's ID
 * @returns {Promise<Session|null>} Active session or null
 */
sessionSchema.statics.findActiveSession = function(userId) {
  return this.findOne({
    userId,
    status: 'active'
  }).sort({ startDateTime: -1 }); // Most recent active session
};

/**
 * Static method to get total duration for all sessions of a user
 * Useful for calculating user's total tracked time
 *
 * @param {mongoose.Types.ObjectId} userId - The user's ID
 * @returns {Promise<number>} Total duration in milliseconds
 */
sessionSchema.statics.getTotalDuration = function(userId) {
  return this.aggregate([
    { $match: { userId, status: 'completed' } },
    { $group: { _id: null, total: { $sum: '$duration' } } }
  ]).then(result => result.length > 0 ? result[0].total : 0);
};

/**
 * Instance method to complete a session
 * Sets endDateTime, calculates duration, and updates status
 *
 * @param {string} experience - User's reflection notes
 * @returns {Promise<Session>} Updated session document
 */
sessionSchema.methods.completeSession = function(experience, tag) {
  this.endDateTime = new Date();
  this.experience = experience || '';
  if (tag !== undefined) {
    if (typeof tag === 'string' && tag.trim().length > 0) {
      this.tag = tag.trim().slice(0, 50);
    } else {
      this.tag = null;
    }
  }
  this.status = 'completed';

  // Duration will be calculated in pre-save middleware
  return this.save();
};

/**
 * Instance method to format duration for display
 * Returns duration in human-readable format (e.g., "2 hours 30 minutes")
 *
 * @returns {string} Formatted duration string
 */
sessionSchema.methods.getFormattedDuration = function() {
  const durationMs = this.duration;
  const hours = Math.floor(durationMs / (1000 * 60 * 60));
  const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));

  if (hours === 0) {
    return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
  }

  if (minutes === 0) {
    return `${hours} hour${hours !== 1 ? 's' : ''}`;
  }

  return `${hours} hour${hours !== 1 ? 's' : ''}, ${minutes} minute${minutes !== 1 ? 's' : ''}`;
};

/**
 * Virtual for session summary
 * Returns session data without sensitive information
 */
sessionSchema.virtual('summary').get(function() {
  return {
    id: this._id,
    sessionNumber: this.sessionNumber,
    startDateTime: this.startDateTime,
    endDateTime: this.endDateTime,
    duration: this.duration,
    formattedDuration: this.getFormattedDuration(),
    experience: this.experience,
    tag: this.tag,
    status: this.status,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt
  };
});

// Create indexes for better query performance
sessionSchema.index({ userId: 1, status: 1 }); // For finding active sessions
sessionSchema.index({ userId: 1, startDateTime: -1 }); // For sorting sessions by date
sessionSchema.index({ createdAt: -1 }); // For general sorting

// Create and export Session model
const Session = mongoose.model('Session', sessionSchema);

module.exports = Session;
