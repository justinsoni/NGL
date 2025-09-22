const mongoose = require('mongoose');

const playerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  email: {
    type: String,
    required: true,
    unique: true,
    index: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  phone: {
    type: String,
    required: true,
    trim: true,
    match: [/^[\+]?[1-9][\d]{0,15}$/, 'Please enter a valid phone number']
  },
  dob: {
    type: Date,
    required: true
  },
  age: {
    type: Number,
    min: 0
  },
  position: {
    type: String,
    required: true,
    trim: true
  },
  nationality: {
    type: String,
    required: true,
    trim: true
  },
  previousClub: {
    type: String,
    trim: true
  },
  leaguesPlayed: [{
    type: String,
    trim: true
  }],
  imageUrl: {
    type: String,
    trim: true
  },
  identityCardUrl: {
    type: String,
    required: true,
    trim: true
  },
  // High-level verification flag (set when approved)
  isVerified: {
    type: Boolean,
    default: false
  },
  // Detailed document verification metadata
  documentVerification: {
    status: {
      type: String,
      enum: ['pending', 'verified', 'rejected'],
      default: 'pending'
    },
    method: {
      type: String,
      enum: ['manual', 'auto', 'ai', null],
      default: null
    },
    verifiedAt: {
      type: Date
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    notes: {
      type: String,
      maxlength: 500
    },
    aiScore: {
      type: Number,
      min: 0,
      max: 100
    }
  },
  bio: {
    type: String,
    maxlength: 1000
  },
  clubId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Club',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  rejectionReason: {
    type: String,
    maxlength: 500
  },
  submittedAt: {
    type: Date,
    default: Date.now
  },
  reviewedAt: {
    type: Date
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Player', playerSchema);