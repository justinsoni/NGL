const { admin, initializeFirebase } = require('../config/firebase');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env') });
initializeFirebase();

const email = 'justinsoni2026@mca.ajce.in';
const password = 'TestPassword123!';
const name = 'justin';

async function simulateCreateUser() {
    console.log(`🧪 Simulating createUser for: ${email}`);
    try {
        const firebaseUser = await admin.auth().createUser({
            email: email,
            password: password,
            displayName: name,
            emailVerified: true
        });
        console.log('✅ Success! UID:', firebaseUser.uid);
    } catch (error) {
        console.log('❌ FAILED');
        console.log('Code:', error.code);
        console.log('Message:', error.message);
    }
}

simulateCreateUser();
