const mongoose = require('mongoose');

const newsItemSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  category: {
    type: String,
    trim: true,
    maxlength: 50,
    default: 'Features',
    enum: ['Features', 'News', 'Analysis', 'Transfers', 'Match Reports', 'Best Goals', 'Transfer News', 'Trending']
  },
  type: {
    type: String,
    trim: true,
    enum: ['article', 'transfer', 'best-goal', 'match-report', 'trending'],
    default: 'article'
  },
  imageUrl: {
    type: String,
    trim: true,
    validate: {
      validator: function(v) {
        return !v || /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/i.test(v);
      },
      message: 'Image URL must be a valid HTTP/HTTPS URL ending with an image extension'
    }
  },
  icon: {
    type: String,
    trim: true,
    maxlength: 10,
    default: '🔥'
  },
  summary: {
    type: String,
    trim: true,
    maxlength: 500
  },
  content: {
    type: String,
    trim: true,
    maxlength: 10000
  },
  author: {
    type: String,
    trim: true,
    maxlength: 100
  },
  authorRole: {
    type: String,
    trim: true,
    enum: ['admin', 'registeredUser', 'clubManager', 'coach'],
    default: 'registeredUser'
  },
  club: {
    type: String,
    trim: true,
    maxlength: 100
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Pre-save middleware to update updatedAt field
newsItemSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('NewsItem', newsItemSchema);