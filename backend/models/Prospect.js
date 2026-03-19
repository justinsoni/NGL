const mongoose = require('mongoose');

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
    phone: {
        type: String,
        trim: true
    },
    dob: {
        type: Date
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
    imageUrl: {
        type: String,
        trim: true
    },
    scoutReport: {
        type: String,
        maxlength: 2000
    },
    strengths: [{
        type: String,
        trim: true
    }],
    weaknesses: [{
        type: String,
        trim: true
    }],
    potentialScore: {
        type: Number,
        min: 0,
        max: 100
    },
    pace: { type: Number, min: 0, max: 100 },
    shooting: { type: Number, min: 0, max: 100 },
    passing: { type: Number, min: 0, max: 100 },
    dribbling: { type: Number, min: 0, max: 100 },
    defending: { type: Number, min: 0, max: 100 },
    physicality: { type: Number, min: 0, max: 100 },
    rejectedBy: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }]
}, {
    timestamps: true
});

module.exports = mongoose.model('Prospect', prospectSchema);
