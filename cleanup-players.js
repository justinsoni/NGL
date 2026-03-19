const mongoose = require('mongoose');
const Player = require('./backend/models/Player');
require('dotenv').config({ path: './backend/.env' });

async function cleanupPlayers() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const result = await Player.deleteMany({ isPublicProspect: true });
        console.log(`Cleaned up ${result.deletedCount} temporary prospects from Player collection.`);
        mongoose.connection.close();
    } catch (err) {
        console.error(err);
    }
}

cleanupPlayers();
