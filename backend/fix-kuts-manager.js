#!/usr/bin/env node

require('dotenv').config();
const { initializeFirebase, admin } = require('./config/firebase');
const mongoose = require('mongoose');
const User = require('./models/User');

async function fixKutsManager() {
  try {
    console.log('🔧 Fixing Kuts manager account...');
    
    initializeFirebase();
    await mongoose.connect(process.env.MONGODB_URI);
    
    const managerEmail = 'kuttusankuttapan2002@gmail.com';
    const newPassword = 'Manager123!';
    
    // Step 1: Find manager in MongoDB
    const manager = await User.findOne({ email: managerEmail });
    if (!manager) {
      console.log('❌ Manager not found in MongoDB');
      return;
    }
    
    console.log('📋 Manager found in MongoDB:');
    console.log('  Name:', manager.name);
    console.log('  Email:', manager.email);
    console.log('  Club:', manager.club);
    console.log('  Current Firebase UID:', manager.firebaseUid);
    
    // Step 2: Get the real Firebase user
    let firebaseUser;
    try {
      firebaseUser = await admin.auth().getUserByEmail(managerEmail);
      console.log('🔥 Found Firebase user:');
      console.log('  UID:', firebaseUser.uid);
      console.log('  Email Verified:', firebaseUser.emailVerified);
      console.log('  Disabled:', firebaseUser.disabled);
      console.log('  Current Claims:', firebaseUser.customClaims);
    } catch (error) {
      console.log('❌ Firebase user not found:', error.message);
      return;
    }
    
    // Step 3: Update MongoDB record with correct Firebase UID
    console.log('💾 Updating MongoDB record...');
    manager.firebaseUid = firebaseUser.uid;
    await manager.save();
    console.log('✅ MongoDB record updated with correct Firebase UID');
    
    // Step 4: Update Firebase password
    console.log('🔑 Updating Firebase password...');
    await admin.auth().updateUser(firebaseUser.uid, {
      password: newPassword,
      emailVerified: true,
      disabled: false
    });
    console.log('✅ Firebase password updated');
    
    // Step 5: Set correct custom claims
    console.log('🏷️ Setting correct custom claims...');
    await admin.auth().setCustomUserClaims(firebaseUser.uid, {
      role: 'clubManager',
      club: manager.club, // Use club from MongoDB (Arsenal)
      dbUserId: manager._id.toString()
    });
    console.log('✅ Custom claims updated');
    
    // Step 6: Verify everything
    const verifyUser = await admin.auth().getUser(firebaseUser.uid);
    const verifyMongo = await User.findOne({ email: managerEmail });
    
    console.log('\n🔍 Final Verification:');
    console.log('📊 MongoDB Record:');
    console.log('  Name:', verifyMongo.name);
    console.log('  Email:', verifyMongo.email);
    console.log('  Club:', verifyMongo.club);
    console.log('  Firebase UID:', verifyMongo.firebaseUid);
    console.log('  Role:', verifyMongo.role);
    console.log('  Active:', verifyMongo.isActive);
    
    console.log('\n🔥 Firebase User:');
    console.log('  UID:', verifyUser.uid);
    console.log('  Email:', verifyUser.email);
    console.log('  Email Verified:', verifyUser.emailVerified);
    console.log('  Disabled:', verifyUser.disabled);
    console.log('  Custom Claims:', verifyUser.customClaims);
    
    console.log('\n🎉 Manager account completely fixed!');
    console.log('\n📧 Login credentials:');
    console.log('  Email:', managerEmail);
    console.log('  Password:', newPassword);
    console.log('  Club:', manager.club);
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

fixKutsManager();
