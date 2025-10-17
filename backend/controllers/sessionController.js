/**
 * Session Controller
 *
 * Handles session creation, management, and time tracking operations
 * Provides CRUD operations for user sessions with business logic
 *
 * Features:
 * - Session lifecycle management (start, stop, update, delete)
 * - Duration calculation and validation
 * - Active session management (only one per user)
 * - Session history and filtering
 * - Experience note handling
 */

const Session = require('../models/Session');
const { createError, asyncHandler } = require('../middleware/errorHandler');

/**
 * Start a new session
 * POST /api/sessions/start
 *
 * @route POST /api/sessions/start
 * @access Private (requires authentication)
 */
const startSession = asyncHandler(async (req, res) => {
  // Check if user already has an active session
  const activeSession = await Session.findActiveSession(req.user._id);

  if (activeSession) {
    throw createError('You already have an active session. Please stop it before starting a new one.', 400);
  }

  // Determine next session number explicitly (defensive in case hooks are bypassed)
  const last = await Session.findOne(
    { userId: req.user._id },
    { sessionNumber: 1 },
    { sort: { sessionNumber: -1 } }
  );
  const nextNumber = last ? (last.sessionNumber || 0) + 1 : 1;

  // Create new session with computed sessionNumber
  const session = new Session({
    userId: req.user._id,
    sessionNumber: nextNumber,
    startDateTime: new Date(),
    status: 'active'
  });

  // Save session to database
  await session.save();

  res.status(201).json({
    success: true,
    message: 'Session started successfully',
    data: {
      session: session.summary
    }
  });
});

/**
 * Stop an active session
 * PUT /api/sessions/:id/stop
 *
 * @route PUT /api/sessions/:id/stop
 * @access Private (requires authentication)
 * @param {string} id - Session ID
 * @body {experience} - Optional experience notes
 */
const stopSession = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { experience } = req.body;

  // Find the session
  const session = await Session.findById(id);

  if (!session) {
    throw createError('Session not found', 404);
  }

  // Check if user owns this session
  if (session.userId.toString() !== req.user._id.toString()) {
    throw createError('Access denied. Not your session.', 403);
  }

  // Check if session is already completed
  if (session.status === 'completed') {
    throw createError('Session is already completed', 400);
  }

  // Complete the session with experience notes
  await session.completeSession(experience || '');

  res.json({
    success: true,
    message: 'Session stopped successfully',
    data: {
      session: session.summary
    }
  });
});

/**
 * Get all sessions for current user
 * GET /api/sessions
 *
 * @route GET /api/sessions
 * @access Private (requires authentication)
 * @query {limit, page, sort} - Pagination and sorting options
 */
const getSessions = asyncHandler(async (req, res) => {
  // Pagination options
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  // Sorting options
  const sortBy = req.query.sort || '-startDateTime'; // Default: newest first

  // Filter options
  const filter = { userId: req.user._id };

  // Add status filter if provided
  if (req.query.status) {
    filter.status = req.query.status;
  }

  // Add date range filter if provided
  if (req.query.startDate || req.query.endDate) {
    filter.startDateTime = {};
    if (req.query.startDate) {
      filter.startDateTime.$gte = new Date(req.query.startDate);
    }
    if (req.query.endDate) {
      filter.startDateTime.$lte = new Date(req.query.endDate);
    }
  }

  // Get sessions with pagination
  const sessions = await Session.find(filter)
    .sort(sortBy)
    .skip(skip)
    .limit(limit);

  // Get total count for pagination info
  const total = await Session.countDocuments(filter);

  res.json({
    success: true,
    data: {
      sessions: sessions.map(session => session.summary),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }
  });
});

/**
 * Get current active session
 * GET /api/sessions/active
 *
 * @route GET /api/sessions/active
 * @access Private (requires authentication)
 */
const getActiveSession = asyncHandler(async (req, res) => {
  const activeSession = await Session.findActiveSession(req.user._id);

  if (!activeSession) {
    return res.json({
      success: true,
      data: {
        session: null,
        message: 'No active session'
      }
    });
  }

  res.json({
    success: true,
    data: {
      session: activeSession.summary
    }
  });
});

/**
 * Update session (for experience notes or other details)
 * PUT /api/sessions/:id
 *
 * @route PUT /api/sessions/:id
 * @access Private (requires authentication)
 * @param {string} id - Session ID
 * @body {experience} - Updated experience notes
 */
const updateSession = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { experience } = req.body;

  // Find the session
  const session = await Session.findById(id);

  if (!session) {
    throw createError('Session not found', 404);
  }

  // Check if user owns this session
  if (session.userId.toString() !== req.user._id.toString()) {
    throw createError('Access denied. Not your session.', 403);
  }

  // Update experience notes if provided
  if (experience !== undefined) {
    session.experience = experience.trim();
  }

  // Save updated session
  await session.save();

  res.json({
    success: true,
    message: 'Session updated successfully',
    data: {
      session: session.summary
    }
  });
});

/**
 * Delete a session
 * DELETE /api/sessions/:id
 *
 * @route DELETE /api/sessions/:id
 * @access Private (requires authentication)
 * @param {string} id - Session ID
 */
const deleteSession = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Find the session
  const session = await Session.findById(id);

  if (!session) {
    throw createError('Session not found', 404);
  }

  // Check if user owns this session
  if (session.userId.toString() !== req.user._id.toString()) {
    throw createError('Access denied. Not your session.', 403);
  }

  // Don't allow deletion of active sessions
  if (session.status === 'active') {
    throw createError('Cannot delete active session. Please stop it first.', 400);
  }

  // Delete the session
  await Session.findByIdAndDelete(id);

  res.json({
    success: true,
    message: 'Session deleted successfully'
  });
});

/**
 * Get session statistics
 * GET /api/sessions/stats
 *
 * @route GET /api/sessions/stats
 * @access Private (requires authentication)
 */
const getSessionStats = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  // Get total duration for completed sessions
  const totalDuration = await Session.getTotalDuration(userId);

  // Get session count by status
  const sessionCounts = await Session.aggregate([
    { $match: { userId } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);

  // Get average session duration
  const avgDuration = await Session.aggregate([
    { $match: { userId, status: 'completed' } },
    {
      $group: {
        _id: null,
        average: { $avg: '$duration' }
      }
    }
  ]);

  // Format statistics
  const stats = {
    totalSessions: sessionCounts.reduce((sum, item) => sum + item.count, 0),
    completedSessions: sessionCounts.find(item => item._id === 'completed')?.count || 0,
    activeSessions: sessionCounts.find(item => item._id === 'active')?.count || 0,
    totalDuration,
    averageDuration: avgDuration.length > 0 ? Math.round(avgDuration[0].average) : 0
  };

  res.json({
    success: true,
    data: {
      stats
    }
  });
});

module.exports = {
  startSession,
  stopSession,
  getSessions,
  getActiveSession,
  updateSession,
  deleteSession,
  getSessionStats
};
