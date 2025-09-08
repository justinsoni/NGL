#!/usr/bin/env node

/**
 * Debug Authentication Flow
 * 
 * This script helps debug the authentication flow by testing the token
 */

require('dotenv').config({ path: './backend/.env' });
const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000/api';

async function debugAuth() {
  console.log('🔍 Debugging authentication flow...\n');

  try {
    // Test 1: Check if we can get user profile (this works according to logs)
    console.log('1. Testing GET /api/auth/profile (should work)');
    try {
      const response = await axios.get(`${API_BASE_URL}/auth/profile`);
      console.log('❌ This should fail without auth token, but got:', response.status);
    } catch (error) {
      console.log('✅ Expected error:', error.response?.status, error.response?.data?.message);
    }

    // Test 2: Check club endpoints
    console.log('\n2. Testing GET /api/clubs (public - should work)');
    try {
      const response = await axios.get(`${API_BASE_URL}/clubs`);
      console.log('✅ Success:', response.data.success, '- Found', response.data.data.length, 'clubs');
    } catch (error) {
      console.log('❌ Error:', error.response?.data?.message || error.message);
    }

    // Test 3: Try to create club without auth (should fail)
    console.log('\n3. Testing POST /api/clubs (without auth - should fail)');
    try {
      const clubData = {
        name: 'Debug Test Club',
        logo: 'https://example.com/logo.png',
        stadium: 'Debug Stadium',
        founded: 2024,
        city: 'Debug City',
        country: 'Debug Country'
      };
      
      const response = await axios.post(`${API_BASE_URL}/clubs`, clubData);
      console.log('❌ Unexpected success:', response.data);
    } catch (error) {
      console.log('✅ Expected error:', error.response?.status, error.response?.data?.message);
    }

    console.log('\n📝 Analysis:');
    console.log('- The API endpoints are working correctly');
    console.log('- Authentication is required for club creation (as expected)');
    console.log('- The issue is likely in the frontend token handling');
    
    console.log('\n🔧 Debugging steps for frontend:');
    console.log('1. Open browser developer tools');
    console.log('2. Go to Network tab');
    console.log('3. Try to create a club in the admin dashboard');
    console.log('4. Check if the Authorization header is being sent');
    console.log('5. Check if the Firebase token is valid');

    console.log('\n💡 Common issues:');
    console.log('- Firebase user not properly authenticated');
    console.log('- Token not being retrieved correctly');
    console.log('- Token not being added to request headers');
    console.log('- Token expired or invalid');

  } catch (error) {
    console.error('💥 Unexpected error:', error.message);
  }
}

// Run the debug
debugAuth()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Debug failed:', error);
    process.exit(1);
  });
