const { admin, initializeFirebase } = require('../config/firebase');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env') });
initializeFirebase();

async function checkUser(email) {
    console.log(`🔍 Checking Firebase user: ${email}`);
    try {
        const userRecord = await admin.auth().getUserByEmail(email);
        console.log('✅ User found in Firebase:');
        console.log('  UID:', userRecord.uid);
        console.log('  Email Verified:', userRecord.emailVerified);
        console.log('  Display Name:', userRecord.displayName);
    } catch (error) {
        if (error.code === 'auth/user-not-found') {
            console.log('❌ User NOT found in Firebase.');
        } else {
            console.error('💥 Error checking user:', error.message);
        }
    }
}

const emailToCheck = 'justinsoni2026@mca.ajce.in';
checkUser(emailToCheck);
