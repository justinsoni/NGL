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
    enum: ['Features', 'News', 'Analysis', 'Transfers', 'Match Reports', 'Best Goals', 'Transfer News']
  },
  type: {
    type: String,
    trim: true,
    enum: ['article', 'transfer', 'best-goal', 'match-report'],
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