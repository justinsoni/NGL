const mongoose = require('mongoose');
const User = require('../models/User');
const { admin, initializeFirebase } = require('../config/firebase');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env') });
initializeFirebase();

const email = 'justinsoni2026@mca.ajce.in';
const tempPassword = 'LoginNow123!';

async function syncAccount() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // 1. Get Firebase User
        let firebaseUser;
        try {
            firebaseUser = await admin.auth().getUserByEmail(email);
            console.log('✅ Found Firebase User:', firebaseUser.uid);
        } catch (e) {
            console.log('❌ Firebase user not found. Creating one...');
            firebaseUser = await admin.auth().createUser({
                email: email,
                password: tempPassword,
                displayName: 'justin',
                emailVerified: true
            });
            console.log('✅ Created Firebase User:', firebaseUser.uid);
        }

        // 2. Update Firebase Password to something known for the user
        await admin.auth().updateUser(firebaseUser.uid, {
            password: tempPassword
        });
        console.log(`✅ Updated Firebase password to: ${tempPassword}`);

        // 3. Update MongoDB Record
        const user = await User.findOneAndUpdate(
            { email: email.toLowerCase() },
            {
                firebaseUid: firebaseUser.uid,
                isActive: true,
                role: 'clubManager'
            },
            { new: true }
        );

        if (user) {
            console.log('✅ Updated MongoDB record with real Firebase UID:');
            console.log('  New UID:', user.firebaseUid);
        } else {
            console.log('❌ No MongoDB record found for this email.');
        }

        await mongoose.disconnect();
        console.log('👋 Done');
    } catch (error) {
        console.error('💥 Error:', error.message);
    }
}

syncAccount();
