const https = require('https');
require('dotenv').config();

const data = JSON.stringify({
    sender: { email: process.env.BREVO_SENDER_EMAIL, name: 'NGL Test' },
    to: [{ email: 'justinsony2026@mca.ajce.in', name: 'Test' }],
    subject: 'Raw API Test',
    htmlContent: '<html><body><h1>Raw API Test</h1></body></html>'
});

const options = {
    hostname: 'api.brevo.com',
    port: 443,
    path: '/v3/smtp/email',
    method: 'POST',
    headers: {
        'accept': 'application/json',
        'api-key': process.env.BREVO_API_KEY,
        'content-type': 'application/json',
        'content-length': data.length
    }
};

console.log('--- Brevo Raw API Test ---');
console.log('Sender Email:', process.env.BREVO_SENDER_EMAIL);
console.log('API Key Starts With:', process.env.BREVO_API_KEY ? process.env.BREVO_API_KEY.substring(0, 10) + '...' : 'MISSING');

const req = https.request(options, (res) => {
    console.log('Response Status:', res.statusCode);

    let responseData = '';
    res.on('data', (d) => {
        responseData += d;
    });

    res.on('end', () => {
        console.log('Response Body:', responseData);
        if (res.statusCode === 201) {
            console.log('✅ Success! Email accepted by API.');
        } else if (res.statusCode === 401) {
            console.log('❌ Unauthorized: Check your API Key.');
        } else {
            console.log('❌ Failed with status ' + res.statusCode);
            try {
                const error = JSON.parse(responseData);
                if (error.code === 'unauthorized' && error.message.includes('Transactional')) {
                    console.log('💡 TIP: Transactional emails are NOT enabled in your Brevo account.');
                }
            } catch (e) {
                // Not JSON
            }
        }
    });
});

req.on('error', (e) => {
    console.error('Request Error:', e);
});

req.write(data);
req.end();
