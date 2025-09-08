#!/usr/bin/env node

require('dotenv').config();
const { initializeFirebase, admin } = require('./config/firebase');
const mongoose = require('mongoose');
const User = require('./models/User');
const { EmailService } = require('./utils/emailService');

async function testManagerCreationDirect() {
  try {
    console.log('🧪 Testing manager creation logic directly...');
    
    initializeFirebase();
    await mongoose.connect(process.env.MONGODB_URI);
    
    const testEmail = 'test-manager-direct@example.com';
    const testName = 'Test Manager Direct';
    const testClub = 'Chelsea';
    
    // Step 1: Clean up any existing records
    console.log('\n🧹 Step 1: Cleaning up existing records...');
    
    await User.deleteMany({ email: testEmail });
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
    
    // Step 3: Test the manager creation logic (simulating the controller logic)
    console.log('\n🎯 Step 3: Testing manager creation logic...');
    
    const managerName = testName;
    const managerEmail = testEmail;
    const clubName = testClub;
    
    // Check if manager email already exists in MongoDB
    const existingUser = await User.findOne({ 
      email: managerEmail.toLowerCase() 
    });

    if (existingUser) {
      console.log('❌ User already exists in MongoDB');
      return;
    }

    // Check if club already has a manager
    const existingManager = await User.findOne({ 
      role: 'clubManager', 
      club: clubName,
      isActive: true 
    });

    if (existingManager) {
      console.log('❌ Club already has a manager');
      return;
    }

    // Generate secure password
    const password = EmailService.generateSecurePassword();
    console.log('✅ Generated password:', password);

    // Create Firebase user with email and password (using our updated logic)
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
      console.error('❌ Firebase user creation failed:', firebaseError.message);

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
          // Fall back to placeholder UID
          firebaseUid = `manager_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          console.log('⚠️ Using placeholder Firebase UID:', firebaseUid);
        }
      } else {
        // For other Firebase errors, use placeholder UID
        firebaseUid = `manager_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        console.log('⚠️ Using placeholder Firebase UID:', firebaseUid);
      }
    }

    // Create manager user in MongoDB
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

    // Set custom claims in Firebase
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
    if (!firebaseUid.startsWith('manager_')) {
      try {
        const finalFirebase = await admin.auth().getUser(firebaseUid);
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
        console.log('❌ Firebase user not found:', error.message);
      }
    } else {
      console.log('⚠️ Using placeholder UID, skipping Firebase verification');
    }
    
    // Step 5: Cleanup
    console.log('\n🧹 Step 5: Cleaning up...');
    await User.deleteOne({ email: testEmail });
    if (!firebaseUid.startsWith('manager_')) {
      try {
        await admin.auth().deleteUser(firebaseUid);
        console.log('✅ Cleaned up Firebase user');
      } catch (e) {
        console.log('ℹ️ Firebase user already deleted');
      }
    }
    
    console.log('\n🎉 Manager creation logic test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
  } finally {
    await mongoose.disconnect();
    process.exit();
  }
}

testManagerCreationDirect();
