#!/usr/bin/env node

/**
 * Test Script for Manager Creation Email System
 * 
 * This script tests the real-time manager creation and email delivery system
 * Run this to verify your email configuration is working correctly.
 * 
 * Usage:
 *   node test-manager-creation.js
 */

require('dotenv').config();
const EmailService = require('./backend/utils/emailService');

async function testManagerCreation() {
  console.log('🧪 Testing Manager Creation Email System...\n');
  
  // Check environment configuration
  console.log('🔧 Environment Configuration:');
  console.log('BREVO_API_KEY:', process.env.BREVO_API_KEY ? '✅ Configured' : '❌ Not configured');
  console.log('EMAIL_USER:', process.env.EMAIL_USER || '❌ Not configured');
  console.log('EMAIL_PASSWORD:', process.env.EMAIL_PASSWORD ? '✅ Configured' : '❌ Not configured');
  console.log('MONGODB_URI:', process.env.MONGODB_URI ? '✅ Configured' : '❌ Not configured');
  console.log('FIREBASE_PROJECT_ID:', process.env.FIREBASE_PROJECT_ID || '❌ Not configured');
  console.log('');
  
  // Initialize email service
  console.log('📧 Initializing Email Service...');
  const emailService = new EmailService();
  console.log('');
  
  // Test password generation
  console.log('🔐 Testing Password Generation...');
  const testPassword = EmailService.generateSecurePassword();
  console.log('Generated password:', testPassword);
  console.log('Password length:', testPassword.length);
  console.log('Has uppercase:', /[A-Z]/.test(testPassword) ? '✅' : '❌');
  console.log('Has lowercase:', /[a-z]/.test(testPassword) ? '✅' : '❌');
  console.log('Has numbers:', /[0-9]/.test(testPassword) ? '✅' : '❌');
  console.log('Has symbols:', /[!@#$%^&*]/.test(testPassword) ? '✅' : '❌');
  console.log('');
  
  // Test email sending
  console.log('📨 Testing Email Delivery...');
  try {
    const result = await emailService.sendManagerCredentials(
      'justinsoni2026@mca.ajce.in', // Test email
      'Test Manager',               // Manager name
      testPassword,                 // Generated password
      'Chelsea FC',                 // Club name
      'System Administrator'        // Admin name
    );
    
    if (result.success) {
      console.log('✅ Email sent successfully!');
      console.log('Message ID:', result.messageId);
      console.log('Provider:', result.provider);
      console.log('');
      console.log('🎯 Check the email inbox for the manager credentials email.');
    } else {
      console.log('❌ Email delivery failed:', result.message);
      if (result.credentials) {
        console.log('');
        console.log('📋 Credentials that should have been sent:');
        console.log('Email:', result.credentials.email);
        console.log('Password:', result.credentials.password);
        console.log('Club:', result.credentials.club);
      }
    }
  } catch (error) {
    console.log('❌ Email test error:', error.message);
  }
  
  console.log('');
  console.log('🔧 Configuration Help:');
  console.log('');
  console.log('To enable email sending, create a .env file in the backend directory with:');
  console.log('');
  console.log('# For Brevo (recommended):');
  console.log('BREVO_API_KEY=xkeysib-your-actual-api-key');
  console.log('BREVO_SENDER_EMAIL=justinsony2000@gmail.com');
  console.log('');
  console.log('# For Gmail (fallback):');
  console.log('EMAIL_USER=justinsony2000@gmail.com');
  console.log('EMAIL_PASSWORD=your-16-character-app-password');
  console.log('');
  console.log('# Database and Firebase:');
  console.log('MONGODB_URI=mongodb://localhost:27017/football-league-hub');
  console.log('FIREBASE_PROJECT_ID=your-firebase-project-id');
  console.log('# ... other Firebase config');
  console.log('');
  console.log('📚 See REAL_TIME_EMAIL_SETUP.md for detailed setup instructions.');
}

// Run the test if this file is executed directly
if (require.main === module) {
  testManagerCreation().catch(console.error);
}

module.exports = { testManagerCreation };
