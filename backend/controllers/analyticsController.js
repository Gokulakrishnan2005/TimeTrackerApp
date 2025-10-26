const Session = require('../models/Session');
const { asyncHandler } = require('../middleware/errorHandler');

const getAnalytics = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { period = 'all' } = req.query; // 'day', 'month', 'year', or 'all'

  // Calculate date range based on period
  let startDate = null;
  const now = new Date();
  
  if (period === 'day') {
    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
  } else if (period === 'month') {
    startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
  } else if (period === 'year') {
    startDate = new Date(now.getFullYear(), 0, 1, 0, 0, 0);
  }

  // Build query
  const query = { userId, status: 'completed' };
  if (startDate) {
    query.startDateTime = { $gte: startDate };
  }

  const sessions = await Session.find(query);

  // Time Distribution
  const timeDistribution = Array(24).fill(0);
  sessions.forEach(session => {
    const hour = new Date(session.startDateTime).getHours();
    timeDistribution[hour] += session.duration / (1000 * 60); // in minutes
  });

  // Tag Distribution
  const tagDistribution = {};
  let totalTime = 0;
  sessions.forEach(session => {
    if (session.tag) {
      if (!tagDistribution[session.tag]) {
        tagDistribution[session.tag] = 0;
      }
      tagDistribution[session.tag] += session.duration / (1000 * 60); // in minutes
      totalTime += session.duration / (1000 * 60); // in minutes
    }
  });

  const tagDistributionArray = Object.keys(tagDistribution).map(tag => ({
    tag,
    minutes: tagDistribution[tag],
    percentage: totalTime > 0 ? (tagDistribution[tag] / totalTime) * 100 : 0,
  })).sort((a, b) => b.minutes - a.minutes);

  res.json({
    success: true,
    data: {
      timeDistribution: timeDistribution.map((minutes, hour) => ({ hour, minutes })),
      tagDistribution: tagDistributionArray,
      totalTime,
      period,
      sessionCount: sessions.length,
    },
  });
});

module.exports = {
  getAnalytics,
};
