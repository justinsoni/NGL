require('dotenv').config();
const EmailService = require('./utils/emailService');

async function testEmail() {
  console.log('🧪 Testing Email Configuration...');
  
  const emailService = new EmailService();
  
  if (!emailService.transporter) {
    console.log('❌ Email service not configured!');
    console.log('Please create .env file with:');
    console.log('EMAIL_USER=justinsony2000@gmail.com');
    console.log('EMAIL_PASSWORD=your-16-character-app-password');
    return;
  }
  
  console.log('✅ Email service configured successfully!');
  
  try {
    const result = await emailService.sendManagerCredentials(
      'justinsony2000@gmail.com',
      'Test Manager',
      'TestPassword123!',
      'Test Club',
      'System Administrator'
    );
    
    if (result.success) {
      console.log('✅ Test email sent successfully!');
      console.log('Message ID:', result.messageId);
    } else {
      console.log('❌ Test email failed:', result.message);
    }
  } catch (error) {
    console.log('❌ Test email error:', error.message);
  }
}

testEmail(); 