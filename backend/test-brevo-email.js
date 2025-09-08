const EmailService = require('./utils/emailService');

async function testBrevoEmail() {
  console.log('🧪 Testing Brevo Email Configuration...');
  
  const emailService = new EmailService();
  
  if (!emailService.brevoApi) {
    console.log('❌ Brevo email service not configured!');
    console.log('Please create .env file with:');
    console.log('BREVO_API_KEY=xkeysib-your-brevo-api-key-here');
    console.log('BREVO_SENDER_EMAIL=justinsony2000@gmail.com');
    return;
  }
  
  console.log('✅ Brevo email service configured successfully!');
  
  try {
    const result = await emailService.sendManagerCredentials(
      'jobinshaji111@gmail.com',
      'Test Manager',
      'TestPassword123!',
      'Test Club',
      'System Administrator'
    );
    
    if (result.success) {
      console.log('✅ Test email sent successfully!');
      console.log('Message ID:', result.messageId);
      console.log('Provider:', result.provider);
    } else {
      console.log('❌ Test email failed:', result.message);
    }
  } catch (error) {
    console.log('❌ Test email error:', error.message);
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testBrevoEmail();
}

module.exports = { testBrevoEmail }; 