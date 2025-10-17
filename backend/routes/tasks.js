/**
 * Task Routes
 *
 * Defines API endpoints for task and goal management
 * Provides CRUD operations for habits, daily tasks, and goals
 * All routes are protected and require user authentication
 */

const express = require('express');
const {
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
} = require('../controllers/taskController');
const { auth, checkOwnership } = require('../middleware/auth');

const router = express.Router();

// All task routes require authentication
router.use(auth);

/**
 * Habit Routes
 */

/**
 * @route POST /api/tasks/habits
 * @desc Create a new daily habit
 * @access Private
 */
router.post('/habits', createHabit);

/**
 * @route GET /api/tasks/habits
 * @desc Get all habits with completion status
 * @access Private
 */
router.get('/habits', getHabits);

/**
 * @route PUT /api/tasks/habits/:id/complete
 * @desc Mark habit as completed for today
 * @access Private
 */
router.put('/habits/:id/complete', checkOwnership(), completeHabit);

/**
 * @route DELETE /api/tasks/habits/:id
 * @desc Delete a habit
 * @access Private
 */
router.delete('/habits/:id', checkOwnership(), deleteHabit);

/**
 * Daily Task Routes
 */

/**
 * @route POST /api/tasks/daily
 * @desc Create a new daily task
 * @access Private
 */
router.post('/daily', createDailyTask);

/**
 * @route GET /api/tasks/daily
 * @desc Get daily tasks for specific date
 * @access Private
 */
router.get('/daily', getDailyTasks);

/**
 * @route PUT /api/tasks/daily/:id/toggle
 * @desc Toggle task completion status
 * @access Private
 */
router.put('/daily/:id/toggle', checkOwnership(), toggleTaskCompletion);

/**
 * @route DELETE /api/tasks/daily/:id
 * @desc Delete a daily task
 * @access Private
 */
router.delete('/daily/:id', checkOwnership(), deleteDailyTask);

/**
 * Goal Routes
 */

/**
 * @route POST /api/goals
 * @desc Create a new goal (weekly, monthly, yearly)
 * @access Private
 */
router.post('/goals', createGoal);

/**
 * @route GET /api/goals
 * @desc Get goals by type (optional filter)
 * @access Private
 */
router.get('/goals', getGoals);

/**
 * @route PUT /api/goals/:id/progress
 * @desc Update goal progress
 * @access Private
 */
router.put('/goals/:id/progress', checkOwnership(), updateGoalProgress);

/**
 * @route DELETE /api/goals/:id
 * @desc Delete a goal
 * @access Private
 */
router.delete('/goals/:id', checkOwnership(), deleteGoal);

/**
 * @route GET /api/goals/vision
 * @desc Get vision board items (yearly goals with images)
 * @access Private
 */
router.get('/goals/vision', getVisionBoard);

/**
 * @route PUT /api/goals/:id/vision
 * @desc Add image to vision board goal
 * @access Private
 */
router.put('/goals/:id/vision', checkOwnership(), addVisionImage);

module.exports = router;
