#!/usr/bin/env node

/**
 * Test Club API Endpoints
 * 
 * This script tests the club management API endpoints
 */

const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000/api';

async function testClubAPI() {
  console.log('🧪 Testing Club API Endpoints...\n');

  try {
    // Test 1: Get all clubs (public endpoint)
    console.log('1. Testing GET /api/clubs (public)');
    try {
      const response = await axios.get(`${API_BASE_URL}/clubs`);
      console.log('✅ Success:', response.data.success);
      console.log('📊 Clubs found:', response.data.data.length);
      console.log('📄 Pagination:', response.data.pagination);
    } catch (error) {
      console.log('❌ Error:', error.response?.data?.message || error.message);
    }

    // Test 2: Get club stats (public endpoint)
    console.log('\n2. Testing GET /api/clubs/stats (public)');
    try {
      const response = await axios.get(`${API_BASE_URL}/clubs/stats`);
      console.log('✅ Success:', response.data.success);
      console.log('📊 Stats:', response.data.data);
    } catch (error) {
      console.log('❌ Error:', error.response?.data?.message || error.message);
    }

    // Test 3: Try to create club without authentication (should fail)
    console.log('\n3. Testing POST /api/clubs (without auth - should fail)');
    try {
      const clubData = {
        name: 'Test Club',
        logo: 'https://example.com/logo.png',
        stadium: 'Test Stadium',
        founded: 2000,
        city: 'Test City',
        country: 'Test Country'
      };
      
      const response = await axios.post(`${API_BASE_URL}/clubs`, clubData);
      console.log('❌ Unexpected success:', response.data);
    } catch (error) {
      console.log('✅ Expected error:', error.response?.data?.message || error.message);
    }

    // Test 4: Test health endpoint
    console.log('\n4. Testing GET /health');
    try {
      const response = await axios.get(`${API_BASE_URL.replace('/api', '')}/health`);
      console.log('✅ Success:', response.data.success);
      console.log('📊 Server status:', response.data.message);
    } catch (error) {
      console.log('❌ Error:', error.response?.data?.message || error.message);
    }

    console.log('\n🎉 Club API test completed!');
    console.log('\n📝 Summary:');
    console.log('- Public endpoints (GET /clubs, GET /clubs/stats, GET /health) should work');
    console.log('- Protected endpoints (POST /clubs) should require authentication');
    console.log('- To test club creation, you need to:');
    console.log('  1. Login as admin in the frontend');
    console.log('  2. Use the admin dashboard to create clubs');
    console.log('  3. The frontend will handle authentication automatically');

  } catch (error) {
    console.error('💥 Unexpected error:', error.message);
  }
}

// Run the test
testClubAPI().catch(console.error);
