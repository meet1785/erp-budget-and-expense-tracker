const dotenv = require('dotenv');
const connectDB = require('../server/config/database');
const seedData = require('../server/utils/seedData');

// Load environment variables
dotenv.config();

const runSeed = async () => {
  try {
    // Connect to database
    await connectDB();
    
    // Seed the database
    await seedData();
    
    console.log('✅ Seeding completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    process.exit(1);
  }
};

runSeed();