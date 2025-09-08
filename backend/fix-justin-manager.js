#!/usr/bin/env node

require('dotenv').config();
const { initializeFirebase, admin } = require('./config/firebase');
const mongoose = require('mongoose');
const User = require('./models/User');

async function fixJustinManager() {
  try {
    console.log('🔧 Fixing Justin manager account...');
    
    initializeFirebase();
    await mongoose.connect(process.env.MONGODB_URI);
    
    const justinEmail = 'justinsony2002@gmail.com';
    const newPassword = 'Manager123!';
    
    // Step 1: Get current records
    console.log('\n📊 Step 1: Getting current records...');
    const mongoUser = await User.findOne({ email: justinEmail, role: 'clubManager' });
    if (!mongoUser) {
      console.log('❌ Manager not found in MongoDB');
      return;
    }
    
    console.log('Found MongoDB manager:', mongoUser.name, '(' + mongoUser.club + ')');
    
    let firebaseUser;
    try {
      firebaseUser = await admin.auth().getUserByEmail(justinEmail);
      console.log('Found Firebase user:', firebaseUser.uid);
    } catch (error) {
      console.log('❌ Firebase user not found');
      return;
    }
    
    // Step 2: Update MongoDB record with correct Firebase UID
    console.log('\n💾 Step 2: Updating MongoDB record...');
    mongoUser.firebaseUid = firebaseUser.uid;
    await mongoUser.save();
    console.log('✅ MongoDB record updated with correct Firebase UID');
    
    // Step 3: Update Firebase user
    console.log('\n🔥 Step 3: Updating Firebase user...');
    
    // Reset password and ensure account is properly configured
    await admin.auth().updateUser(firebaseUser.uid, {
      password: newPassword,
      emailVerified: true,
      disabled: false,
      displayName: mongoUser.name
    });
    console.log('✅ Firebase user updated');
    
    // Step 4: Set correct custom claims
    console.log('\n🏷️ Step 4: Setting correct custom claims...');
    await admin.auth().setCustomUserClaims(firebaseUser.uid, {
      role: 'clubManager',
      club: mongoUser.club,
      dbUserId: mongoUser._id.toString()
    });
    console.log('✅ Custom claims updated');
    
    // Step 5: Clean up any old registeredUser record
    console.log('\n🧹 Step 5: Cleaning up old records...');
    const oldUserRecord = await User.findOne({ 
      email: justinEmail, 
      role: { $ne: 'clubManager' } 
    });
    
    if (oldUserRecord) {
      console.log('Found old user record:', oldUserRecord.role);
      await User.deleteOne({ _id: oldUserRecord._id });
      console.log('✅ Deleted old user record');
    }
    
    // Step 6: Verify everything
    console.log('\n🔍 Step 6: Final verification...');
    const verifyMongo = await User.findOne({ email: justinEmail, role: 'clubManager' });
    const verifyFirebase = await admin.auth().getUser(firebaseUser.uid);
    
    console.log('📊 MongoDB Record:');
    console.log('  Name:', verifyMongo.name);
    console.log('  Email:', verifyMongo.email);
    console.log('  Club:', verifyMongo.club);
    console.log('  Role:', verifyMongo.role);
    console.log('  Firebase UID:', verifyMongo.firebaseUid);
    console.log('  Active:', verifyMongo.isActive);
    
    console.log('\n🔥 Firebase User:');
    console.log('  UID:', verifyFirebase.uid);
    console.log('  Email:', verifyFirebase.email);
    console.log('  Display Name:', verifyFirebase.displayName);
    console.log('  Email Verified:', verifyFirebase.emailVerified);
    console.log('  Disabled:', verifyFirebase.disabled);
    console.log('  Custom Claims:', verifyFirebase.customClaims);
    
    // Verify UIDs match
    if (verifyMongo.firebaseUid === verifyFirebase.uid) {
      console.log('\n✅ SUCCESS: Firebase UID matches MongoDB record');
    } else {
      console.log('\n❌ ERROR: Firebase UID still mismatched');
    }
    
    // Verify custom claims
    const claims = verifyFirebase.customClaims || {};
    const claimsValid = (
      claims.role === verifyMongo.role &&
      claims.club === verifyMongo.club &&
      claims.dbUserId === verifyMongo._id.toString()
    );
    
    if (claimsValid) {
      console.log('✅ SUCCESS: Custom claims are correct');
    } else {
      console.log('❌ ERROR: Custom claims are incorrect');
    }
    
    console.log('\n🎉 Justin manager account fixed!');
    console.log('\n📧 Login credentials:');
    console.log('  Email:', justinEmail);
    console.log('  Password:', newPassword);
    console.log('  Club:', mongoUser.club);
    console.log('\n🌐 Login URL: http://localhost:5173/#/login');
    console.log('\n✅ Justin should now be able to login successfully!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await mongoose.disconnect();
    process.exit();
  }
}

fixJustinManager();
