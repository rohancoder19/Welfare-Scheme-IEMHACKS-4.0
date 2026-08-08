const { connectDB } = require('../config/db');
const Scheme = require('../models/Scheme');
const Complaint = require('../models/Complaint');
const User = require('../models/User');
const { memorySchemes } = require('../controllers/schemeController');
const { memoryComplaints } = require('../controllers/complaintController');
const { memoryUsers } = require('../controllers/authController');

const seedData = async () => {
  try {
    const conn = await connectDB();
    if (!conn) {
      console.log('[Seed] Running in memory mode, skipping MongoDB persistent seed.');
      return;
    }

    console.log('[Seed] Seeding MongoDB database...');
    
    // Seed Schemes
    await Scheme.deleteMany({});
    await Scheme.insertMany(memorySchemes.map(s => {
      const { _id, ...rest } = s;
      return rest;
    }));
    console.log(`[Seed] Seeded ${memorySchemes.length} Welfare Schemes.`);

    // Seed Users
    await User.deleteMany({});
    await User.insertMany(memoryUsers.map(u => {
      const { _id, passwordHash, ...rest } = u;
      return { ...rest, password: passwordHash };
    }));
    console.log(`[Seed] Seeded ${memoryUsers.length} Sample Users.`);

    // Seed Complaints
    await Complaint.deleteMany({});
    await Complaint.insertMany(memoryComplaints.map(c => {
      const { _id, ...rest } = c;
      return rest;
    }));
    console.log(`[Seed] Seeded ${memoryComplaints.length} Sample Complaints.`);

    console.log('[Seed] Database seeding completed successfully!');
  } catch (error) {
    console.error('[Seed Error]', error.message);
  }
};

if (require.main === module) {
  seedData().then(() => process.exit(0));
}

module.exports = seedData;
