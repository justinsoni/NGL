#!/usr/bin/env node

/**
 * Fix Manager Firebase Account
 * 
 * This script fixes the manager account by creating a real Firebase user
 * and updating the MongoDB record with the correct Firebase UID.
 */

require('dotenv').config();
const { initializeFirebase, admin } = require('./config/firebase');
const mongoose = require('mongoose');
const User = require('./models/User');

// Initialize Firebase
initializeFirebase();

async function fixManagerAccount() {
  try {
    console.log('🔧 Fixing manager Firebase account...');
    
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
    console.log('  Current Firebase UID:', manager.firebaseUid);
    console.log('  Club:', manager.club);
    
    // Check if Firebase UID is a placeholder
    if (!manager.firebaseUid.startsWith('manager_')) {
      console.log('✅ Manager already has a real Firebase UID');
      return;
    }
    
    // Generate a new password (or use a temporary one)
    const newPassword = 'TempManager123!';
    console.log('🔐 Using temporary password:', newPassword);
    
    try {
      // Try to delete existing Firebase user if it exists
      try {
        await admin.auth().getUserByEmail(manager.email);
        console.log('🗑️ Deleting existing Firebase user...');
        const existingUser = await admin.auth().getUserByEmail(manager.email);
        await admin.auth().deleteUser(existingUser.uid);
        console.log('✅ Existing Firebase user deleted');
      } catch (e) {
        // User doesn't exist, which is fine
        console.log('ℹ️ No existing Firebase user found');
      }
      
      // Create new Firebase user
      console.log('🔥 Creating new Firebase user...');
      const firebaseUser = await admin.auth().createUser({
        email: manager.email,
        password: newPassword,
        displayName: manager.name,
        emailVerified: true
      });
      
      console.log('✅ Firebase user created successfully');
      console.log('  Firebase UID:', firebaseUser.uid);
      
      // Update MongoDB record
      console.log('💾 Updating MongoDB record...');
      manager.firebaseUid = firebaseUser.uid;
      await manager.save();
      console.log('✅ MongoDB record updated');
      
      // Set custom claims
      console.log('🏷️ Setting custom claims...');
      await admin.auth().setCustomUserClaims(firebaseUser.uid, {
        role: 'clubManager',
        club: manager.club,
        dbUserId: manager._id.toString()
      });
      console.log('✅ Custom claims set');
      
      console.log('\n🎉 Manager account fixed successfully!');
      console.log('\n📧 Please inform the manager of the new login credentials:');
      console.log('  Email:', manager.email);
      console.log('  Password:', newPassword);
      console.log('\n⚠️ The manager should change this password after first login.');
      
    } catch (firebaseError) {
      console.error('❌ Firebase error:', firebaseError.message);
      
      if (firebaseError.code === 'auth/email-already-exists') {
        console.log('\n🔄 Email already exists in Firebase. Trying to get existing user...');
        const existingUser = await admin.auth().getUserByEmail(manager.email);
        
        // Update the password for existing user
        await admin.auth().updateUser(existingUser.uid, {
          password: newPassword,
          displayName: manager.name,
          emailVerified: true
        });
        
        // Update MongoDB record
        manager.firebaseUid = existingUser.uid;
        await manager.save();
        
        // Set custom claims
        await admin.auth().setCustomUserClaims(existingUser.uid, {
          role: 'clubManager',
          club: manager.club,
          dbUserId: manager._id.toString()
        });
        
        console.log('✅ Updated existing Firebase user');
        console.log('\n📧 Manager can now login with:');
        console.log('  Email:', manager.email);
        console.log('  Password:', newPassword);
      }
    }
    
  } catch (error) {
    console.error('❌ Error fixing manager account:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
    process.exit();
  }
}

// Run the fix
fixManagerAccount().catch(console.error);
