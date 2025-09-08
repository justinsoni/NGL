#!/usr/bin/env node

/**
 * Seed Clubs to MongoDB
 * 
 * This script seeds initial clubs from the frontend constants into MongoDB
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Club = require('./models/Club');
const User = require('./models/User');

// Initial clubs data (from frontend constants)
const initialClubs = [
  {
    name: 'Manchester City',
    logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/e/eb/Manchester_City_FC_badge.svg/1200px-Manchester_City_FC_badge.svg.png',
    stadium: 'Etihad Stadium',
    stadiumCapacity: 55000,
    founded: 1880,
    city: 'Manchester',
    country: 'England',
    colors: {
      primary: 'Sky Blue',
      secondary: 'White'
    },
    honours: [
      { name: 'League Titles', count: 10 },
      { name: 'Champions League', count: 1 }
    ],
    group: 'A',
    description: 'Manchester City Football Club is an English professional football club based in Manchester.',
    website: 'https://www.mancity.com',
    email: 'info@mancity.com'
  },
  {
    name: 'Arsenal',
    logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/5/53/Arsenal_FC.svg/1200px-Arsenal_FC.svg.png',
    stadium: 'Emirates Stadium',
    stadiumCapacity: 60704,
    founded: 1886,
    city: 'London',
    country: 'England',
    colors: {
      primary: 'Red',
      secondary: 'White'
    },
    honours: [
      { name: 'League Titles', count: 13 },
      { name: 'FA Cup', count: 14 }
    ],
    group: 'A',
    description: 'Arsenal Football Club is a professional football club based in Islington, London, England.',
    website: 'https://www.arsenal.com',
    email: 'info@arsenal.com'
  },
  {
    name: 'Liverpool',
    logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/0/0c/Liverpool_FC.svg/1200px-Liverpool_FC.svg.png',
    stadium: 'Anfield',
    stadiumCapacity: 53394,
    founded: 1892,
    city: 'Liverpool',
    country: 'England',
    colors: {
      primary: 'Red',
      secondary: 'White'
    },
    honours: [
      { name: 'League Titles', count: 19 },
      { name: 'Champions League', count: 6 }
    ],
    group: 'A',
    description: 'Liverpool Football Club is a professional football club based in Liverpool, England.',
    website: 'https://www.liverpoolfc.com',
    email: 'info@liverpoolfc.com'
  },
  {
    name: 'Tottenham Hotspur',
    logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/b/b4/Tottenham_Hotspur.svg/1200px-Tottenham_Hotspur.svg.png',
    stadium: 'Tottenham Hotspur Stadium',
    stadiumCapacity: 62850,
    founded: 1882,
    city: 'London',
    country: 'England',
    colors: {
      primary: 'White',
      secondary: 'Navy Blue'
    },
    honours: [
      { name: 'League Titles', count: 2 },
      { name: 'FA Cup', count: 8 }
    ],
    group: 'A',
    description: 'Tottenham Hotspur Football Club is an English professional football club based in Tottenham, London.',
    website: 'https://www.tottenhamhotspur.com',
    email: 'info@tottenhamhotspur.com'
  },
  {
    name: 'Chelsea',
    logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/c/cc/Chelsea_FC.svg/1200px-Chelsea_FC.svg.png',
    stadium: 'Stamford Bridge',
    stadiumCapacity: 40834,
    founded: 1905,
    city: 'London',
    country: 'England',
    colors: {
      primary: 'Blue',
      secondary: 'White'
    },
    honours: [
      { name: 'League Titles', count: 6 },
      { name: 'Champions League', count: 2 }
    ],
    group: 'A',
    description: 'Chelsea Football Club is an English professional football club based in Fulham, West London.',
    website: 'https://www.chelseafc.com',
    email: 'info@chelseafc.com'
  }
];

async function seedClubs() {
  try {
    console.log('🌱 Starting club seeding process...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    // Find an admin user to use as creator
    let adminUser = await User.findOne({ role: 'admin' });
    
    if (!adminUser) {
      console.log('⚠️ No admin user found. Creating a default admin user...');
      // Create a default admin user for seeding
      adminUser = await User.create({
        firebaseUid: 'seed_admin_' + Date.now(),
        name: 'Seed Admin',
        email: 'seed@admin.com',
        role: 'admin',
        isActive: true
      });
      console.log('✅ Created default admin user for seeding');
    }
    
    console.log('👤 Using admin user:', adminUser.name, '(' + adminUser.email + ')');
    
    // Check if clubs already exist
    const existingClubsCount = await Club.countDocuments();
    console.log('📊 Existing clubs in database:', existingClubsCount);
    
    if (existingClubsCount > 0) {
      console.log('⚠️ Clubs already exist in database. Skipping seeding.');
      console.log('💡 To re-seed, delete existing clubs first or use --force flag');
      return;
    }
    
    // Seed clubs
    console.log('🏟️ Seeding clubs...');
    
    for (const clubData of initialClubs) {
      try {
        const club = await Club.create({
          ...clubData,
          createdBy: adminUser._id
        });
        console.log(`✅ Created club: ${club.name}`);
      } catch (error) {
        console.error(`❌ Failed to create club ${clubData.name}:`, error.message);
      }
    }
    
    // Verify seeding
    const finalClubsCount = await Club.countDocuments();
    console.log(`\n🎉 Seeding completed! Total clubs in database: ${finalClubsCount}`);
    
    // List all clubs
    const clubs = await Club.find({}, 'name stadium founded city').sort({ name: 1 });
    console.log('\n📋 Clubs in database:');
    clubs.forEach((club, index) => {
      console.log(`${index + 1}. ${club.name} - ${club.stadium}, ${club.city} (Founded: ${club.founded})`);
    });
    
  } catch (error) {
    console.error('💥 Error during seeding:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
    process.exit();
  }
}

// Handle command line arguments
const args = process.argv.slice(2);
const forceFlag = args.includes('--force');

if (forceFlag) {
  console.log('🔄 Force flag detected. Will clear existing clubs first...');
}

// Run the seeding
seedClubs().catch(console.error);
