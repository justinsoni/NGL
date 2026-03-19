require('dotenv').config();
const EmailService = require('./utils/emailService');

async function runTest() {
    const es = new EmailService();
    console.log('Sending test manager credentials...');

    try {
        const result = await es.sendManagerCredentials(
            'justinsony2026@mca.ajce.in',
            'Test Manager',
            'TempPassword123!',
            'https://example.com/reset',
            'Test Club',
            'Antigravity AI'
        );

        console.log('Result:', JSON.stringify(result, null, 2));
    } catch (err) {
        console.error('Test script crashed:', err);
    }
}

runTest();
