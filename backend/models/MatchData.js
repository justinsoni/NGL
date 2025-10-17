const mongoose = require('mongoose');

// Player statistics schema for match data
const playerStatsSchema = new mongoose.Schema({
  playerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Player' },
  playerName: { type: String, required: true, trim: true },
  position: { type: String, trim: true },
  goals: { type: Number, default: 0, min: 0 },
  assists: { type: Number, default: 0, min: 0 },
  yellowCards: { type: Number, default: 0, min: 0 },
  redCards: { type: Number, default: 0, min: 0 },
  fouls: { type: Number, default: 0, min: 0 },
  minutesPlayed: { type: Number, default: 90, min: 0, max: 120 }
}, { _id: false });

// Team statistics schema for match data
const teamStatsSchema = new mongoose.Schema({
  teamId: { type: mongoose.Schema.Types.ObjectId, ref: 'Club', required: true },
  teamName: { type: String, required: true, trim: true },
  finalScore: { type: Number, required: true, min: 0 },
  possession: { type: Number, min: 0, max: 100 }, // percentage
  shots: { type: Number, default: 0, min: 0 },
  shotsOnTarget: { type: Number, default: 0, min: 0 },
  corners: { type: Number, default: 0, min: 0 },
  fouls: { type: Number, default: 0, min: 0 },
  yellowCards: { type: Number, default: 0, min: 0 },
  redCards: { type: Number, default: 0, min: 0 },
  playerStats: [playerStatsSchema]
}, { _id: false });

// Detailed match event schema
const matchEventSchema = new mongoose.Schema({
  minute: { type: Number, required: true, min: 0, max: 120 },
  type: { type: String, enum: ['goal', 'yellow_card', 'red_card', 'foul', 'substitution', 'corner', 'shot'], required: true },
  team: { type: String, enum: ['home', 'away'], required: true },
  player: { type: String, trim: true },
  // Goal-specific fields
  assist: { type: String, trim: true },
  goalType: { type: String, enum: ['open_play', 'penalty', 'free_kick', 'header', 'volley'], default: 'open_play' },
  fieldSide: { type: String, enum: ['mid', 'rw', 'lw'], default: 'mid' },
  // Additional event details
  description: { type: String, trim: true },
  playerOut: { type: String, trim: true }, // for substitutions
  playerIn: { type: String, trim: true }, // for substitutions
  timestamp: { type: Date, default: Date.now }
}, { _id: false });

// Match data schema - stores comprehensive match details after completion
const matchDataSchema = new mongoose.Schema({
  // Reference to original fixture
  fixtureId: { type: mongoose.Schema.Types.ObjectId, ref: 'Fixture', required: true, unique: true },
  
  // Basic match information
  homeTeam: { type: mongoose.Schema.Types.ObjectId, ref: 'Club', required: true },
  awayTeam: { type: mongoose.Schema.Types.ObjectId, ref: 'Club', required: true },
  homeTeamName: { type: String, required: true, trim: true },
  awayTeamName: { type: String, required: true, trim: true },
  
  // Match details
  stage: { type: String, enum: ['league', 'semi', 'final'], required: true },
  venue: { type: String, trim: true },
  kickoffTime: { type: Date, required: true },
  finalScore: {
    home: { type: Number, required: true, min: 0 },
    away: { type: Number, required: true, min: 0 }
  },
  matchDuration: { type: Number, default: 90, min: 0 }, // in minutes
  attendance: { type: Number, min: 0 },
  
  // Match officials
  referee: { type: String, trim: true },
  assistantReferee1: { type: String, trim: true },
  assistantReferee2: { type: String, trim: true },
  fourthOfficial: { type: String, trim: true },
  
  // Weather and pitch conditions
  weather: { type: String, enum: ['sunny', 'cloudy', 'rainy', 'snowy', 'foggy'], default: 'sunny' },
  pitchCondition: { type: String, enum: ['excellent', 'good', 'fair', 'poor'], default: 'good' },
  temperature: { type: Number }, // in celsius
  
  // Comprehensive match events
  events: [matchEventSchema],
  
  // Team statistics
  homeTeamStats: teamStatsSchema,
  awayTeamStats: teamStatsSchema,
  
  // Match summary
  matchSummary: { type: String, trim: true, maxlength: 2000 },
  keyMoments: [{ type: String, trim: true }],
  
  // Match status
  isCompleted: { type: Boolean, default: true },
  completedAt: { type: Date, default: Date.now },
  
  // Additional metadata
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

// Indexes for efficient querying
matchDataSchema.index({ fixtureId: 1 }, { unique: true });
matchDataSchema.index({ homeTeam: 1, awayTeam: 1 });
matchDataSchema.index({ stage: 1 });
matchDataSchema.index({ completedAt: -1 });
matchDataSchema.index({ kickoffTime: -1 });

// Middleware to update updatedAt field
matchDataSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Static method to create match data from fixture
matchDataSchema.statics.createFromFixture = async function(fixture) {
  const populatedFixture = await fixture.populate('homeTeam awayTeam');
  
  const matchData = new this({
    fixtureId: fixture._id,
    homeTeam: fixture.homeTeam._id,
    awayTeam: fixture.awayTeam._id,
    homeTeamName: fixture.homeTeam.name,
    awayTeamName: fixture.awayTeam.name,
    stage: fixture.stage,
    venue: fixture.venueName,
    kickoffTime: fixture.kickoffAt,
    finalScore: fixture.score,
    matchDuration: 90, // Default, can be updated
    events: fixture.events.map(event => ({
      minute: event.minute,
      type: event.type,
      team: event.team,
      player: event.player,
      assist: event.assist,
      goalType: event.goalType,
      fieldSide: event.fieldSide,
      timestamp: new Date()
    }))
  });
  
  return matchData;
};

module.exports = mongoose.model('MatchData', matchDataSchema);
