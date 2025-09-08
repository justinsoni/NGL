#!/usr/bin/env node

require('dotenv').config();
const { initializeFirebase, admin } = require('./config/firebase');
const mongoose = require('mongoose');
const User = require('./models/User');

async function cleanupAndFixManagers() {
  try {
    console.log('🧹 Cleaning up and fixing manager accounts...');
    
    initializeFirebase();
    await mongoose.connect(process.env.MONGODB_URI);
    
    const targetEmail = 'kuttusankuttapan2002@gmail.com';
    
    // Step 1: Clean up all MongoDB records for this email
    console.log('\n📊 Step 1: Cleaning up MongoDB records...');
    const existingRecords = await User.find({ email: targetEmail });
    console.log(`Found ${existingRecords.length} MongoDB record(s) for ${targetEmail}`);
    
    for (const record of existingRecords) {
      console.log(`  - Deleting record: ${record.name} (${record.club}) - UID: ${record.firebaseUid}`);
      await User.deleteOne({ _id: record._id });
    }
    console.log('✅ MongoDB cleanup complete');
    
    // Step 2: Check Firebase user status
    console.log('\n🔥 Step 2: Checking Firebase user...');
    let firebaseUser;
    try {
      firebaseUser = await admin.auth().getUserByEmail(targetEmail);
      console.log('Found Firebase user:');
      console.log('  UID:', firebaseUser.uid);
      console.log('  Email Verified:', firebaseUser.emailVerified);
      console.log('  Disabled:', firebaseUser.disabled);
      console.log('  Custom Claims:', firebaseUser.customClaims);
    } catch (error) {
      console.log('No Firebase user found for this email');
      firebaseUser = null;
    }
    
    // Step 3: Clean up Firebase user if it exists
    if (firebaseUser) {
      console.log('\n🗑️ Step 3: Cleaning up Firebase user...');
      await admin.auth().deleteUser(firebaseUser.uid);
      console.log('✅ Firebase user deleted');
    }
    
    // Step 4: Create fresh manager account
    console.log('\n🆕 Step 4: Creating fresh manager account...');
    const managerData = {
      name: 'kuts',
      email: targetEmail,
      club: 'Arsenal', // Set to Arsenal as intended
      password: 'Manager123!'
    };
    
    // Create Firebase user
    const newFirebaseUser = await admin.auth().createUser({
      email: managerData.email,
      password: managerData.password,
      displayName: managerData.name,
      emailVerified: true,
      disabled: false
    });
    
    console.log('✅ Firebase user created:', newFirebaseUser.uid);
    
    // Create MongoDB record
    const newManager = new User({
      firebaseUid: newFirebaseUser.uid,
      name: managerData.name,
      email: managerData.email,
      role: 'clubManager',
      club: managerData.club,
      authMethod: 'email',
      isEmailVerified: true,
      isActive: true,
      profile: {
        position: 'Manager'
      }
    });
    
    await newManager.save();
    console.log('✅ MongoDB record created');
    
    // Set custom claims
    await admin.auth().setCustomUserClaims(newFirebaseUser.uid, {
      role: 'clubManager',
      club: managerData.club,
      dbUserId: newManager._id.toString()
    });
    console.log('✅ Custom claims set');
    
    // Step 5: Verify everything
    console.log('\n🔍 Step 5: Final verification...');
    const verifyFirebase = await admin.auth().getUser(newFirebaseUser.uid);
    const verifyMongo = await User.findOne({ email: targetEmail });
    
    console.log('📊 MongoDB Record:');
    console.log('  ID:', verifyMongo._id);
    console.log('  Name:', verifyMongo.name);
    console.log('  Email:', verifyMongo.email);
    console.log('  Club:', verifyMongo.club);
    console.log('  Firebase UID:', verifyMongo.firebaseUid);
    console.log('  Role:', verifyMongo.role);
    console.log('  Active:', verifyMongo.isActive);
    
    console.log('\n🔥 Firebase User:');
    console.log('  UID:', verifyFirebase.uid);
    console.log('  Email:', verifyFirebase.email);
    console.log('  Email Verified:', verifyFirebase.emailVerified);
    console.log('  Disabled:', verifyFirebase.disabled);
    console.log('  Custom Claims:', verifyFirebase.customClaims);
    
    console.log('\n🎉 Manager account completely reset and fixed!');
    console.log('\n📧 Login credentials:');
    console.log('  Email:', managerData.email);
    console.log('  Password:', managerData.password);
    console.log('  Club:', managerData.club);
    console.log('\n🌐 Login URL: http://localhost:5173/#/login');
    console.log('\n✅ You should now be able to login successfully!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await mongoose.disconnect();
    process.exit();
  }
}

cleanupAndFixManagers();
