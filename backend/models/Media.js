const mongoose = require('mongoose');

const mediaSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add a video title'],
    trim: true
  },
  youtubeUrl: {
    type: String,
    required: [true, 'Please add a YouTube URL']
  },
  thumbnailUrl: {
    type: String,
    required: [true, 'Please provide a thumbnail URL']
  },
  category: {
    type: String,
    enum: ['Match Highlights', 'Player Interviews', 'Behind the Scenes', 'Manager Press Conferences', 'Other'],
    default: 'Other'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Media', mediaSchema);
