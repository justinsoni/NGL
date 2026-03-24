const mongoose = require('mongoose');

const careerHistorySchema = new mongoose.Schema({
    club: { type: String, trim: true },
    season: { type: String, trim: true },        // e.g. "2022/23"
    appearances: { type: Number, default: 0 },
    goals: { type: Number, default: 0 },
    assists: { type: Number, default: 0 },
    yellowCards: { type: Number, default: 0 },
    redCards: { type: Number, default: 0 },
    minutesPlayed: { type: Number, default: 0 },
    role: { type: String, trim: true },           // role played at that club
    logoUrl: { type: String, trim: true },        // club badge/logo
}, { _id: false });

const prospectSchema = new mongoose.Schema({
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
        lowercase: true
    },
    phone: { type: String, trim: true },
    dob: { type: Date },
    age: { type: Number, min: 0 },
    position: { type: String, required: true, trim: true },
    nationality: { type: String, required: true, trim: true },
    previousClub: { type: String, trim: true },

    // Media
    imageUrl: { type: String, trim: true },         // primary avatar/photo
    avatarUrl: { type: String, trim: true },         // alias kept for compatibility
    videoUrls: [{ type: String, trim: true }],       // highlight reel URLs (YouTube embeds, etc.)
    galleryImages: [{ type: String, trim: true }],   // extra photos

    // Scouting
    scoutReport: { type: String, maxlength: 2000 },
    strengths: [{ type: String, trim: true }],
    weaknesses: [{ type: String, trim: true }],
    potentialScore: { type: Number, min: 0, max: 100 },
    fitnessStatus: { type: String, trim: true, default: 'Fit' },
    marketValue: { type: String, trim: true },       // e.g. "€2.5M"
    preferredFoot: { type: String, enum: ['Left', 'Right', 'Both'], default: 'Right' },
    height: { type: Number },   // cm
    weight: { type: Number },   // kg

    // Stats
    pace: { type: Number, min: 0, max: 100 },
    shooting: { type: Number, min: 0, max: 100 },
    passing: { type: Number, min: 0, max: 100 },
    dribbling: { type: Number, min: 0, max: 100 },
    defending: { type: Number, min: 0, max: 100 },
    physicality: { type: Number, min: 0, max: 100 },

    // Aggregate career totals (auto-computed or stored)
    totalGoals: { type: Number, default: 0 },
    totalAssists: { type: Number, default: 0 },
    totalAppearances: { type: Number, default: 0 },

    // Career history (per club/season)
    careerHistory: [careerHistorySchema],

    // Admin / system
    rejectedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
}, {
    timestamps: true
});

// Auto-compute totals before save
prospectSchema.pre('save', function (next) {
    if (this.careerHistory && this.careerHistory.length > 0) {
        this.totalGoals = this.careerHistory.reduce((s, c) => s + (c.goals || 0), 0);
        this.totalAssists = this.careerHistory.reduce((s, c) => s + (c.assists || 0), 0);
        this.totalAppearances = this.careerHistory.reduce((s, c) => s + (c.appearances || 0), 0);
    }
    // Sync avatarUrl <-> imageUrl
    if (!this.avatarUrl && this.imageUrl) this.avatarUrl = this.imageUrl;
    if (!this.imageUrl && this.avatarUrl) this.imageUrl = this.avatarUrl;
    next();
});

module.exports = mongoose.model('Prospect', prospectSchema);