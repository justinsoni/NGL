require('dotenv').config();
const brevo = require('@getbrevo/brevo');

async function test() {
    let defaultClient = brevo.ApiClient.instance;
    let apiKey = defaultClient.authentications['api-key'];
    apiKey.apiKey = process.env.BREVO_API_KEY;

    const api = new brevo.TransactionalEmailsApi();
    const senderEmail = process.env.BREVO_SENDER_EMAIL || 'justinsony2002@gmail.com';

    try {
        const result = await api.sendTransacEmail({
            to: [{ email: 'justinsoni2026@mca.ajce.in', name: 'Test Coach' }],
            sender: { email: senderEmail, name: 'NGL Administration' },
            subject: 'NGL Test - Coach Welcome Email',
            htmlContent: '<h1>Test</h1><p>If you see this, email delivery works!</p>',
            textContent: 'Test - if you see this, email delivery works!'
        });
        console.log('✅ Brevo accepted the email!');
        console.log('Message ID:', JSON.stringify(result.body || result));
    } catch (err) {
        console.log('❌ Brevo rejected the email');
        console.log('Error:', err.message);
        const responseDetail = JSON.stringify(err.response?.body || err.response?.text || err.body, null, 2);
        console.log('Response:', responseDetail);

        if (err.message.includes('Unauthorized') || responseDetail.includes('unauthorized')) {
            console.log('\n💡 TROUBLESHOOTING TIP:');
            console.log('1. Verify BREVO_API_KEY in .env starts with "xkeysib-"');
            console.log('2. Ensure "Transactional emails" are enabled in your Brevo account dashboard.');
            console.log('3. Verify that the sender email (' + senderEmail + ') is verified in Brevo Senders & IP settings.');
        }
    }
}

test();
