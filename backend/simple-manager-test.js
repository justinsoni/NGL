#!/usr/bin/env node

require('dotenv').config();
const { initializeFirebase, admin } = require('./config/firebase');
const mongoose = require('mongoose');
const User = require('./models/User');
const { EmailService } = require('./utils/emailService');

async function simpleManagerTest() {
  try {
    console.log('🧪 Simple manager creation test...');
    
    initializeFirebase();
    await mongoose.connect(process.env.MONGODB_URI);
    
    const testEmail = 'simple-test@example.com';
    const testName = 'Simple Test Manager';
    const testClub = 'Manchester City';
    
    console.log('\n🔍 Step 1: Checking existing records...');
    
    // Check MongoDB
    const existingMongo = await User.findOne({ email: testEmail });
    console.log('MongoDB user exists:', existingMongo ? 'YES' : 'NO');
    
    // Check Firebase
    let existingFirebase = null;
    try {
      existingFirebase = await admin.auth().getUserByEmail(testEmail);
      console.log('Firebase user exists:', 'YES');
    } catch (e) {
      console.log('Firebase user exists:', 'NO');
    }
    
    // Check club manager
    const existingManager = await User.findOne({ 
      role: 'clubManager', 
      club: testClub,
      isActive: true 
    });
    console.log('Club manager exists for', testClub + ':', existingManager ? 'YES (' + existingManager.name + ')' : 'NO');
    
    console.log('\n🧹 Step 2: Cleanup...');
    if (existingMongo) {
      await User.deleteOne({ email: testEmail });
      console.log('Deleted MongoDB record');
    }
    if (existingFirebase) {
      await admin.auth().deleteUser(existingFirebase.uid);
      console.log('Deleted Firebase user');
    }
    
    console.log('\n🔥 Step 3: Create Firebase user with conflict...');
    const conflictUser = await admin.auth().createUser({
      email: testEmail,
      password: 'ConflictPassword123!',
      displayName: 'Conflict User',
      emailVerified: true
    });
    console.log('Created conflict Firebase user:', conflictUser.uid);
    
    console.log('\n🎯 Step 4: Test manager creation with conflict handling...');
    
    // Simulate the manager creation logic
    const managerEmail = testEmail;
    const managerName = testName;
    const clubName = testClub;
    
    // Generate password
    const password = EmailService.generateSecurePassword();
    console.log('Generated password:', password);
    
    // Try to create Firebase user (should conflict)
    let firebaseUid;
    try {
      const firebaseUser = await admin.auth().createUser({
        email: managerEmail.toLowerCase(),
        password: password,
        displayName: managerName,
        emailVerified: true
      });
      firebaseUid = firebaseUser.uid;
      console.log('✅ Firebase user created successfully:', firebaseUid);
    } catch (firebaseError) {
      console.log('❌ Firebase user creation failed:', firebaseError.code);

      // Handle the case where email already exists in Firebase
      if (firebaseError.code === 'auth/email-already-exists') {
        console.log('🔄 Email already exists in Firebase. Deleting existing user and creating new one...');
        
        try {
          // Get the existing Firebase user
          const existingUser = await admin.auth().getUserByEmail(managerEmail.toLowerCase());
          console.log('🗑️ Deleting existing Firebase user:', existingUser.uid);
          
          // Delete the existing Firebase user
          await admin.auth().deleteUser(existingUser.uid);
          console.log('✅ Existing Firebase user deleted');
          
          // Create new Firebase user
          const newFirebaseUser = await admin.auth().createUser({
            email: managerEmail.toLowerCase(),
            password: password,
            displayName: managerName,
            emailVerified: true
          });
          firebaseUid = newFirebaseUser.uid;
          console.log('✅ New Firebase user created successfully:', firebaseUid);
          
        } catch (cleanupError) {
          console.error('❌ Firebase cleanup failed:', cleanupError.message);
          firebaseUid = `manager_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          console.log('⚠️ Using placeholder Firebase UID:', firebaseUid);
        }
      } else {
        firebaseUid = `manager_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        console.log('⚠️ Using placeholder Firebase UID:', firebaseUid);
      }
    }
    
    console.log('\n📊 Step 5: Create MongoDB record...');
    const managerData = {
      firebaseUid,
      name: managerName,
      email: managerEmail.toLowerCase(),
      role: 'clubManager',
      club: clubName,
      authMethod: 'email',
      isEmailVerified: true,
      isActive: true,
      profile: {
        position: 'Manager'
      }
    };

    const manager = new User(managerData);
    await manager.save();
    console.log('✅ MongoDB record created');

    // Set custom claims
    if (!firebaseUid.startsWith('manager_')) {
      try {
        await admin.auth().setCustomUserClaims(firebaseUid, {
          role: 'clubManager',
          club: clubName,
          dbUserId: manager._id.toString()
        });
        console.log('✅ Custom claims set');
      } catch (claimsError) {
        console.error('❌ Failed to set custom claims:', claimsError.message);
      }
    }
    
    console.log('\n🔍 Step 6: Verify results...');
    const finalMongo = await User.findOne({ email: testEmail });
    console.log('Final MongoDB record:', finalMongo ? 'EXISTS' : 'NOT FOUND');
    
    if (!firebaseUid.startsWith('manager_')) {
      try {
        const finalFirebase = await admin.auth().getUser(firebaseUid);
        console.log('Final Firebase user:', 'EXISTS');
        console.log('UIDs match:', finalMongo.firebaseUid === finalFirebase.uid ? 'YES' : 'NO');
      } catch (e) {
        console.log('Final Firebase user:', 'NOT FOUND');
      }
    }
    
    console.log('\n🧹 Step 7: Cleanup...');
    await User.deleteOne({ email: testEmail });
    if (!firebaseUid.startsWith('manager_')) {
      try {
        await admin.auth().deleteUser(firebaseUid);
      } catch (e) {}
    }
    
    console.log('\n🎉 Test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
  } finally {
    await mongoose.disconnect();
    process.exit();
  }
}

simpleManagerTest();
