/**
 * Task Model for Daily Tasks, Habits, and Goals
 *
 * Defines multiple schemas for comprehensive task and goal management:
 * - DailyHabit: Track recurring daily habits with streaks
 * - DailyTask: One-off daily tasks with completion tracking
 * - Goal: Weekly, monthly, and yearly goals with progress tracking
 *
 * Features:
 * - Habit streak calculation and maintenance
 * - Task completion tracking with dates
 * - Goal progress calculation and percentage tracking
 * - Flexible goal types (weekly, monthly, yearly)
 * - Vision board support for yearly goals
 */

const mongoose = require('mongoose');

/**
 * Daily Habit Schema
 * Tracks recurring daily habits with streak functionality
 */
const habitSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  // Habit name (e.g., "Drink Water", "Meditate")
  name: {
    type: String,
    required: [true, 'Habit name is required'],
    trim: true,
    maxlength: [100, 'Habit name cannot exceed 100 characters']
  },

  // Icon or emoji for the habit
  icon: {
    type: String,
    default: '⭐',
    maxlength: [10, 'Icon cannot exceed 10 characters']
  },

  // Current consecutive days completed
  currentStreak: {
    type: Number,
    default: 0,
    min: [0, 'Streak cannot be negative']
  },

  // Longest streak achieved
  longestStreak: {
    type: Number,
    default: 0,
    min: [0, 'Longest streak cannot be negative']
  },

  // Array of dates when habit was completed
  completedDates: [{
    type: Date,
    default: []
  }],

  // Whether habit was completed today (calculated field)
  isCompletedToday: {
    type: Boolean,
    default: false
  },

  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  toJSON: {
    virtuals: true,
    transform: function(doc, ret) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

/**
 * Daily Task Schema
 * One-off tasks for specific days
 */
const dailyTaskSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  // Task title
  title: {
    type: String,
    required: [true, 'Task title is required'],
    trim: true,
    maxlength: [200, 'Task title cannot exceed 200 characters']
  },

  // Optional task description
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Task description cannot exceed 500 characters']
  },

  // Whether task is completed
  isCompleted: {
    type: Boolean,
    default: false,
    index: true
  },

  // Date for which this task is scheduled
  date: {
    type: Date,
    required: true,
    index: true
  },

  // When task was completed (null if not completed)
  completedAt: {
    type: Date,
    default: null
  },

  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  toJSON: {
    virtuals: true,
    transform: function(doc, ret) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

/**
 * Goal Schema
 * Weekly, monthly, and yearly goals with progress tracking
 */
const goalSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  // Goal type: weekly, monthly, or yearly
  type: {
    type: String,
    enum: ['weekly', 'monthly', 'yearly'],
    required: true,
    index: true
  },

  // Goal title
  title: {
    type: String,
    required: [true, 'Goal title is required'],
    trim: true,
    maxlength: [200, 'Goal title cannot exceed 200 characters']
  },

  // Goal description
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Goal description cannot exceed 500 characters']
  },

  // Target value to achieve
  targetValue: {
    type: Number,
    required: [true, 'Target value is required'],
    min: [0, 'Target value cannot be negative']
  },

  // Current progress towards target
  currentValue: {
    type: Number,
    default: 0,
    min: [0, 'Current value cannot be negative'],
    validate: {
      validator: function(value) {
        return value <= this.targetValue;
      },
      message: 'Current value cannot exceed target value'
    }
  },

  // Unit of measurement (e.g., "workouts", "books", "hours")
  unit: {
    type: String,
    required: [true, 'Unit is required'],
    trim: true,
    maxlength: [50, 'Unit cannot exceed 50 characters']
  },

  // Calculated progress percentage
  progress: {
    type: Number,
    default: 0,
    min: [0, 'Progress cannot be negative'],
    max: [100, 'Progress cannot exceed 100%']
  },

  // Start date of the goal period
  startDate: {
    type: Date,
    required: true
  },

  // End date of the goal period
  endDate: {
    type: Date,
    required: true,
    validate: {
      validator: function(value) {
        return value > this.startDate;
      },
      message: 'End date must be after start date'
    }
  },

  // Whether goal is completed
  isCompleted: {
    type: Boolean,
    default: false
  },

  // For vision board items (yearly goals only)
  imageUrl: {
    type: String,
    default: null // URL to vision board image
  },

  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  toJSON: {
    virtuals: true,
    transform: function(doc, ret) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

/**
 * Habit Pre-save middleware
 * Updates streak information and today's completion status
 */
habitSchema.pre('save', function(next) {
  this.updatedAt = Date.now();

  // Calculate if habit was completed today
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayCompleted = this.completedDates.some(date => {
    const dateOnly = new Date(date);
    dateOnly.setHours(0, 0, 0, 0);
    return dateOnly.getTime() === today.getTime();
  });

  this.isCompletedToday = todayCompleted;

  // Update longest streak if current streak is higher
  if (this.currentStreak > this.longestStreak) {
    this.longestStreak = this.currentStreak;
  }

  next();
});

/**
 * Task Pre-save middleware
 * Updates completion timestamp when task is marked complete
 */
dailyTaskSchema.pre('save', function(next) {
  this.updatedAt = Date.now();

  if (this.isModified('isCompleted') && this.isCompleted && !this.completedAt) {
    this.completedAt = Date.now();
  }

  next();
});

/**
 * Goal Pre-save middleware
 * Calculates progress percentage
 */
goalSchema.pre('save', function(next) {
  this.updatedAt = Date.now();

  // Calculate progress percentage
  if (this.targetValue > 0) {
    this.progress = Math.min(100, (this.currentValue / this.targetValue) * 100);
  }

  // Mark as completed if progress reaches 100%
  if (this.progress >= 100 && !this.isCompleted) {
    this.isCompleted = true;
  }

  next();
});

/**
 * Habit instance method to mark habit as completed for today
 * Updates streak and completed dates
 *
 * @returns {Promise<Habit>} Updated habit document
 */
habitSchema.methods.completeToday = function() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Check if already completed today
  const todayCompleted = this.completedDates.some(date => {
    const dateOnly = new Date(date);
    dateOnly.setHours(0, 0, 0, 0);
    return dateOnly.getTime() === today.getTime();
  });

  if (todayCompleted) {
    throw new Error('Habit already completed today');
  }

  // Add today's date to completed dates
  this.completedDates.push(today);

  // Update streak
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(0, 0, 0, 0);

  // Check if yesterday was also completed (for streak continuity)
  const yesterdayCompleted = this.completedDates.some(date => {
    const dateOnly = new Date(date);
    dateOnly.setHours(0, 0, 0, 0);
    return dateOnly.getTime() === yesterday.getTime();
  });

  if (yesterdayCompleted) {
    this.currentStreak += 1;
  } else {
    this.currentStreak = 1; // Reset streak if gap
  }

  this.isCompletedToday = true;

  return this.save();
};

/**
 * Task instance method to toggle completion status
 *
 * @returns {Promise<Task>} Updated task document
 */
dailyTaskSchema.methods.toggleCompletion = function() {
  this.isCompleted = !this.isCompleted;
  this.completedAt = this.isCompleted ? Date.now() : null;
  return this.save();
};

/**
 * Goal instance method to update progress
 *
 * @param {number} increment - Amount to add to current value
 * @returns {Promise<Goal>} Updated goal document
 */
goalSchema.methods.updateProgress = function(increment) {
  this.currentValue = Math.max(0, this.currentValue + increment);
  return this.save();
};

/**
 * Static method to get habits with today's completion status
 *
 * @param {mongoose.Types.ObjectId} userId - The user's ID
 * @returns {Promise<Array>} Array of habits with completion status
 */
habitSchema.statics.getHabitsWithStatus = function(userId) {
  return this.find({ userId }).sort({ createdAt: -1 });
};

/**
 * Static method to get tasks for a specific date
 *
 * @param {mongoose.Types.ObjectId} userId - The user's ID
 * @param {Date} date - Date to get tasks for
 * @returns {Promise<Array>} Array of tasks for the specified date
 */
dailyTaskSchema.statics.getTasksForDate = function(userId, date) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  return this.find({
    userId,
    date: { $gte: startOfDay, $lte: endOfDay }
  }).sort({ createdAt: -1 });
};

/**
 * Static method to get goals by type
 *
 * @param {mongoose.Types.ObjectId} userId - The user's ID
 * @param {string} type - Goal type ('weekly', 'monthly', 'yearly')
 * @returns {Promise<Array>} Array of goals of specified type
 */
goalSchema.statics.getGoalsByType = function(userId, type) {
  return this.find({ userId, type }).sort({ createdAt: -1 });
};

/**
 * Static method to get vision board items (yearly goals with images)
 *
 * @param {mongoose.Types.ObjectId} userId - The user's ID
 * @returns {Promise<Array>} Array of vision board items
 */
goalSchema.statics.getVisionBoard = function(userId) {
  return this.find({
    userId,
    type: 'yearly',
    imageUrl: { $ne: null }
  }).sort({ createdAt: -1 });
};

// Create indexes for better query performance
habitSchema.index({ userId: 1, createdAt: -1 });
dailyTaskSchema.index({ userId: 1, date: -1 });
goalSchema.index({ userId: 1, type: 1 });

// Create and export models
const Habit = mongoose.model('Habit', habitSchema);
const DailyTask = mongoose.model('DailyTask', dailyTaskSchema);
const Goal = mongoose.model('Goal', goalSchema);

module.exports = {
  Habit,
  DailyTask,
  Goal
};
