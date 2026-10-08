const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const config = require('../config/env');
const User = require('../models/User');
const Institution = require('../models/Institution');
const Course = require('../models/Course');
const CourseMaterial = require('../models/CourseMaterial');
const MaterialChunk = require('../models/MaterialChunk');
const Question = require('../models/Question');
const QuestionFolder = require('../models/QuestionFolder');
const Exam = require('../models/Exam');
const ExamAttempt = require('../models/ExamAttempt');
const AuditLog = require('../models/AuditLog');
const SystemLog = require('../models/SystemLog');
const Notification = require('../models/Notification');
const PracticeAssessment = require('../models/PracticeAssessment');
const RevisionPlan = require('../models/RevisionPlan');
const SimilarityReport = require('../models/SimilarityReport');
const StudyGoal = require('../models/StudyGoal');
const StudyPlan = require('../models/StudyPlan');
const StudyTask = require('../models/StudyTask');

const { hashPassword } = require('../utils/password');
const { ROLES, ACCOUNT_STATUS } = require('../constants/roles');

async function seedCleanData() {
  try {
    console.log('🔌 Connecting to MongoDB database...');
    const mongoUri = config.mongoUri || process.env.MONGO_URI || 'mongodb://localhost:27017/examforge';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB.');

    console.log('🧹 Purging all old test / development data from database...');
    await Promise.all([
      AuditLog.deleteMany({}),
      SystemLog.deleteMany({}),
      ExamAttempt.deleteMany({}),
      Exam.deleteMany({}),
      Question.deleteMany({}),
      QuestionFolder.deleteMany({}),
      CourseMaterial.deleteMany({}),
      MaterialChunk.deleteMany({}),
      SimilarityReport.deleteMany({}),
      RevisionPlan.deleteMany({}),
      StudyGoal.deleteMany({}),
      StudyPlan.deleteMany({}),
      StudyTask.deleteMany({}),
      PracticeAssessment.deleteMany({}),
      Notification.deleteMany({}),
      User.deleteMany({}),
      Course.deleteMany({}),
      Institution.deleteMany({}),
    ]);
    console.log('✨ All old development records successfully cleared.');

    // 1. Create Reference Institution
    console.log('🏫 Seeding Reference Institution (PIT)...');
    const pitInst = await Institution.create({
      name: 'Parul Institute of Technology',
      code: 'PIT',
      status: 'ACTIVE',
      departments: ['Computer Science & Engineering', 'Information Technology', 'Artificial Intelligence'],
    });

    // 2. Create ONLY ONE Primary SUPER_ADMIN Account (Idempotent)
    const superAdminEmail = (config.superAdmin && config.superAdmin.email) || 'amar766730@gmail.com';
    const superAdminPassword = (config.superAdmin && config.superAdmin.password) || 'Amar@123';

    console.log(`👑 Seeding Primary SUPER_ADMIN account: [${superAdminEmail}]...`);
    const superAdminHash = await hashPassword(superAdminPassword);
    
    let superAdminUser = await User.findOne({ email: superAdminEmail.toLowerCase().trim() });
    if (superAdminUser) {
      superAdminUser.passwordHash = superAdminHash;
      superAdminUser.role = ROLES.SUPER_ADMIN;
      superAdminUser.status = ACCOUNT_STATUS.ACTIVE;
      superAdminUser.isVerified = true;
      superAdminUser.institutionId = pitInst._id;
      await superAdminUser.save();
      console.log('🔄 Existing SUPER_ADMIN account updated idempotently.');
    } else {
      superAdminUser = await User.create({
        name: 'Primary Super Admin',
        email: superAdminEmail.toLowerCase().trim(),
        passwordHash: superAdminHash,
        role: ROLES.SUPER_ADMIN,
        status: ACCOUNT_STATUS.ACTIVE,
        isVerified: true,
        institutionId: pitInst._id,
      });
      console.log('✅ Primary SUPER_ADMIN account created successfully.');
    }

    // 3. Create Controlled Reference Course (0 Students, 0 Instructors)
    console.log('📚 Seeding Reference Course (CS301 — Operating Systems)...');
    const refCourse = await Course.create({
      name: 'Operating Systems',
      code: 'CS301',
      department: 'Computer Science & Engineering',
      description: 'Core concepts of operating systems, process management, memory allocation, and file systems.',
      institutionId: pitInst._id,
      instructorIds: [],
      studentIds: [],
      status: 'ACTIVE',
    });

    console.log('🧹 Cleaning uploads/materials/ directory files...');
    const uploadsDir = path.join(__dirname, '../../uploads/materials');
    if (fs.existsSync(uploadsDir)) {
      const files = fs.readdirSync(uploadsDir);
      for (const file of files) {
        if (file !== '.gitkeep') {
          fs.unlinkSync(path.join(uploadsDir, file));
        }
      }
    } else {
      fs.mkdirSync(uploadsDir, { recursive: true });
      fs.writeFileSync(path.join(uploadsDir, '.gitkeep'), '');
    }

    const totalUsers = await User.countDocuments({});
    const totalStudents = await User.countDocuments({ role: ROLES.STUDENT });
    const totalInstructors = await User.countDocuments({ role: ROLES.INSTRUCTOR });

    console.log('\n==================================================');
    console.log('🎉 SEED & DATABASE CLEANUP COMPLETE SUCCESSFUL!');
    console.log('==================================================');
    console.log(`Primary Super Admin Email : ${superAdminUser.email}`);
    console.log(`Total User Accounts      : ${totalUsers}`);
    console.log(`Total Student Accounts   : ${totalStudents}`);
    console.log(`Total Instructor Accounts: ${totalInstructors}`);
    console.log(`Reference Institution    : [${pitInst.code}] ${pitInst.name}`);
    console.log(`Reference Course         : [${refCourse.code}] ${refCourse.name}`);
    console.log('==================================================\n');

    await mongoose.disconnect();
    return { success: true };
  } catch (error) {
    console.error('❌ Error during database cleanup and seed:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

if (require.main === module) {
  seedCleanData();
}

module.exports = seedCleanData;
