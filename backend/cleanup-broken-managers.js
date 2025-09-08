#!/usr/bin/env node

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

async function cleanupBrokenManagers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    // Delete managers with placeholder UIDs
    const brokenManagers = await User.find({ 
      role: 'clubManager',
      firebaseUid: { $regex: /^manager_/ }
    });
    
    console.log('🧹 Deleting broken manager records:');
    for (const manager of brokenManagers) {
      console.log('  -', manager.name, '(' + manager.club + ')');
      await User.deleteOne({ _id: manager._id });
    }
    
    console.log('✅ Cleanup complete');
    
    // Show remaining managers
    const remainingManagers = await User.find({ role: 'clubManager' });
    console.log('\n📊 Remaining managers:');
    remainingManagers.forEach(m => console.log('  -', m.name, '(' + m.club + ')'));
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error.message);
    await mongoose.disconnect();
  }
}

cleanupBrokenManagers();
