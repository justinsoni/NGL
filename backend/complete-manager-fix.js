#!/usr/bin/env node

require('dotenv').config();
const { initializeFirebase, admin } = require('./config/firebase');
const mongoose = require('mongoose');
const User = require('./models/User');

async function completeManagerFix() {
  try {
    console.log('🔧 Complete manager account fix...');
    
    initializeFirebase();
    await mongoose.connect(process.env.MONGODB_URI);
    
    const managerEmail = 'justinsoni2026@mca.ajce.in';
    const newPassword = 'Manager123!';
    
    // Step 1: Find manager in MongoDB
    const manager = await User.findOne({email: managerEmail});
    if (!manager) {
      console.log('❌ Manager not found');
      return;
    }
    
    console.log('📋 Manager found in MongoDB');
    console.log('  Current Firebase UID:', manager.firebaseUid);
    
    // Step 2: Delete any existing Firebase user with this email
    try {
      const existingUser = await admin.auth().getUserByEmail(managerEmail);
      console.log('🗑️ Deleting existing Firebase user:', existingUser.uid);
      await admin.auth().deleteUser(existingUser.uid);
      console.log('✅ Existing Firebase user deleted');
    } catch (e) {
      console.log('ℹ️ No existing Firebase user to delete');
    }
    
    // Step 3: Create new Firebase user
    console.log('🔥 Creating new Firebase user...');
    const newFirebaseUser = await admin.auth().createUser({
      email: managerEmail,
      password: newPassword,
      displayName: manager.name,
      emailVerified: true
    });
    
    console.log('✅ New Firebase user created:', newFirebaseUser.uid);
    
    // Step 4: Update MongoDB record
    console.log('💾 Updating MongoDB record...');
    manager.firebaseUid = newFirebaseUser.uid;
    await manager.save();
    console.log('✅ MongoDB record updated');
    
    // Step 5: Set custom claims
    console.log('🏷️ Setting custom claims...');
    await admin.auth().setCustomUserClaims(newFirebaseUser.uid, {
      role: 'clubManager',
      club: manager.club,
      dbUserId: manager._id.toString()
    });
    console.log('✅ Custom claims set');
    
    // Step 6: Verify everything
    const verifyUser = await admin.auth().getUser(newFirebaseUser.uid);
    console.log('🔍 Verification:');
    console.log('  Email:', verifyUser.email);
    console.log('  Email verified:', verifyUser.emailVerified);
    console.log('  Disabled:', verifyUser.disabled);
    console.log('  Custom claims:', verifyUser.customClaims);
    
    console.log('\n🎉 Manager account completely fixed!');
    console.log('\n📧 Manager login credentials:');
    console.log('  Email:', managerEmail);
    console.log('  Password:', newPassword);
    console.log('\n🌐 Login URL: http://localhost:3000/login');
    console.log('\n✅ The manager should now be able to login successfully!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await mongoose.disconnect();
    process.exit();
  }
}

completeManagerFix();
