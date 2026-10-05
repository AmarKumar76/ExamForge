require('dotenv').config();
const { connectDB, disconnectDB } = require('../config/db');
const User = require('../models/User');
const { hashPassword } = require('../utils/password');
const { ROLES, ACCOUNT_STATUS } = require('../constants/roles');

const seedSuperAdmin = async () => {
  try {
    console.log('🔌 Connecting to MongoDB database...');
    await connectDB();

    const email = 'admin@examforge.org';
    const password = 'Admin@123';
    const name = 'Demo Admin';
    const role = ROLES.SUPER_ADMIN;

    let existingUser = await User.findOne({ email: email.toLowerCase() });

    if (existingUser) {
      console.log(`ℹ️ Demo SUPER_ADMIN user already exists: [${existingUser.email}]`);
      console.log(`User ID: ${existingUser._id}`);
      console.log(`Role: ${existingUser.role}`);
      console.log(`Status: ${existingUser.status}`);
      await disconnectDB();
      return { status: 'EXISTS', user: existingUser };
    }

    console.log('⏳ Creating local demo SUPER_ADMIN user...');
    const hashedPassword = await hashPassword(password);

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      passwordHash: hashedPassword,
      role,
      status: ACCOUNT_STATUS.ACTIVE,
    });

    console.log('✅ Demo SUPER_ADMIN user created successfully!');
    console.log(`Email: ${user.email}`);
    console.log(`Role: ${user.role}`);
    console.log(`ID: ${user._id}`);

    await disconnectDB();
    return { status: 'CREATED', user };
  } catch (error) {
    console.error('❌ Error seeding SUPER_ADMIN user:', error);
    await disconnectDB();
    process.exit(1);
  }
};

if (require.main === module) {
  seedSuperAdmin();
}

module.exports = seedSuperAdmin;
