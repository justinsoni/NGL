const mongoose = require('mongoose');
const User = require('../models/User');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

async function checkMongoUser(email) {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        const user = await User.findOne({ email: email.toLowerCase() });
        if (user) {
            console.log('✅ User found in MongoDB:');
            console.log('  ID:', user._id);
            console.log('  Name:', user.name);
            console.log('  Firebase UID:', user.firebaseUid);
            console.log('  Role:', user.role);
            console.log('  Is Active:', user.isActive);
        } else {
            console.log('❌ User NOT found in MongoDB.');
        }
        await mongoose.disconnect();
    } catch (error) {
        console.error('💥 Error:', error.message);
    }
}

const emailToCheck = 'justinsoni2026@mca.ajce.in';
checkMongoUser(emailToCheck);
