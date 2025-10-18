const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  minute: { type: Number, required: true, min: 0, max: 120 },
  type: { type: String, enum: ['goal', 'yellow_card', 'red_card', 'foul'], required: true },
  team: { type: String, enum: ['home', 'away'], required: true },
  player: { type: String, trim: true },
  // Goal-specific fields
  assist: { type: String, trim: true },
  goalType: { type: String, enum: ['open_play', 'penalty', 'free_kick'], default: 'open_play' },
  fieldSide: { type: String, enum: ['mid', 'rw', 'lw'], default: 'mid' }
}, { _id: false, timestamps: false });

const scoreSchema = new mongoose.Schema({
  home: { type: Number, default: 0, min: 0 },
  away: { type: Number, default: 0, min: 0 }
}, { _id: false, timestamps: false });

const fixtureSchema = new mongoose.Schema({
  homeTeam: { type: mongoose.Schema.Types.ObjectId, ref: 'Club', required: true, index: true },
  awayTeam: { type: mongoose.Schema.Types.ObjectId, ref: 'Club', required: true, index: true },
  status: { type: String, enum: ['scheduled', 'live', 'finished'], default: 'scheduled', index: true },
  stage: { type: String, enum: ['league', 'semi', 'final'], default: 'league', index: true },
  score: { type: scoreSchema, default: () => ({ home: 0, away: 0 }) },
  events: { type: [eventSchema], default: [] },
  isFinal: { type: Boolean, default: false, index: true },
  kickoffAt: { type: Date },
  autoSimulate: { type: Boolean, default: false },
  venueName: { type: String, trim: true },
  isScheduled: { type: Boolean, default: false },
  finishedAt: { type: Date },
  // Match time tracking
  matchStartedAt: { type: Date },
  currentMinute: { type: Number, default: 0, min: 0, max: 120 },
  halfTime: { type: Number, default: 45 }, // First half duration
  addedTime: { type: Number, default: 0, min: 0, max: 10 }, // Added time for current half
  isHalfTime: { type: Boolean, default: false },
  isFullTime: { type: Boolean, default: false }
}, {
  timestamps: true
});

fixtureSchema.index({ homeTeam: 1, awayTeam: 1, isFinal: 1 }, { unique: false });
// Enforce unique scheduled time across all fixtures having a kickoffAt.
// sparse:true allows multiple documents without kickoffAt.
fixtureSchema.index({ kickoffAt: 1 }, { unique: true, sparse: true });

// Method to calculate current match time
fixtureSchema.methods.calculateCurrentTime = function() {
  if (this.status !== 'live' || !this.matchStartedAt) {
    return { minute: 0, display: '0\'' };
  }

  const now = new Date();
  const elapsedMs = now - this.matchStartedAt;
  const elapsedMinutes = Math.floor(elapsedMs / (1000 * 60));
  
  // Calculate current minute based on match progression
  let currentMinute = elapsedMinutes;
  
  // Handle half-time break (15 minutes)
  if (elapsedMinutes > this.halfTime && !this.isHalfTime) {
    // First half finished, add half-time break
    currentMinute = this.halfTime + Math.max(0, elapsedMinutes - this.halfTime - 15);
  } else if (elapsedMinutes > this.halfTime + 15 && this.isHalfTime) {
    // Second half started
    currentMinute = this.halfTime + Math.max(0, elapsedMinutes - this.halfTime - 15);
  }
  
  // Add stoppage time
  const totalTime = currentMinute + this.addedTime;
  
  // Format display
  let display = `${totalTime}'`;
  if (this.addedTime > 0 && totalTime <= this.halfTime) {
    display = `${this.halfTime}+${this.addedTime}'`;
  } else if (this.addedTime > 0 && totalTime <= 90) {
    display = `90+${this.addedTime}'`;
  }
  
  return { minute: totalTime, display };
};

// Method to update match time
fixtureSchema.methods.updateMatchTime = function() {
  if (this.status !== 'live') return;
  
  const timeInfo = this.calculateCurrentTime();
  this.currentMinute = timeInfo.minute;
  
  // Check for half-time
  if (timeInfo.minute >= this.halfTime && !this.isHalfTime) {
    this.isHalfTime = true;
    this.addedTime = Math.floor(Math.random() * 4) + 1; // 1-4 minutes added time
  }
  
  // Check for full-time (90 minutes + added time)
  if (timeInfo.minute >= 90 + this.addedTime && !this.isFullTime) {
    this.isFullTime = true;
  }
  
  return timeInfo;
};

module.exports = mongoose.model('Fixture', fixtureSchema);

