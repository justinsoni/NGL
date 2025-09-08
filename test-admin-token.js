#!/usr/bin/env node

/**
 * Test Admin Token Creation
 * 
 * This script creates a custom token for the admin user to test authentication
 */

const admin = require('firebase-admin');
const axios = require('axios');

// Initialize Firebase Admin (reuse existing config)
require('dotenv').config({ path: './backend/.env' });

const serviceAccount = {
  type: "service_account",
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  client_id: process.env.FIREBASE_CLIENT_ID,
  auth_uri: process.env.FIREBASE_AUTH_URI,
  token_uri: process.env.FIREBASE_TOKEN_URI,
  auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
  client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL
};

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: process.env.FIREBASE_PROJECT_ID
});

async function createAdminToken() {
  console.log('🔑 Creating admin token for testing...\n');

  try {
    // Find or create admin user in Firebase
    let adminUser;
    try {
      adminUser = await admin.auth().getUserByEmail('admin@ngl.com');
      console.log('✅ Found existing admin user:', adminUser.uid);
    } catch (error) {
      console.log('⚠️ Admin user not found in Firebase, creating one...');
      adminUser = await admin.auth().createUser({
        email: 'admin@ngl.com',
        password: 'admin123',
        displayName: 'Admin User',
        emailVerified: true
      });
      console.log('✅ Created admin user:', adminUser.uid);
    }

    // Set custom claims for admin
    await admin.auth().setCustomUserClaims(adminUser.uid, {
      role: 'admin'
    });
    console.log('✅ Set admin custom claims');

    // Create custom token
    const customToken = await admin.auth().createCustomToken(adminUser.uid);
    console.log('✅ Custom token created');

    console.log('\n📋 Admin User Details:');
    console.log('Email:', adminUser.email);
    console.log('UID:', adminUser.uid);
    console.log('Display Name:', adminUser.displayName);
    console.log('Email Verified:', adminUser.emailVerified);

    console.log('\n🔑 Custom Token (for testing):');
    console.log(customToken);

    console.log('\n📝 Instructions:');
    console.log('1. The admin user is now properly set up in Firebase');
    console.log('2. You can login to the frontend with:');
    console.log('   Email: admin@ngl.com');
    console.log('   Password: admin123');
    console.log('3. Once logged in, you should be able to create clubs in the admin dashboard');

    // Test if we can verify the token
    console.log('\n🧪 Testing token verification...');
    try {
      const decodedToken = await admin.auth().verifyIdToken(customToken);
      console.log('❌ Custom token cannot be verified directly (this is expected)');
    } catch (error) {
      console.log('✅ Custom token verification failed as expected (custom tokens need to be exchanged for ID tokens)');
    }

  } catch (error) {
    console.error('💥 Error:', error.message);
  }
}

// Run the test
createAdminToken()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Failed:', error);
    process.exit(1);
  });
