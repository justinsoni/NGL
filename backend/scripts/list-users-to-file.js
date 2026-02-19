const { admin, initializeFirebase } = require('../config/firebase');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

dotenv.config({ path: path.join(__dirname, '..', '.env') });
initializeFirebase();

async function listAllUsers() {
    try {
        const listUsersResult = await admin.auth().listUsers(100);
        const logFile = path.join(__dirname, 'users_debug.txt');
        let content = 'Firebase Users:\n';
        listUsersResult.users.forEach((userRecord) => {
            content += `Email: [${userRecord.email}] UID: [${userRecord.uid}] Providers: [${userRecord.providerData.map(p => p.providerId).join(',')}]\n`;
        });
        fs.writeFileSync(logFile, content);
        console.log(`✅ User list written to ${logFile}`);
    } catch (error) {
        console.error('💥 Error listing users:', error.message);
    }
}

listAllUsers();
