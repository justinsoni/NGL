const mongoose = require('mongoose');

const leagueConfigSchema = new mongoose.Schema({
  season: { 
    type: String, 
    required: true, 
    unique: true,
    default: '2025'
  },
  name: { 
    type: String, 
    required: true, 
    default: 'Default League'
  },
  startDate: { 
    type: Date, 
    required: true 
  },
  endDate: { 
    type: Date, 
    required: true 
  },
  isActive: { 
    type: Boolean, 
    default: true 
  },
  description: {
    type: String,
    maxlength: 500
  }
}, {
  timestamps: true
});

// Ensure startDate is before endDate
leagueConfigSchema.pre('save', function(next) {
  if (this.startDate >= this.endDate) {
    return next(new Error('Start date must be before end date'));
  }
  next();
});

module.exports = mongoose.model('LeagueConfig', leagueConfigSchema);
