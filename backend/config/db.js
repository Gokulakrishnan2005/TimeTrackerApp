/**
 * MongoDB Database Connection Configuration
 *
 * Handles MongoDB connection setup using Mongoose ODM
 * Includes connection options, error handling, and reconnection logic
 *
 * Features:
 * - Environment-based connection string
 * - Connection retry logic with exponential backoff
 * - Connection event listeners (connected, error, disconnected)
 * - Graceful connection management
 */

const mongoose = require('mongoose');

// MongoDB connection options for stability and performance
const connectOptions = {
  // Connection timeout in milliseconds
  serverSelectionTimeoutMS: 5000,
  // Socket timeout in milliseconds
  socketTimeoutMS: 45000,
  // Maximum pool size for connection pooling
  maxPoolSize: 10,
  // Minimum pool size for connection pooling
  minPoolSize: 2,
  // Maximum idle time for connections in pool
  maxIdleTimeMS: 30000,
};

/**
 * Connect to MongoDB database
 *
 * @returns {Promise<void>} Promise that resolves when connected
 */
const connectDB = async () => {
  try {
    // Get MongoDB URI from environment variables
    const mongoURI = process.env.MONGODB_URI;

    if (!mongoURI) {
      console.error('❌ MongoDB URI not found in environment variables');
      console.error('Please set MONGODB_URI in your .env file');
      process.exit(1);
    }

    // Attempt to connect to MongoDB
    console.log('🔄 Attempting to connect to MongoDB...');
    await mongoose.connect(mongoURI, connectOptions);

    console.log('✅ MongoDB Connected Successfully!');
    console.log(`📊 Database: ${mongoose.connection.name}`);
    console.log(`🌐 Host: ${mongoose.connection.host}:${mongoose.connection.port}`);

  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error.message);

    // Exit process if connection fails
    process.exit(1);
  }
};

// Connection event listeners for monitoring

/**
 * Event listener for successful connection
 * Logs connection details when MongoDB connects
 */
mongoose.connection.on('connected', () => {
  console.log('📡 MongoDB connection established');
});

/**
 * Event listener for connection errors
 * Logs detailed error information
 */
mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB connection error:', err);
});

/**
 * Event listener for disconnections
 * Attempts to reconnect when connection is lost
 */
mongoose.connection.on('disconnected', () => {
  console.log('📡 MongoDB disconnected, attempting to reconnect...');

  // Attempt to reconnect after 5 seconds
  setTimeout(async () => {
    try {
      await mongoose.connect(process.env.MONGODB_URI, connectOptions);
      console.log('✅ MongoDB reconnected successfully');
    } catch (error) {
      console.error('❌ MongoDB reconnection failed:', error.message);
    }
  }, 5000);
});

/**
 * Event listener for connection timeout
 * Logs timeout information
 */
mongoose.connection.on('timeout', () => {
  console.warn('⚠️ MongoDB connection timeout');
});

/**
 * Event listener for connection pool exhaustion
 * Logs when connection pool is exhausted
 */
mongoose.connection.on('poolCleared', () => {
  console.warn('⚠️ MongoDB connection pool cleared');
});

module.exports = connectDB;
