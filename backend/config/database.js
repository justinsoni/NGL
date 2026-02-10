const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      console.warn('⚠️  MONGODB_URI not configured. Using default local MongoDB connection.');
      process.env.MONGODB_URI = 'mongodb://localhost:27017/football-league-hub';
    }

    // For Mongoose 7.x, useNewUrlParser and useUnifiedTopology are no longer needed
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000, // Timeout after 10s instead of 30s
      socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📊 Database: ${conn.connection.name}`);
  } catch (error) {
    console.error('❌ Database connection error:', error.message);
    
    // Provide helpful error messages based on error type
    if (error.name === 'MongoServerSelectionError') {
      console.error('💡 Troubleshooting tips:');
      console.error('   1. Check if your MongoDB Atlas cluster is running (unpause if needed)');
      console.error('   2. Verify your IP address is whitelisted in Atlas Network Access');
      console.error('   3. Check if your connection string is correct');
      console.error('   4. Ensure your internet connection is working');
    } else if (error.message.includes('ENOTFOUND')) {
      console.error('💡 DNS resolution failed. This could mean:');
      console.error('   - The cluster hostname is incorrect');
      console.error('   - The cluster has been deleted or paused');
      console.error('   - Network/DNS issues');
    }
    
    console.warn('⚠️  MongoDB connection failed. Server will continue without database features.');
    // Don't exit process to allow server to run without database
  }
};

// Handle connection events
mongoose.connection.on('connected', () => {
  console.log('Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error('Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('Mongoose disconnected');
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('MongoDB connection closed through app termination');
  process.exit(0);
});

module.exports = connectDB;
