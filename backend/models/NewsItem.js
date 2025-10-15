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
    maxlength: 50
  },
  imageUrl: {
    type: String,
    trim: true
  },
  summary: {
    type: String,
    trim: true,
    maxlength: 300
  },
  content: {
    type: String,
    required: true,
    maxlength: 5000
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('NewsItem', newsItemSchema);