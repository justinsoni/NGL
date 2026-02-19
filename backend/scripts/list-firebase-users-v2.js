const { admin, initializeFirebase } = require('../config/firebase');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env') });
initializeFirebase();

async function listAllUsers() {
    try {
        const listUsersResult = await admin.auth().listUsers(100);
        console.log('START_USER_LIST');
        listUsersResult.users.forEach((userRecord) => {
            console.log(`EMAIL: [${userRecord.email}] UID: [${userRecord.uid}]`);
        });
        console.log('END_USER_LIST');
    } catch (error) {
        console.error('💥 Error listing users:', error.message);
    }
}

listAllUsers();
