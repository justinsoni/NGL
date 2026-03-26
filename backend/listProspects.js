require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./config/database');
const Prospect = require('./models/Prospect');

const listNames = async () => {
    try {
        await connectDB();
        const prospects = await Prospect.find({}, 'name');
        console.log('Prospect names in DB:');
        prospects.forEach(p => console.log(`- ${p.name}`));
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

listNames();
