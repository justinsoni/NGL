require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

// Import configurations
const connectDB = require('./config/database');
const { initializeFirebase } = require('./config/firebase');

// Import middleware
const {
  generalLimiter,
  securityHeaders,
  corsOptions,
  requestLogger,
  securityErrorHandler
} = require('./middleware/security');

// Import routes
const authRoutes = require('./routes/auth');
const clubRoutes = require('./routes/clubs');
const playerRoutes = require('./routes/player');
const fixtureRoutes = require('./routes/fixtures');
const tableRoutes = require('./routes/table');
const newsItemRoutes = require('./routes/newsItemRoutes');

// Initialize Express app
const app = express();

// Initialize Firebase Admin SDK
initializeFirebase();

// Connect to MongoDB
connectDB();

// Security middleware
app.use(securityHeaders);
app.use(cors(corsOptions));

// Rate limiting
app.use(generalLimiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}
app.use(requestLogger);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Football League Hub API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/clubs', clubRoutes);
app.use('/api/players', playerRoutes);
app.use('/api/fixtures', fixtureRoutes);
app.use('/api/table', tableRoutes);
app.use('/api/news', newsItemRoutes);

// 404 handler for undefined routes
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
    availableRoutes: [
      'GET /health',
      'POST /api/auth/register',
      'GET /api/auth/profile',
      'PUT /api/auth/update-profile',
      'GET /api/auth/users',
      'PUT /api/auth/users/:userId/role',
      'GET /api/auth/users/:userId',
      'DELETE /api/auth/users/:userId',
      'GET /api/clubs',
      'GET /api/clubs/stats',
      'GET /api/clubs/:id',
      'POST /api/clubs',
      'PUT /api/clubs/:id',
      'DELETE /api/clubs/:id',
      'POST /api/players/register',
      'GET /api/players',
      'POST /api/players/:registrationId/approve',
      'POST /api/players/:registrationId/reject',
      'GET /api/players/approved',
      'POST /api/fixtures/generate',
      'GET /api/fixtures',
      'PUT /api/fixtures/:id/start',
      'PUT /api/fixtures/:id/event',
      'POST /api/fixtures/:id/simulate',
      'PUT /api/fixtures/:id/finish',
      'PUT /api/fixtures/final/:id/finish-and-declare',
      'GET /api/table',
      'GET /api/news',
      'POST /api/news',
      'PUT /api/news/:id',
      'DELETE /api/news/:id'
    ]
  });
});

// Security error handler
app.use(securityErrorHandler);

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => ({
      field: e.path,
      message: e.message
    }));
    
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    });
  }

  // Mongoose cast error (invalid ObjectId)
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: 'Invalid ID format'
    });
  }

  // MongoDB duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(409).json({
      success: false,
      message: `${field} already exists`
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token expired'
    });
  }

  // Default error response
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// Start server
const PORT = process.env.PORT || 5000;

const http = require('http');
const { Server } = require('socket.io');
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET','POST','PUT','DELETE']
  }
});

app.set('io', io);

// Start scheduler for auto-start/auto-simulate
try {
  const { startScheduler } = require('./utils/scheduler');
  startScheduler(io);
} catch (e) {
  console.error('Failed to start scheduler', e);
}

server.listen(PORT, () => {
  console.log(`
🚀 Football League Hub API Server Started
📍 Environment: ${process.env.NODE_ENV || 'development'}
🌐 Port: ${PORT}
🔗 Health Check: http://localhost:${PORT}/health
📚 API Base URL: http://localhost:${PORT}/api
🔐 Firebase Project: ${process.env.FIREBASE_PROJECT_ID || 'Not configured'}
🗄️  Database: ${process.env.MONGODB_URI ? 'Connected' : 'Not configured'}
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('Process terminated');
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down gracefully...');
  server.close(() => {
    console.log('Process terminated');
  });
});

module.exports = app;
