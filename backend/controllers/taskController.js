/**
 * Task Controller
 *
 * Handles daily tasks, habits, and goals management
 * Provides CRUD operations for task tracking and goal progress
 *
 * Features:
 * - Daily habit creation and streak tracking
 * - Daily task management with completion tracking
 * - Goal setting and progress tracking (weekly/monthly/yearly)
 * - Vision board management for yearly goals
 * - Habit completion with streak calculation
 * - Task completion toggling
 * - Goal progress updates
 */

const { Habit, DailyTask, Goal } = require('../models/Task');
const { createError, asyncHandler } = require('../middleware/errorHandler');

/**
 * Create a new daily habit
 * POST /api/tasks/habits
 *
 * @route POST /api/tasks/habits
 * @access Private (requires authentication)
 * @body {name, icon}
 */
const createHabit = asyncHandler(async (req, res) => {
  const { name, icon } = req.body;

  // Validate required fields
  if (!name) {
    throw createError('Habit name is required', 400);
  }

  // Create new habit
  const habit = new Habit({
    userId: req.user._id,
    name: name.trim(),
    icon: icon || '⭐'
  });

  // Save habit to database
  await habit.save();

  res.status(201).json({
    success: true,
    message: 'Habit created successfully',
    data: {
      habit
    }
  });
});

/**
 * Get all habits with today's completion status
 * GET /api/tasks/habits
 *
 * @route GET /api/tasks/habits
 * @access Private (requires authentication)
 */
const getHabits = asyncHandler(async (req, res) => {
  const habits = await Habit.getHabitsWithStatus(req.user._id);

  res.json({
    success: true,
    data: {
      habits
    }
  });
});

/**
 * Mark habit as completed for today
 * PUT /api/tasks/habits/:id/complete
 *
 * @route PUT /api/tasks/habits/:id/complete
 * @access Private (requires authentication)
 * @param {string} id - Habit ID
 */
const completeHabit = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Find the habit
  const habit = await Habit.findById(id);

  if (!habit) {
    throw createError('Habit not found', 404);
  }

  // Check if user owns this habit
  if (habit.userId.toString() !== req.user._id.toString()) {
    throw createError('Access denied. Not your habit.', 403);
  }

  // Idempotent behavior: if already completed today, return 200 without error
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const alreadyCompleted = habit.completedDates.some(date => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d.getTime() === today.getTime();
  });

  if (alreadyCompleted) {
    return res.json({
      success: true,
      message: 'Habit already completed today',
      data: { habit }
    });
  }

  // Complete the habit for today
  await habit.completeToday();

  res.json({
    success: true,
    message: 'Habit completed for today!',
    data: {
      habit
    }
  });
});

/**
 * Create a new daily task
 * POST /api/tasks/daily
 *
 * @route POST /api/tasks/daily
 * @access Private (requires authentication)
 * @body {title, description, date}
 */
const createDailyTask = asyncHandler(async (req, res) => {
  const { title, description, date } = req.body;

  // Validate required fields
  if (!title) {
    throw createError('Task title is required', 400);
  }

  // Create new daily task
  const task = new DailyTask({
    userId: req.user._id,
    title: title.trim(),
    description: description?.trim() || '',
    date: date ? new Date(date) : new Date()
  });

  // Save task to database
  await task.save();

  res.status(201).json({
    success: true,
    message: 'Daily task created successfully',
    data: {
      task
    }
  });
});

/**
 * Get daily tasks for a specific date
 * GET /api/tasks/daily
 *
 * @route GET /api/tasks/daily
 * @access Private (requires authentication)
 * @query {date} - Date to get tasks for (default: today)
 */
const getDailyTasks = asyncHandler(async (req, res) => {
  const date = req.query.date ? new Date(req.query.date) : new Date();
  const tasks = await DailyTask.getTasksForDate(req.user._id, date);

  res.json({
    success: true,
    data: {
      tasks,
      date
    }
  });
});

/**
 * Toggle daily task completion status
 * PUT /api/tasks/daily/:id/toggle
 *
 * @route PUT /api/tasks/daily/:id/toggle
 * @access Private (requires authentication)
 * @param {string} id - Task ID
 */
const toggleTaskCompletion = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Find the task
  const task = await DailyTask.findById(id);

  if (!task) {
    throw createError('Task not found', 404);
  }

  // Check if user owns this task
  if (task.userId.toString() !== req.user._id.toString()) {
    throw createError('Access denied. Not your task.', 403);
  }

  // Toggle completion status
  await task.toggleCompletion();

  res.json({
    success: true,
    message: task.isCompleted ? 'Task completed!' : 'Task marked as incomplete',
    data: {
      task
    }
  });
});

/**
 * Create a new goal (weekly, monthly, or yearly)
 * POST /api/goals
 *
 * @route POST /api/goals
 * @access Private (requires authentication)
 * @body {type, title, description, targetValue, unit, startDate, endDate}
 */
const createGoal = asyncHandler(async (req, res) => {
  const { type, title, description, targetValue, unit, startDate, endDate } = req.body;

  // Validate required fields
  if (!type || !title || !targetValue || !unit || !startDate || !endDate) {
    throw createError('Please provide type, title, targetValue, unit, startDate, and endDate', 400);
  }

  // Validate goal type
  if (!['weekly', 'monthly', 'yearly'].includes(type)) {
    throw createError('Type must be weekly, monthly, or yearly', 400);
  }

  // Validate dates
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (end <= start) {
    throw createError('End date must be after start date', 400);
  }

  // Create new goal
  const goal = new Goal({
    userId: req.user._id,
    type,
    title: title.trim(),
    description: description?.trim() || '',
    targetValue: parseInt(targetValue),
    currentValue: 0,
    unit: unit.trim(),
    startDate: start,
    endDate: end
  });

  // Save goal to database
  await goal.save();

  res.status(201).json({
    success: true,
    message: 'Goal created successfully',
    data: {
      goal
    }
  });
});

/**
 * Get goals by type
 * GET /api/goals
 *
 * @route GET /api/goals
 * @access Private (requires authentication)
 * @query {type} - Goal type filter (optional)
 */
const getGoals = asyncHandler(async (req, res) => {
  const { type } = req.query;

  let filter = { userId: req.user._id };

  if (type) {
    if (!['weekly', 'monthly', 'yearly'].includes(type)) {
      throw createError('Type must be weekly, monthly, or yearly', 400);
    }
    filter.type = type;
  }

  const goals = await Goal.getGoalsByType(req.user._id, type);

  res.json({
    success: true,
    data: {
      goals
    }
  });
});

/**
 * Update goal progress
 * PUT /api/goals/:id/progress
 *
 * @route PUT /api/goals/:id/progress
 * @access Private (requires authentication)
 * @param {string} id - Goal ID
 * @body {increment} - Amount to add to current value
 */
const updateGoalProgress = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { increment } = req.body;

  // Validate increment
  if (increment === undefined || increment === null) {
    throw createError('Please provide increment value', 400);
  }

  const incrementValue = parseInt(increment);
  if (isNaN(incrementValue)) {
    throw createError('Increment must be a valid number', 400);
  }

  // Find the goal
  const goal = await Goal.findById(id);

  if (!goal) {
    throw createError('Goal not found', 404);
  }

  // Check if user owns this goal
  if (goal.userId.toString() !== req.user._id.toString()) {
    throw createError('Access denied. Not your goal.', 403);
  }

  // Update progress
  await goal.updateProgress(incrementValue);

  res.json({
    success: true,
    message: 'Goal progress updated successfully',
    data: {
      goal
    }
  });
});

/**
 * Get vision board items (yearly goals with images)
 * GET /api/goals/vision
 *
 * @route GET /api/goals/vision
 * @access Private (requires authentication)
 */
const getVisionBoard = asyncHandler(async (req, res) => {
  const visionBoard = await Goal.getVisionBoard(req.user._id);

  res.json({
    success: true,
    data: {
      visionBoard
    }
  });
});

/**
 * Add image to vision board goal
 * PUT /api/goals/:id/vision
 *
 * @route PUT /api/goals/:id/vision
 * @access Private (requires authentication)
 * @param {string} id - Goal ID
 * @body {imageUrl} - Image URL for vision board
 */
const addVisionImage = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { imageUrl } = req.body;

  // Validate image URL
  if (!imageUrl) {
    throw createError('Image URL is required', 400);
  }

  // Find the goal
  const goal = await Goal.findById(id);

  if (!goal) {
    throw createError('Goal not found', 404);
  }

  // Check if user owns this goal
  if (goal.userId.toString() !== req.user._id.toString()) {
    throw createError('Access denied. Not your goal.', 403);
  }

  // Check if it's a yearly goal
  if (goal.type !== 'yearly') {
    throw createError('Only yearly goals can be added to vision board', 400);
  }

  // Add image URL
  goal.imageUrl = imageUrl;
  await goal.save();

  res.json({
    success: true,
    message: 'Image added to vision board successfully',
    data: {
      goal
    }
  });
});

/**
 * Delete a habit
 * DELETE /api/tasks/habits/:id
 *
 * @route DELETE /api/tasks/habits/:id
 * @access Private (requires authentication)
 * @param {string} id - Habit ID
 */
const deleteHabit = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Find the habit
  const habit = await Habit.findById(id);

  if (!habit) {
    throw createError('Habit not found', 404);
  }

  // Check if user owns this habit
  if (habit.userId.toString() !== req.user._id.toString()) {
    throw createError('Access denied. Not your habit.', 403);
  }

  // Delete the habit
  await Habit.findByIdAndDelete(id);

  res.json({
    success: true,
    message: 'Habit deleted successfully'
  });
});

/**
 * Delete a daily task
 * DELETE /api/tasks/daily/:id
 *
 * @route DELETE /api/tasks/daily/:id
 * @access Private (requires authentication)
 * @param {string} id - Task ID
 */
const deleteDailyTask = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Find the task
  const task = await DailyTask.findById(id);

  if (!task) {
    throw createError('Task not found', 404);
  }

  // Check if user owns this task
  if (task.userId.toString() !== req.user._id.toString()) {
    throw createError('Access denied. Not your task.', 403);
  }

  // Delete the task
  await DailyTask.findByIdAndDelete(id);

  res.json({
    success: true,
    message: 'Task deleted successfully'
  });
});

/**
 * Delete a goal
 * DELETE /api/goals/:id
 *
 * @route DELETE /api/goals/:id
 * @access Private (requires authentication)
 * @param {string} id - Goal ID
 */
const deleteGoal = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Find the goal
  const goal = await Goal.findById(id);

  if (!goal) {
    throw createError('Goal not found', 404);
  }

  // Check if user owns this goal
  if (goal.userId.toString() !== req.user._id.toString()) {
    throw createError('Access denied. Not your goal.', 403);
  }

  // Delete the goal
  await Goal.findByIdAndDelete(id);

  res.json({
    success: true,
    message: 'Goal deleted successfully'
  });
});

module.exports = {
  createHabit,
  getHabits,
  completeHabit,
  deleteHabit,
  createDailyTask,
  getDailyTasks,
  toggleTaskCompletion,
  deleteDailyTask,
  createGoal,
  getGoals,
  updateGoalProgress,
  deleteGoal,
  getVisionBoard,
  addVisionImage
};
