const { admin, initializeFirebase } = require('../config/firebase');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env') });
initializeFirebase();

async function listAllUsers(nextPageToken) {
    try {
        const listUsersResult = await admin.auth().listUsers(100, nextPageToken);
        console.log(`📋 Found ${listUsersResult.users.length} users in Firebase`);
        listUsersResult.users.forEach((userRecord) => {
            console.log(`- ${userRecord.email} (UID: ${userRecord.uid})`);
        });
        if (listUsersResult.pageToken) {
            console.log('... more users available');
        }
    } catch (error) {
        console.error('💥 Error listing users:', error.message);
    }
}

listAllUsers();
