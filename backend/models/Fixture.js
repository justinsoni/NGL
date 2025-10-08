const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  minute: { type: Number, required: true, min: 0, max: 120 },
  type: { type: String, enum: ['goal', 'yellow_card', 'red_card', 'foul'], required: true },
  team: { type: String, enum: ['home', 'away'], required: true },
  player: { type: String, trim: true }
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
  finishedAt: { type: Date }
}, {
  timestamps: true
});

fixtureSchema.index({ homeTeam: 1, awayTeam: 1, isFinal: 1 }, { unique: false });
// Enforce unique scheduled time across all fixtures having a kickoffAt.
// sparse:true allows multiple documents without kickoffAt.
fixtureSchema.index({ kickoffAt: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('Fixture', fixtureSchema);

