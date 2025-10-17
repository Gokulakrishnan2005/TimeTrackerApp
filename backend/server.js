/**
 * Time Tracker Backend Server
 *
 * Main entry point for the Node.js backend server
 * Handles Express.js setup, middleware configuration, and route mounting
 *
 * Features:
 * - Express.js server with CORS enabled for React Native
 * - MongoDB connection via Mongoose
 * - JWT authentication middleware
 * - Rate limiting for security
 * - Security headers via Helmet
 * - Global error handling
 * - Environment variable configuration
 */

// Import required modules
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Import custom modules
const connectDB = require('./config/db');
const { errorHandler } = require('./middleware/errorHandler');
const authRoutes = require('./routes/auth');
const sessionRoutes = require('./routes/sessions');
const financeRoutes = require('./routes/finance');
const taskRoutes = require('./routes/tasks');

// Initialize Express app
const app = express();

// Connect to MongoDB
connectDB();

// CORS configuration must run before Helmet and rate limiter
const isDev = (process.env.NODE_ENV !== 'production');
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:8081',  // Expo dev server (web)
  'http://127.0.0.1:8081',
  'http://localhost:19006', // Expo web alt
  'http://localhost:19000', // Expo mobile
  process.env.FRONTEND_URL
].filter(Boolean);

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, Postman)
    if (!origin) return callback(null, true);

    // In development allow all origins to simplify Expo testing across LAN/IP/localhost
    if (isDev) return callback(null, true);

    if (allowedOrigins.indexOf(origin) !== -1) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));
// Express 5: avoid wildcard patterns that break path-to-regexp; handle OPTIONS generically
app.use((req, res, next) => {
  if (req.method === 'OPTIONS') {
    const origin = req.headers.origin || '*';
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Vary', 'Origin');
    res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,PATCH,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    res.header('Access-Control-Allow-Credentials', 'true');
    return res.sendStatus(204);
  }
  next();
});

// Security middleware
// Helmet sets various HTTP headers for security
app.use(helmet());

// Rate limiting - prevents abuse by limiting requests per window
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.'
  }
});

// Apply rate limiting to all routes
app.use(limiter);

// Body parsing middleware
// Parse JSON bodies (as sent by API calls)
app.use(express.json({ limit: '10mb' }));
// Parse URL-encoded bodies (for form submissions)
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
// Simple endpoint to verify server is running
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Time Tracker Backend Server is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// API Routes
// Mount route handlers with /api prefix
app.use('/api/auth', authRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/finance', financeRoutes);
app.use('/api/tasks', taskRoutes);

// Global error handling middleware
// Must be placed after all routes
app.use(errorHandler);

// 404 handler for unmatched routes - place this after all other routes
app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found',
    message: `Cannot ${req.method} ${req.originalUrl}`
  });
});

// Server configuration
const PORT = process.env.PORT || 5000;

// Start server
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`
🚀 Time Tracker Backend Server Started!

📊 Server Details:
   • Port: ${PORT}
   • Environment: ${process.env.NODE_ENV || 'development'}
   • MongoDB: ${process.env.MONGODB_URI ? 'Connected' : 'Not configured'}

🔗 API Endpoints:
   • Health Check: http://localhost:${PORT}/health
   • Auth Routes: http://localhost:${PORT}/api/auth
   • Session Routes: http://localhost:${PORT}/api/sessions
   • Finance Routes: http://localhost:${PORT}/api/finance
   • Task Routes: http://localhost:${PORT}/api/tasks

⚡ Ready to receive requests!
  `);
});

// Graceful shutdown handling
// Clean up connections when server is terminated
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(async () => {
    await mongoose.connection.close(false);
    console.log('MongoDB connection closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(async () => {
    await mongoose.connection.close(false);
    console.log('MongoDB connection closed');
    process.exit(0);
  });
});

module.exports = app;
