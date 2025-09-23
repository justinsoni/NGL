const mongoose = require('mongoose');

const teamStandingSchema = new mongoose.Schema({
  club: { type: mongoose.Schema.Types.ObjectId, ref: 'Club', required: true, index: true },
  played: { type: Number, default: 0 },
  won: { type: Number, default: 0 },
  drawn: { type: Number, default: 0 },
  lost: { type: Number, default: 0 },
  gf: { type: Number, default: 0 },
  ga: { type: Number, default: 0 },
  gd: { type: Number, default: 0 },
  points: { type: Number, default: 0 }
}, { _id: false });

const leagueTableSchema = new mongoose.Schema({
  name: { type: String, default: 'Default League' },
  season: { type: String, default: '2025' },
  standings: { type: [teamStandingSchema], default: [] },
  completed: { type: Boolean, default: false },
  championClub: { type: mongoose.Schema.Types.ObjectId, ref: 'Club' }
}, { timestamps: true });

leagueTableSchema.index({ season: 1, name: 1 }, { unique: false });

module.exports = mongoose.model('LeagueTable', leagueTableSchema);

