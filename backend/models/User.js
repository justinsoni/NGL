const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  // Firebase UID - unique identifier from Firebase Auth
  firebaseUid: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  
  // Basic user information
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
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  
  // User role with enum validation
  role: {
    type: String,
    enum: ['admin', 'registeredUser', 'clubManager', 'coach'],
    default: 'registeredUser',
    required: true
  },
  
  // Optional club association
  club: {
    type: String,
    trim: true,
    maxlength: 100
  },
  
  // Program registrations array
  programRegistrations: [{
    programId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Program'
    },
    registrationDate: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'completed'],
      default: 'pending'
    },
    notes: String
  }],
  
  // Additional profile information
  profile: {
    phone: {
      type: String,
      trim: true,
      match: [/^[\+]?[1-9][\d]{0,15}$/, 'Please enter a valid phone number']
    },
    dateOfBirth: Date,
    nationality: {
      type: String,
      trim: true,
      maxlength: 50
    },
    position: {
      type: String,
      enum: ['Goalkeeper', 'Defender', 'Midfielder', 'Forward', 'Coach', 'Manager', 'Other'],
      trim: true
    },
    bio: {
      type: String,
      maxlength: 500
    },
    avatar: {
      type: String,
      trim: true
    }
  },
  
  // Account status and metadata
  isActive: {
    type: Boolean,
    default: true
  },
  
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  
  // Authentication method
  authMethod: {
    type: String,
    enum: ['email', 'google'],
    default: 'email'
  },
  
  lastLogin: {
    type: Date
  },
  
  createdAt: {
    type: Date,
    default: Date.now
  },
  
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ club: 1 });
userSchema.index({ createdAt: -1 });

// Virtual for full name display
userSchema.virtual('displayName').get(function() {
  return this.name || this.email.split('@')[0];
});

// Pre-save middleware to update the updatedAt field
userSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Instance method to check if user has specific role
userSchema.methods.hasRole = function(role) {
  return this.role === role;
};

// Instance method to check if user is admin
userSchema.methods.isAdmin = function() {
  return this.role === 'admin';
};

// Instance method to check if user can manage club
userSchema.methods.canManageClub = function(clubName) {
  return this.role === 'admin' || (this.role === 'clubManager' && this.club === clubName);
};

// Static method to find users by role
userSchema.statics.findByRole = function(role) {
  return this.find({ role, isActive: true });
};

// Static method to find users by club
userSchema.statics.findByClub = function(club) {
  return this.find({ club, isActive: true });
};

module.exports = mongoose.model('User', userSchema);
