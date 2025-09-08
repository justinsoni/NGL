#!/usr/bin/env node

require('dotenv').config();
const { initializeFirebase, admin } = require('./config/firebase');
const mongoose = require('mongoose');
const User = require('./models/User');

async function checkJustinManager() {
  try {
    console.log('🔍 Checking Justin manager account...');
    
    initializeFirebase();
    await mongoose.connect(process.env.MONGODB_URI);
    
    const justinEmail = 'justinsony2002@gmail.com';
    
    // Check MongoDB record
    console.log('\n📊 MongoDB Record:');
    const mongoUser = await User.findOne({ email: justinEmail });
    if (mongoUser) {
      console.log('  ✅ Found in MongoDB:');
      console.log('    ID:', mongoUser._id);
      console.log('    Name:', mongoUser.name);
      console.log('    Email:', mongoUser.email);
      console.log('    Club:', mongoUser.club);
      console.log('    Role:', mongoUser.role);
      console.log('    Firebase UID:', mongoUser.firebaseUid);
      console.log('    Active:', mongoUser.isActive);
      console.log('    Email Verified:', mongoUser.isEmailVerified);
      console.log('    Auth Method:', mongoUser.authMethod);
      console.log('    Created:', mongoUser.createdAt);
    } else {
      console.log('  ❌ NOT found in MongoDB');
    }
    
    // Check Firebase user
    console.log('\n🔥 Firebase User:');
    try {
      const firebaseUser = await admin.auth().getUserByEmail(justinEmail);
      console.log('  ✅ Found in Firebase:');
      console.log('    UID:', firebaseUser.uid);
      console.log('    Email:', firebaseUser.email);
      console.log('    Display Name:', firebaseUser.displayName);
      console.log('    Email Verified:', firebaseUser.emailVerified);
      console.log('    Disabled:', firebaseUser.disabled);
      console.log('    Provider Data:', firebaseUser.providerData.map(p => p.providerId));
      console.log('    Custom Claims:', firebaseUser.customClaims);
      console.log('    Created:', firebaseUser.metadata.creationTime);
      console.log('    Last Sign In:', firebaseUser.metadata.lastSignInTime);
    } catch (firebaseError) {
      console.log('  ❌ NOT found in Firebase:', firebaseError.message);
    }
    
    // Check for UID mismatch
    console.log('\n🔍 Verification:');
    if (mongoUser) {
      try {
        const firebaseUser = await admin.auth().getUserByEmail(justinEmail);
        if (mongoUser.firebaseUid === firebaseUser.uid) {
          console.log('  ✅ Firebase UID matches MongoDB record');
        } else {
          console.log('  ❌ Firebase UID MISMATCH:');
          console.log('    MongoDB UID:', mongoUser.firebaseUid);
          console.log('    Firebase UID:', firebaseUser.uid);
        }
        
        // Check if custom claims match MongoDB data
        const claims = firebaseUser.customClaims || {};
        console.log('  🏷️ Custom Claims Verification:');
        console.log('    Role matches:', claims.role === mongoUser.role ? '✅' : '❌');
        console.log('    Club matches:', claims.club === mongoUser.club ? '✅' : '❌');
        console.log('    DB User ID matches:', claims.dbUserId === mongoUser._id.toString() ? '✅' : '❌');
        
      } catch (e) {
        console.log('  ❌ Cannot verify - Firebase user not found');
      }
    }
    
    // Check if this is a placeholder UID
    if (mongoUser && mongoUser.firebaseUid.startsWith('manager_')) {
      console.log('\n⚠️ ISSUE DETECTED: Using placeholder Firebase UID');
      console.log('  This means Firebase user creation failed during manager creation');
      console.log('  The account needs to be fixed');
    }
    
    // Show all managers for context
    console.log('\n📋 All Managers in System:');
    const allManagers = await User.find({ role: 'clubManager' });
    allManagers.forEach(manager => {
      const status = manager.firebaseUid.startsWith('manager_') ? '❌ BROKEN' : '✅ OK';
      console.log(`  ${status} ${manager.name} (${manager.club}) - UID: ${manager.firebaseUid.substring(0, 20)}...`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await mongoose.disconnect();
    process.exit();
  }
}

checkJustinManager();
