const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const Institution = require('../models/Institution');
const User = require('../models/User');
const Course = require('../models/Course');
const CourseMaterial = require('../models/CourseMaterial');
const MaterialChunk = require('../models/MaterialChunk');
const QuestionFolder = require('../models/QuestionFolder');
const Question = require('../models/Question');
const Exam = require('../models/Exam');
const ExamAttempt = require('../models/ExamAttempt');
const Notification = require('../models/Notification');
const AuditLog = require('../models/AuditLog');
const SystemLog = require('../models/SystemLog');
const StudyPlan = require('../models/StudyPlan');
const StudyTask = require('../models/StudyTask');
const StudyGoal = require('../models/StudyGoal');
const PracticeAssessment = require('../models/PracticeAssessment');
const RevisionPlan = require('../models/RevisionPlan');
const SimilarityReport = require('../models/SimilarityReport');
const PasswordResetToken = require('../models/PasswordResetToken');

async function dryRunCleanup() {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    console.error('MONGO_URI is missing in .env');
    process.exit(1);
  }

  console.log('Connecting to Production MongoDB Atlas for DRY-RUN check...');
  await mongoose.connect(mongoUri);

  const testCodes = ['ANALYTICS-INST', 'EFLOW-INST', 'MGMT-INST-01', 'PROV-INST'];

  console.log('\n========================================================');
  console.log('DRY-RUN INSPECTION REPORT (NO DELETIONS WILL BE MADE)');
  console.log('========================================================\n');

  // 1. Find Institutions
  const insts = await Institution.find({ code: { $in: testCodes } });
  console.log(`1. FOUND TEST INSTITUTIONS (${insts.length}):`);
  insts.forEach((inst) => {
    console.log(`   - ID: ${inst._id} | Code: ${inst.code} | Name: ${inst.name}`);
  });

  const pitInst = await Institution.findOne({ code: 'PIT' });
  if (pitInst) {
    console.log(`\n   [UNTOUCHED] LEGITIMATE PRODUCTION INSTITUTION KEEP-LIST:`);
    console.log(`   - ID: ${pitInst._id} | Code: ${pitInst.code} | Name: ${pitInst.name}`);
  }

  const instIds = insts.map((i) => i._id);

  // 2. Find Courses
  const courses = await Course.find({
    $or: [
      { institutionId: { $in: instIds } },
      { code: { $in: [/^ANALYTICS-/, /^EFLOW-/, /^MGMT-/, /^PROV-/] } },
    ],
  });
  console.log(`\n2. FOUND ASSOCIATED COURSES (${courses.length}):`);
  courses.forEach((c) => {
    console.log(`   - ID: ${c._id} | Code: ${c.code} | Name: ${c.name} | InstID: ${c.institutionId}`);
  });
  const courseIds = courses.map((c) => c._id);

  // 3. Find Users
  const users = await User.find({
    $or: [
      { institutionId: { $in: instIds } },
      { email: { $in: [/analyticstest\.org$/, /email-test\.org$/, /mgmt-test\.org$/, /provtest\.org$/] } },
    ],
  });
  console.log(`\n3. FOUND ASSOCIATED USERS (${users.length}):`);
  users.forEach((u) => {
    console.log(`   - ID: ${u._id} | Email: ${u.email} | Name: ${u.name} | Role: ${u.role} | InstID: ${u.institutionId}`);
  });
  const userIds = users.map((u) => u._id);

  // 4. Find Exams
  const exams = await Exam.find({ courseId: { $in: courseIds } });
  console.log(`\n4. FOUND ASSOCIATED EXAMS (${exams.length}):`);
  exams.forEach((e) => {
    console.log(`   - ID: ${e._id} | Title: ${e.title} | CourseID: ${e.courseId}`);
  });
  const examIds = exams.map((e) => e._id);

  // 5. Find Question Folders & Questions
  const folders = await QuestionFolder.find({ courseId: { $in: courseIds } });
  const folderIds = folders.map((f) => f._id);
  const questions = await Question.find({
    $or: [
      { courseId: { $in: courseIds } },
      { folderId: { $in: folderIds } },
      { authorId: { $in: userIds } },
    ],
  });
  console.log(`\n5. FOUND ASSOCIATED QUESTION FOLDERS (${folders.length}) & QUESTIONS (${questions.length})`);

  // 6. Find Exam Attempts
  const attempts = await ExamAttempt.find({
    $or: [
      { examId: { $in: examIds } },
      { studentId: { $in: userIds } },
    ],
  });
  console.log(`\n6. FOUND ASSOCIATED EXAM ATTEMPTS (${attempts.length})`);

  // 7. Find Course Materials & Chunks
  const materials = await CourseMaterial.find({ courseId: { $in: courseIds } });
  const materialIds = materials.map((m) => m._id);
  const chunks = await MaterialChunk.find({ materialId: { $in: materialIds } });
  console.log(`\n7. FOUND ASSOCIATED MATERIALS (${materials.length}) & VECTOR CHUNKS (${chunks.length})`);

  // 8. Find Notifications, System Logs, Audit Logs
  const notifications = await Notification.find({ userId: { $in: userIds } });
  const auditLogs = await AuditLog.find({ userId: { $in: userIds } });
  const systemLogs = await SystemLog.find({
    $or: [
      { userId: { $in: userIds } },
      { message: { $in: [/ANALYTICS-/, /EFLOW-/, /MGMT-/, /PROV-/] } },
    ],
  });
  console.log(`\n8. FOUND NOTIFICATIONS (${notifications.length}), AUDIT LOGS (${auditLogs.length}), SYSTEM LOGS (${systemLogs.length})`);

  // 9. Find AI/Study Plan objects
  const studyPlans = await StudyPlan.find({ studentId: { $in: userIds } });
  const studyTasks = await StudyTask.find({ studentId: { $in: userIds } });
  const studyGoals = await StudyGoal.find({ studentId: { $in: userIds } });
  const practiceAss = await PracticeAssessment.find({ studentId: { $in: userIds } });
  const resetTokens = await PasswordResetToken.find({ userId: { $in: userIds } });

  console.log(`\n9. FOUND STUDY PLANS (${studyPlans.length}), TASKS (${studyTasks.length}), GOALS (${studyGoals.length}), PRACTICE ASSESSMENTS (${practiceAss.length}), RESET TOKENS (${resetTokens.length})`);

  console.log('\n========================================================');
  console.log('SUMMARY OF ITEMS IDENTIFIED FOR CLEANUP:');
  console.log(`- Institutions: ${insts.length}`);
  console.log(`- Courses: ${courses.length}`);
  console.log(`- Users: ${users.length}`);
  console.log(`- Exams: ${exams.length}`);
  console.log(`- Question Folders: ${folders.length}`);
  console.log(`- Questions: ${questions.length}`);
  console.log(`- Exam Attempts: ${attempts.length}`);
  console.log(`- Course Materials: ${materials.length}`);
  console.log(`- Material Chunks: ${chunks.length}`);
  console.log(`- Notifications: ${notifications.length}`);
  console.log(`- Audit Logs: ${auditLogs.length}`);
  console.log(`- System Logs: ${systemLogs.length}`);
  console.log(`- Study Plans/Tasks/Goals: ${studyPlans.length + studyTasks.length + studyGoals.length}`);
  console.log('========================================================\n');

  console.log('✅ DRY-RUN COMPLETE. ZERO records were modified or deleted.');

  await mongoose.connection.close();
}

dryRunCleanup().catch((err) => {
  console.error('Dry run failed:', err);
  process.exit(1);
});
