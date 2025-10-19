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
  // Match time tracking - PES-style system
  matchStartedAt: { type: Date },
  currentMinute: { type: Number, default: 0, min: 0, max: 120 },
  halfTime: { type: Number, default: 45 }, // First half duration
  addedTime: { type: Number, default: 0, min: 0, max: 10 }, // Added time for current half
  isHalfTime: { type: Boolean, default: false },
  isFullTime: { type: Boolean, default: false },
  // PES-style timing enhancements
  timeAcceleration: { type: Number, default: 60, min: 1, max: 300 }, // Real seconds per game minute (default: 1 game minute = 1 real second)
  matchPhase: { type: String, enum: ['first_half', 'half_time', 'second_half', 'extra_time', 'full_time'], default: 'first_half' },
  halfTimeBreakDuration: { type: Number, default: 1 }, // Half-time break in real minutes
  stoppageTimeAccumulated: { type: Number, default: 0 }, // Accumulated stoppage time
  lastEventTime: { type: Date }, // Track when last event occurred for stoppage calculation
  // Match progression tracking
  firstHalfEndedAt: { type: Date },
  secondHalfStartedAt: { type: Date },
  secondHalfEndedAt: { type: Date },
  extraTimeStartedAt: { type: Date },
  extraTimeEndedAt: { type: Date },
  extraTimeBreakDuration: { type: Number, default: 1 } // Extra time break duration in real minutes
}, {
  timestamps: true
});

fixtureSchema.index({ homeTeam: 1, awayTeam: 1, isFinal: 1 }, { unique: false });
// Enforce unique scheduled time across all fixtures having a kickoffAt.
// sparse:true allows multiple documents without kickoffAt.
fixtureSchema.index({ kickoffAt: 1 }, { unique: true, sparse: true });

// PES-style method to calculate current match time
fixtureSchema.methods.calculateCurrentTime = function() {
  if (this.status !== 'live' || !this.matchStartedAt) {
    return { minute: 0, display: '0' };
  }

  const now = new Date();
  const elapsedMs = now - this.matchStartedAt;
  const elapsedSeconds = Math.floor(elapsedMs / 1000);
  
  // Calculate game time based on time acceleration
  const gameTimeElapsed = Math.floor(elapsedSeconds / this.timeAcceleration);
  
  let currentMinute = 0;
  let phase = this.matchPhase;
  let display = '0';
  
  switch (this.matchPhase) {
    case 'first_half':
      currentMinute = Math.min(gameTimeElapsed, this.halfTime);
      display = `${currentMinute}`;
      
      // Check if first half should end
      if (gameTimeElapsed >= this.halfTime) {
        phase = 'half_time';
        currentMinute = this.halfTime;
        display = `${this.halfTime}`;
      }
      break;
      
    case 'half_time':
      // During half-time break, time doesn't progress
      currentMinute = this.halfTime;
      display = `${this.halfTime}`;
      
      // Check if half-time break should end
      const halfTimeElapsed = Math.floor((now - this.firstHalfEndedAt) / (1000 * 60));
      if (halfTimeElapsed >= this.halfTimeBreakDuration) {
        phase = 'second_half';
        display = `${this.halfTime}`;
      }
      break;
      
    case 'second_half':
      // Calculate second half time
      const secondHalfElapsed = Math.floor((now - this.secondHalfStartedAt) / (1000 * this.timeAcceleration));
      currentMinute = this.halfTime + Math.min(secondHalfElapsed, 45);
      display = `${currentMinute}`;
      
      // Check if second half should end
      if (secondHalfElapsed >= 45) {
        phase = 'extra_time';
        currentMinute = 90;
        display = `90`;
      }
      break;
      
    case 'extra_time':
      // During extra time break, time doesn't progress
      currentMinute = 90;
      display = `90`;
      
      // Check if extra time break should end
      const extraTimeElapsed = Math.floor((now - this.secondHalfEndedAt) / (1000 * 60));
      if (extraTimeElapsed >= this.extraTimeBreakDuration) {
        phase = 'full_time';
        display = `90`;
      }
      break;
      
    case 'full_time':
      currentMinute = 90;
      display = `90`;
      break;
  }
  
  // Remove stoppage time from display - show only minute numbers
  // if (this.stoppageTimeAccumulated > 0 && phase !== 'half_time' && phase !== 'full_time') {
  //   const totalTime = currentMinute + this.stoppageTimeAccumulated;
  //   if (currentMinute <= this.halfTime) {
  //     display = `${this.halfTime}+${this.stoppageTimeAccumulated}'`;
  //   } else if (currentMinute <= 90) {
  //     display = `90+${this.stoppageTimeAccumulated}'`;
  //   }
  //   currentMinute = totalTime;
  // }
  
  return { 
    minute: currentMinute, 
    display, 
    phase,
    gameTimeElapsed,
    stoppageTime: this.stoppageTimeAccumulated
  };
};

// PES-style method to update match time and handle phase transitions
fixtureSchema.methods.updateMatchTime = function() {
  if (this.status !== 'live') return { minute: 0, display: '0\'', phase: 'first_half' };
  
  const timeInfo = this.calculateCurrentTime();
  this.currentMinute = timeInfo.minute;
  
  // Handle phase transitions
  if (timeInfo.phase !== this.matchPhase) {
    const now = new Date();
    
    switch (timeInfo.phase) {
      case 'half_time':
        this.matchPhase = 'half_time';
        this.isHalfTime = true;
        this.firstHalfEndedAt = now;
        this.addedTime = Math.floor(Math.random() * 4) + 1; // 1-4 minutes added time for first half
        console.log(`🕐 First half ended at ${this.halfTime}+${this.addedTime}'`);
        break;
        
      case 'second_half':
        this.matchPhase = 'second_half';
        this.isHalfTime = false;
        this.secondHalfStartedAt = now;
        this.stoppageTimeAccumulated = 0; // Reset stoppage time for second half
        console.log(`🕐 Second half started`);
        break;
        
      case 'extra_time':
        this.matchPhase = 'extra_time';
        this.secondHalfEndedAt = now;
        this.addedTime = Math.floor(Math.random() * 4) + 1; // 1-4 minutes added time for second half
        console.log(`🕐 Second half ended at 90+${this.addedTime}' - Extra time break started`);
        break;
        
      case 'full_time':
        this.matchPhase = 'full_time';
        this.isFullTime = true;
        this.extraTimeEndedAt = now;
        console.log(`🕐 Full time reached - Match completed`);
        break;
    }
  }
  
  return timeInfo;
};

// Method to add stoppage time based on events
fixtureSchema.methods.addStoppageTime = function(eventType, eventMinute) {
  if (this.status !== 'live' || this.matchPhase === 'half_time' || this.matchPhase === 'extra_time' || this.matchPhase === 'full_time') {
    return;
  }
  
  let stoppageToAdd = 0;
  
  // Different events add different amounts of stoppage time
  switch (eventType) {
    case 'goal':
      stoppageToAdd = 0.5; // 30 seconds for goal celebrations
      break;
    case 'yellow_card':
      stoppageToAdd = 0.3; // 20 seconds for card showing
      break;
    case 'red_card':
      stoppageToAdd = 1.0; // 1 minute for red card incidents
      break;
    case 'foul':
      stoppageToAdd = 0.2; // 10 seconds for fouls
      break;
    case 'substitution':
      stoppageToAdd = 0.3; // 20 seconds for substitutions
      break;
    case 'injury':
      stoppageToAdd = 1.5; // 1.5 minutes for injuries
      break;
  }
  
  // Add to accumulated stoppage time
  this.stoppageTimeAccumulated += stoppageToAdd;
  this.lastEventTime = new Date();
  
  console.log(`⏱️ Added ${stoppageToAdd} minutes stoppage time for ${eventType} at ${eventMinute}'`);
};

// Method to set time acceleration (for faster/slower gameplay)
fixtureSchema.methods.setTimeAcceleration = function(acceleration) {
  if (acceleration < 1 || acceleration > 300) {
    throw new Error('Time acceleration must be between 1 and 300 seconds per game minute');
  }
  this.timeAcceleration = acceleration;
  console.log(`⚡ Time acceleration set to ${acceleration} seconds per game minute`);
};

module.exports = mongoose.model('Fixture', fixtureSchema);

