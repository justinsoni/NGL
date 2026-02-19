require('dotenv').config();
console.log('--- Environment Check ---');
console.log('BREVO_API_KEY:', process.env.BREVO_API_KEY ? 'Present (length: ' + process.env.BREVO_API_KEY.length + ')' : 'Missing');
console.log('BREVO_SENDER_EMAIL:', process.env.BREVO_SENDER_EMAIL || 'Missing');
console.log('EMAIL_USER:', process.env.EMAIL_USER || 'Missing');
console.log('EMAIL_PASSWORD:', process.env.EMAIL_PASSWORD === 'replace-with-your-gmail-app-password' ? 'PLACEHOLDER' : (process.env.EMAIL_PASSWORD ? 'Present' : 'Missing'));
console.log('-------------------------');
