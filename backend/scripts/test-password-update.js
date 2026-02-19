const { admin, initializeFirebase } = require('../config/firebase');
const dotenv = require('dotenv');
const path = require('path');
const axios = require('axios');

dotenv.config({ path: path.join(__dirname, '..', '.env') });
initializeFirebase();

const email = 'justinsoni2026@mca.ajce.in';
const password = 'TestPassword123!';
const name = 'justin';

async function testPasswordUpdateAndLogin() {
    console.log(`🛠️ Manually updating password for: ${email}`);
    try {
        const user = await admin.auth().getUserByEmail(email);
        console.log(`✅ Found user: ${user.uid}`);

        await admin.auth().updateUser(user.uid, {
            password: password,
            displayName: name
        });
        console.log('✅ Password updated successfully via Admin SDK');

        // We can't easily sign in with client SDK from Node without more setup (need API key, etc.)
        // But we can check if the user has a password provider now
        const updatedUser = await admin.auth().getUserByEmail(email);
        const hasPassword = updatedUser.providerData.some(p => p.providerId === 'password');
        console.log('📊 Provider Data:', JSON.stringify(updatedUser.providerData, null, 2));
        console.log(`🔑 Has password provider? ${hasPassword}`);

        if (!hasPassword) {
            console.log('⚠️ Warning: User does not have a password provider even after update!');
        }

    } catch (error) {
        console.error('💥 Error:', error.message);
    }
}

testPasswordUpdateAndLogin();
