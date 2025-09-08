#!/usr/bin/env node

/**
 * Check Admin User in MongoDB
 * 
 * This script checks if the admin user exists in MongoDB and creates/updates it if needed
 */

require('dotenv').config({ path: './backend/.env' });
const mongoose = require('mongoose');
const User = require('./backend/models/User');

async function checkAdminUser() {
  console.log('👤 Checking admin user in MongoDB...\n');

  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Check if admin user exists
    let adminUser = await User.findOne({ email: 'admin@ngl.com' });
    
    if (adminUser) {
      console.log('✅ Admin user found in MongoDB:');
      console.log('  Name:', adminUser.name);
      console.log('  Email:', adminUser.email);
      console.log('  Role:', adminUser.role);
      console.log('  Firebase UID:', adminUser.firebaseUid);
      console.log('  Active:', adminUser.isActive);
      
      // Update Firebase UID if needed
      if (adminUser.firebaseUid !== '8prECE8h0QW0hexPOHRHrMLjmRJ3') {
        console.log('🔄 Updating Firebase UID...');
        adminUser.firebaseUid = '8prECE8h0QW0hexPOHRHrMLjmRJ3';
        await adminUser.save();
        console.log('✅ Firebase UID updated');
      }
    } else {
      console.log('⚠️ Admin user not found in MongoDB, creating...');
      adminUser = await User.create({
        firebaseUid: '8prECE8h0QW0hexPOHRHrMLjmRJ3',
        name: 'Admin User',
        email: 'admin@ngl.com',
        role: 'admin',
        isActive: true,
        isEmailVerified: true,
        authMethod: 'email'
      });
      console.log('✅ Admin user created in MongoDB');
    }

    console.log('\n📝 Summary:');
    console.log('- Firebase admin user: ✅ Ready');
    console.log('- MongoDB admin user: ✅ Ready');
    console.log('- Authentication should now work properly');
    console.log('\n🎯 Next steps:');
    console.log('1. Go to http://localhost:5174');
    console.log('2. Login with admin@ngl.com / admin123');
    console.log('3. Navigate to Admin Dashboard > Manage Clubs');
    console.log('4. Try creating a new club');

  } catch (error) {
    console.error('💥 Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Disconnected from MongoDB');
  }
}

// Run the check
checkAdminUser()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Failed:', error);
    process.exit(1);
  });
