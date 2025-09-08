const EmailService = require('./utils/emailService');

async function testEmailService() {
  console.log('🧪 Testing Email Service Configuration...');
  console.log('==========================================');
  
  const emailService = new EmailService();
  
  console.log('\n📧 Testing Manager Credentials Email...');
  
  try {
    const result = await emailService.sendManagerCredentials(
      'justinsoni2026@mca.ajce.in',
      'Test Manager',
      'TestPassword123!',
      'Manchester City',
      'System Administrator'
    );
    
    if (result.success) {
      console.log('✅ Email sent successfully!');
      console.log('Message ID:', result.messageId);
      console.log('Provider:', result.provider);
    } else {
      console.log('❌ Email not sent:', result.message);
      if (result.credentials) {
        console.log('\n📋 Credentials that should have been sent:');
        console.log('Email:', result.credentials.email);
        console.log('Password:', result.credentials.password);
        console.log('Club:', result.credentials.club);
      }
    }
  } catch (error) {
    console.log('❌ Test email error:', error.message);
  }
  
  console.log('\n🔧 To enable real email sending:');
  console.log('1. Create a .env file in the backend directory');
  console.log('2. Add your email credentials:');
  console.log('   # For Brevo (recommended):');
  console.log('   BREVO_API_KEY=xkeysib-your-actual-api-key');
  console.log('   BREVO_SENDER_EMAIL=justinsony2000@gmail.com');
  console.log('   # For Gmail (fallback):');
  console.log('   EMAIL_USER=justinsony2000@gmail.com');
  console.log('   EMAIL_PASSWORD=your-16-character-app-password');
  console.log('3. Restart the backend server');
}

// Run the test if this file is executed directly
if (require.main === module) {
  testEmailService();
}

module.exports = { testEmailService }; 