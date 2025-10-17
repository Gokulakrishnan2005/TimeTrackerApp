/**
 * Session Routes
 *
 * Defines API endpoints for session management and time tracking
 * All routes are protected and require user authentication
 */

const express = require('express');
const {
  startSession,
  stopSession,
  getSessions,
  getActiveSession,
  updateSession,
  deleteSession,
  getSessionStats
} = require('../controllers/sessionController');
const { auth, checkOwnership } = require('../middleware/auth');

const router = express.Router();

// All session routes require authentication
router.use(auth);

/**
 * @route POST /api/sessions/start
 * @desc Start a new session
 * @access Private
 */
router.post('/start', startSession);

/**
 * @route GET /api/sessions/active
 * @desc Get current active session
 * @access Private
 */
router.get('/active', getActiveSession);

/**
 * @route GET /api/sessions
 * @desc Get all sessions with pagination and filters
 * @access Private
 */
router.get('/', getSessions);

/**
 * @route GET /api/sessions/stats
 * @desc Get session statistics
 * @access Private
 */
router.get('/stats', getSessionStats);

/**
 * @route PUT /api/sessions/:id
 * @desc Update session (experience notes)
 * @access Private
 */
router.put('/:id', checkOwnership(), updateSession);

/**
 * @route PUT /api/sessions/:id/stop
 * @desc Stop an active session
 * @access Private
 */
router.put('/:id/stop', checkOwnership(), stopSession);

/**
 * @route DELETE /api/sessions/:id
 * @desc Delete a session
 * @access Private
 */
router.delete('/:id', checkOwnership(), deleteSession);

module.exports = router;
