require('dotenv').config();
const { connectDB, disconnectDB } = require('../config/db');
const User = require('../models/User');
const { hashPassword } = require('../utils/password');
const { ROLES, ACCOUNT_STATUS } = require('../constants/roles');

const seedAccounts = async () => {
  try {
    console.log('🔌 Connecting to MongoDB database for seeding accounts...');
    await connectDB();

    const passHashAdmin = await hashPassword('Admin@123');
    const passHashInstructor = await hashPassword('Instructor@123');
    const passHashStudent = await hashPassword('Student@123');

    const accounts = [
      { name: 'Demo Admin', email: 'admin@examforge.org', passwordHash: passHashAdmin, role: ROLES.SUPER_ADMIN },
      { name: 'Amar Kumar (Instructor)', email: 'amar@gmail.com', passwordHash: passHashInstructor, role: ROLES.INSTRUCTOR },
      { name: 'Demo Student', email: 'student@examforge.org', passwordHash: passHashStudent, role: ROLES.STUDENT },
    ];

    for (const acc of accounts) {
      const existing = await User.findOne({ email: acc.email });
      if (!existing) {
        await User.create({
          ...acc,
          status: ACCOUNT_STATUS.ACTIVE,
        });
        console.log(`✅ Seeded account: ${acc.email} (${acc.role})`);
      } else {
        existing.passwordHash = acc.passwordHash;
        existing.role = acc.role;
        existing.status = ACCOUNT_STATUS.ACTIVE;
        await existing.save();
        console.log(`🔄 Updated credentials for existing account: ${acc.email} (${existing.role})`);
      }
    }

    await disconnectDB();
    console.log('🎉 Seeding complete.');
  } catch (error) {
    console.error('❌ Error seeding accounts:', error);
    await disconnectDB();
  }
};

if (require.main === module) {
  seedAccounts();
}

module.exports = seedAccounts;
