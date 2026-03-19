require('dotenv').config();
const EmailService = require('./utils/emailService');

console.log('--- EmailService Initialization Test ---');
const es = new EmailService();

console.log('Instance Details:');
console.log('- brevoApi initialized:', !!es.brevoApi);
console.log('- transporter initialized:', !!es.transporter);

if (es.brevoApi) {
    console.log('✅ SUCCESS: Brevo API is ready.');
} else {
    console.log('❌ FAILURE: Brevo API is NULL.');
    const key = (process.env.BREVO_API_KEY || '').trim();
    console.log('Key Check:');
    console.log('- Length:', key.length);
    console.log('- Starts with xkeysib-:', key.startsWith('xkeysib-'));
    console.log('- Key value (first 20):', key.substring(0, 20));
}
