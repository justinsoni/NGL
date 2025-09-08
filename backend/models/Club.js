const mongoose = require('mongoose');

const clubSchema = new mongoose.Schema({
  // Basic club information
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    maxlength: 100
  },
  
  logo: {
    type: String,
    required: true,
    trim: true
  },
  
  // Stadium information
  stadium: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  
  stadiumCapacity: {
    type: Number,
    min: 0
  },
  
  // Club history
  founded: {
    type: Number,
    required: true,
    min: 1800,
    max: new Date().getFullYear()
  },
  
  // Contact information
  website: {
    type: String,
    trim: true,
    match: [/^https?:\/\/.+/, 'Please enter a valid URL']
  },
  
  email: {
    type: String,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  
  phone: {
    type: String,
    trim: true,
    match: [/^[\+]?[1-9][\d]{0,15}$/, 'Please enter a valid phone number']
  },
  
  // Location
  city: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  
  country: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  
  // Club details
  colors: {
    primary: {
      type: String,
      trim: true,
      maxlength: 20
    },
    secondary: {
      type: String,
      trim: true,
      maxlength: 20
    }
  },
  
  // Honours and achievements
  honours: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    count: {
      type: Number,
      required: true,
      min: 0
    },
    years: [Number]
  }],
  
  // Club status
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Additional information
  description: {
    type: String,
    maxlength: 1000
  },
  
  // Social media links
  socialMedia: {
    twitter: String,
    facebook: String,
    instagram: String,
    youtube: String
  },
  
  // Metadata
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
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
clubSchema.index({ name: 1 });
clubSchema.index({ city: 1 });
clubSchema.index({ country: 1 });
clubSchema.index({ group: 1 });
clubSchema.index({ isActive: 1 });
clubSchema.index({ createdAt: -1 });

// Virtual for display name
clubSchema.virtual('displayName').get(function() {
  return `${this.name} (${this.city})`;
});

// Virtual for full stadium name
clubSchema.virtual('fullStadiumName').get(function() {
  return `${this.stadium}, ${this.city}`;
});

// Pre-save middleware to update the updatedAt field
clubSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Instance method to get total honours count
clubSchema.methods.getTotalHonours = function() {
  return this.honours.reduce((total, honour) => total + honour.count, 0);
};

// Static method to find clubs by city
clubSchema.statics.findByCity = function(city) {
  return this.find({ city, isActive: true });
};

// Static method to search clubs
clubSchema.statics.searchClubs = function(searchTerm) {
  const regex = new RegExp(searchTerm, 'i');
  return this.find({
    $and: [
      { isActive: true },
      {
        $or: [
          { name: regex },
          { city: regex },
          { stadium: regex }
        ]
      }
    ]
  });
};

module.exports = mongoose.model('Club', clubSchema);
