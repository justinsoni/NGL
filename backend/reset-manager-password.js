#!/usr/bin/env node

/**
 * Reset Manager Password
 * 
 * This script allows you to set a specific password for the manager
 * so they can login with the credentials that were sent via email.
 */

require('dotenv').config();
const { initializeFirebase, admin } = require('./config/firebase');
const mongoose = require('mongoose');
const User = require('./models/User');

async function resetManagerPassword() {
  try {
    console.log('🔧 Resetting manager password...');
    
    // Initialize Firebase
    initializeFirebase();
    console.log('✅ Firebase initialized');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    // Find the manager
    const manager = await User.findOne({email: 'justinsoni2026@mca.ajce.in'});
    if (!manager) {
      console.log('❌ Manager not found in database');
      return;
    }
    
    console.log('📋 Manager found:');
    console.log('  Name:', manager.name);
    console.log('  Email:', manager.email);
    console.log('  Firebase UID:', manager.firebaseUid);
    console.log('  Club:', manager.club);
    
    // Check if user exists in Firebase
    try {
      const firebaseUser = await admin.auth().getUser(manager.firebaseUid);
      console.log('✅ Firebase user found');
      console.log('  Email verified:', firebaseUser.emailVerified);
      console.log('  Disabled:', firebaseUser.disabled);
      
      // Set a known password that you can share with the manager
      const newPassword = 'Manager123!';
      
      console.log('🔐 Setting new password...');
      await admin.auth().updateUser(manager.firebaseUid, {
        password: newPassword,
        emailVerified: true,
        disabled: false
      });
      
      console.log('✅ Password updated successfully');
      
      // Verify custom claims
      const userRecord = await admin.auth().getUser(manager.firebaseUid);
      console.log('🏷️ Custom claims:', userRecord.customClaims);
      
      if (!userRecord.customClaims || !userRecord.customClaims.role) {
        console.log('🏷️ Setting custom claims...');
        await admin.auth().setCustomUserClaims(manager.firebaseUid, {
          role: 'clubManager',
          club: manager.club,
          dbUserId: manager._id.toString()
        });
        console.log('✅ Custom claims set');
      }
      
      console.log('\n🎉 Manager password reset successfully!');
      console.log('\n📧 Manager can now login with:');
      console.log('  Email:', manager.email);
      console.log('  Password:', newPassword);
      console.log('\n🌐 Login URL: http://localhost:3000/login');
      console.log('\n⚠️ Please share these credentials with the manager securely.');
      
    } catch (firebaseError) {
      console.error('❌ Firebase user error:', firebaseError.message);
      
      if (firebaseError.code === 'auth/user-not-found') {
        console.log('\n🔄 Firebase user not found. Creating new user...');
        
        const newPassword = 'Manager123!';
        const firebaseUser = await admin.auth().createUser({
          uid: manager.firebaseUid,
          email: manager.email,
          password: newPassword,
          displayName: manager.name,
          emailVerified: true
        });
        
        console.log('✅ Firebase user created');
        
        // Set custom claims
        await admin.auth().setCustomUserClaims(firebaseUser.uid, {
          role: 'clubManager',
          club: manager.club,
          dbUserId: manager._id.toString()
        });
        
        console.log('✅ Custom claims set');
        console.log('\n📧 Manager can now login with:');
        console.log('  Email:', manager.email);
        console.log('  Password:', newPassword);
      }
    }
    
  } catch (error) {
    console.error('❌ Error resetting manager password:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
    process.exit();
  }
}

// Run the reset
resetManagerPassword().catch(console.error);
