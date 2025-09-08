#!/usr/bin/env node

require('dotenv').config();
const { initializeFirebase, admin } = require('./config/firebase');
const mongoose = require('mongoose');
const User = require('./models/User');

async function checkManagers() {
  try {
    console.log('🔍 Checking manager accounts...');
    
    initializeFirebase();
    await mongoose.connect(process.env.MONGODB_URI);
    
    // Find all managers in MongoDB
    const managers = await User.find({ role: 'clubManager' });
    
    console.log(`\n📊 Found ${managers.length} manager(s) in MongoDB:`);
    
    for (const manager of managers) {
      console.log('\n📋 Manager Details:');
      console.log('  Name:', manager.name);
      console.log('  Email:', manager.email);
      console.log('  Club:', manager.club);
      console.log('  Firebase UID:', manager.firebaseUid);
      console.log('  Active:', manager.isActive);
      console.log('  Created:', manager.createdAt);
      
      // Check if Firebase user exists
      if (manager.firebaseUid) {
        try {
          const firebaseUser = await admin.auth().getUser(manager.firebaseUid);
          console.log('  🔥 Firebase Status: EXISTS');
          console.log('  🔥 Email Verified:', firebaseUser.emailVerified);
          console.log('  🔥 Disabled:', firebaseUser.disabled);
          console.log('  🔥 Custom Claims:', firebaseUser.customClaims);
        } catch (error) {
          console.log('  🔥 Firebase Status: NOT FOUND');
          console.log('  🔥 Error:', error.message);
        }
      } else {
        console.log('  🔥 Firebase Status: NO UID SET');
      }
    }
    
    // Check if the specific email exists
    const targetEmail = 'kuttusankuttapan2002@gmail.com';
    const targetManager = await User.findOne({ email: targetEmail });
    
    console.log(`\n🎯 Checking for ${targetEmail}:`);
    if (targetManager) {
      console.log('  ✅ Found in MongoDB');
      console.log('  Role:', targetManager.role);
      console.log('  Club:', targetManager.club);
      console.log('  Firebase UID:', targetManager.firebaseUid);
    } else {
      console.log('  ❌ NOT found in MongoDB');
    }
    
    // Check Firebase for this email
    try {
      const firebaseUser = await admin.auth().getUserByEmail(targetEmail);
      console.log('  🔥 Found in Firebase');
      console.log('  🔥 UID:', firebaseUser.uid);
      console.log('  🔥 Email Verified:', firebaseUser.emailVerified);
      console.log('  🔥 Disabled:', firebaseUser.disabled);
      console.log('  🔥 Custom Claims:', firebaseUser.customClaims);
    } catch (error) {
      console.log('  🔥 NOT found in Firebase');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await mongoose.disconnect();
    process.exit();
  }
}

checkManagers();
