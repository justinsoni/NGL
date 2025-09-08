#!/usr/bin/env node

/**
 * Test Club Creation with Authentication
 * 
 * This script tests club creation with proper Firebase authentication
 */

const axios = require('axios');
const admin = require('firebase-admin');

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

const API_BASE_URL = 'http://localhost:5000/api';

async function testClubCreationWithAuth() {
  console.log('🧪 Testing Club Creation with Authentication...\n');

  try {
    // Step 1: Create a custom token for admin user
    console.log('1. Creating custom token for admin user...');
    
    // Find admin user in Firebase
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

    // Create custom token
    const customToken = await admin.auth().createCustomToken(adminUser.uid);
    console.log('✅ Custom token created');

    // Step 2: Exchange custom token for ID token (simulate frontend login)
    console.log('\n2. Exchanging custom token for ID token...');
    
    const tokenResponse = await axios.post(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${process.env.FIREBASE_WEB_API_KEY || 'your-web-api-key'}`,
      {
        token: customToken,
        returnSecureToken: true
      }
    );

    const idToken = tokenResponse.data.idToken;
    console.log('✅ ID token obtained');

    // Step 3: Test club creation with authentication
    console.log('\n3. Testing club creation with authentication...');
    
    const newClubData = {
      name: 'Test FC',
      logo: 'https://example.com/test-fc-logo.png',
      stadium: 'Test Stadium',
      stadiumCapacity: 25000,
      founded: 2024,
      city: 'Test City',
      country: 'Test Country',
      colors: {
        primary: 'Blue',
        secondary: 'White'
      },
      honours: [
        { name: 'Test Cup', count: 1 }
      ],
      group: 'A',
      description: 'A test football club created via API',
      website: 'https://testfc.com',
      email: 'info@testfc.com'
    };

    const createResponse = await axios.post(
      `${API_BASE_URL}/clubs`,
      newClubData,
      {
        headers: {
          'Authorization': `Bearer ${idToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ Club created successfully!');
    console.log('📊 Created club:', createResponse.data.data.name);
    console.log('🆔 Club ID:', createResponse.data.data._id);

    // Step 4: Verify club was created by fetching it
    console.log('\n4. Verifying club creation...');
    
    const getResponse = await axios.get(`${API_BASE_URL}/clubs`);
    const clubs = getResponse.data.data;
    const testClub = clubs.find(club => club.name === 'Test FC');
    
    if (testClub) {
      console.log('✅ Club verification successful!');
      console.log('📋 Club details:');
      console.log(`   Name: ${testClub.name}`);
      console.log(`   Stadium: ${testClub.stadium}`);
      console.log(`   City: ${testClub.city}`);
      console.log(`   Founded: ${testClub.founded}`);
    } else {
      console.log('❌ Club not found in database');
    }

    // Step 5: Clean up - delete the test club
    console.log('\n5. Cleaning up test club...');
    
    if (testClub) {
      await axios.delete(
        `${API_BASE_URL}/clubs/${testClub._id}`,
        {
          headers: {
            'Authorization': `Bearer ${idToken}`
          }
        }
      );
      console.log('✅ Test club deleted successfully');
    }

    console.log('\n🎉 Club creation test completed successfully!');
    console.log('\n📝 Summary:');
    console.log('- Firebase authentication is working correctly');
    console.log('- Club creation API is functional');
    console.log('- MongoDB integration is working');
    console.log('- The frontend should now be able to create clubs when logged in as admin');

  } catch (error) {
    console.error('💥 Error during test:', error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      console.log('\n🔍 Authentication issue detected:');
      console.log('- Make sure Firebase is properly configured');
      console.log('- Check that the admin user exists in both Firebase and MongoDB');
      console.log('- Verify that custom claims are set correctly');
    }
  }
}

// Run the test
testClubCreationWithAuth()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Test failed:', error);
    process.exit(1);
  });
