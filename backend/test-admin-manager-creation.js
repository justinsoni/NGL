#!/usr/bin/env node

require('dotenv').config();
const axios = require('axios');
const { initializeFirebase, admin } = require('./config/firebase');
const mongoose = require('mongoose');
const User = require('./models/User');

async function testAdminManagerCreation() {
  try {
    console.log('🧪 Testing admin manager creation workflow...');
    
    initializeFirebase();
    await mongoose.connect(process.env.MONGODB_URI);
    
    const testEmail = 'test-manager@example.com';
    const testName = 'Test Manager';
    const testClub = 'Chelsea';
    
    // Step 1: Clean up any existing records for this test email
    console.log('\n🧹 Step 1: Cleaning up existing test records...');
    
    // Delete from MongoDB
    const existingMongo = await User.findOne({ email: testEmail });
    if (existingMongo) {
      await User.deleteOne({ email: testEmail });
      console.log('✅ Deleted existing MongoDB record');
    }
    
    // Delete from Firebase
    try {
      const existingFirebase = await admin.auth().getUserByEmail(testEmail);
      await admin.auth().deleteUser(existingFirebase.uid);
      console.log('✅ Deleted existing Firebase user');
    } catch (error) {
      console.log('ℹ️ No existing Firebase user to delete');
    }
    
    // Step 2: Create a Firebase user to simulate existing user scenario
    console.log('\n🔥 Step 2: Creating existing Firebase user (to test conflict handling)...');
    const existingFirebaseUser = await admin.auth().createUser({
      email: testEmail,
      password: 'OldPassword123!',
      displayName: 'Old User',
      emailVerified: true
    });
    console.log('✅ Created existing Firebase user:', existingFirebaseUser.uid);
    
    // Step 3: Test the manager creation API endpoint
    console.log('\n🎯 Step 3: Testing manager creation API...');
    
    // First, we need to create an admin user and get their token
    // For testing, we'll create a temporary admin
    const adminUser = await admin.auth().createUser({
      email: 'test-admin@example.com',
      password: 'AdminPassword123!',
      displayName: 'Test Admin',
      emailVerified: true
    });
    
    // Set admin custom claims
    await admin.auth().setCustomUserClaims(adminUser.uid, {
      role: 'admin'
    });
    
    // Create admin MongoDB record
    const adminMongo = new User({
      firebaseUid: adminUser.uid,
      name: 'Test Admin',
      email: 'test-admin@example.com',
      role: 'admin',
      authMethod: 'email',
      isEmailVerified: true,
      isActive: true
    });
    await adminMongo.save();
    
    // Get admin token
    const adminToken = await admin.auth().createCustomToken(adminUser.uid);
    console.log('✅ Created test admin user');
    
    // Make API call to create manager
    try {
      const response = await axios.post('http://localhost:5000/api/auth/create-manager', {
        managerName: testName,
        managerEmail: testEmail,
        clubName: testClub,
        clubId: 6 // Chelsea ID
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        }
      });
      
      console.log('✅ Manager creation API call successful');
      console.log('Response:', response.data);
      
    } catch (apiError) {
      console.error('❌ Manager creation API call failed:', apiError.response?.data || apiError.message);
    }
    
    // Step 4: Verify the results
    console.log('\n🔍 Step 4: Verifying results...');
    
    // Check MongoDB
    const finalMongo = await User.findOne({ email: testEmail });
    if (finalMongo) {
      console.log('📊 MongoDB Record:');
      console.log('  Name:', finalMongo.name);
      console.log('  Email:', finalMongo.email);
      console.log('  Club:', finalMongo.club);
      console.log('  Firebase UID:', finalMongo.firebaseUid);
      console.log('  Role:', finalMongo.role);
    } else {
      console.log('❌ No MongoDB record found');
    }
    
    // Check Firebase
    try {
      const finalFirebase = await admin.auth().getUserByEmail(testEmail);
      console.log('🔥 Firebase User:');
      console.log('  UID:', finalFirebase.uid);
      console.log('  Email:', finalFirebase.email);
      console.log('  Display Name:', finalFirebase.displayName);
      console.log('  Custom Claims:', finalFirebase.customClaims);
      
      // Check if UIDs match
      if (finalMongo && finalMongo.firebaseUid === finalFirebase.uid) {
        console.log('✅ Firebase UID matches MongoDB record');
      } else {
        console.log('❌ Firebase UID mismatch with MongoDB record');
      }
      
    } catch (error) {
      console.log('❌ No Firebase user found');
    }
    
    // Step 5: Cleanup test data
    console.log('\n🧹 Step 5: Cleaning up test data...');
    
    // Delete test manager
    await User.deleteOne({ email: testEmail });
    try {
      const testManager = await admin.auth().getUserByEmail(testEmail);
      await admin.auth().deleteUser(testManager.uid);
    } catch (e) {}
    
    // Delete test admin
    await User.deleteOne({ email: 'test-admin@example.com' });
    await admin.auth().deleteUser(adminUser.uid);
    
    console.log('✅ Test cleanup complete');
    console.log('\n🎉 Manager creation workflow test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
  } finally {
    await mongoose.disconnect();
    process.exit();
  }
}

testAdminManagerCreation();
