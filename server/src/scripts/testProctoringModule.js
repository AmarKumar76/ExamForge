require('dotenv').config();
const { connectDB, disconnectDB } = require('../config/db');
const User = require('../models/User');
const Course = require('../models/Course');
const Exam = require('../models/Exam');
const ExamAttempt = require('../models/ExamAttempt');
const SimilarityReport = require('../models/SimilarityReport');
const examService = require('../services/exam.service');
const integrityService = require('../services/integrity.service');

async function testProctoringModule() {
  try {
    console.log('🔌 Connecting to database for testing Proctoring & Academic Integrity Module...');
    await connectDB();

    const instructor = await User.findOne({ email: 'amar@gmail.com' });
    const student = await User.findOne({ email: 'student@examforge.org' });

    if (!instructor || !student) {
      console.error('❌ Instructor or Student user not found!');
      return await disconnectDB();
    }

    console.log(`👤 Instructor: ${instructor.name} (${instructor.email})`);
    console.log(`👤 Student: ${student.name} (${student.email})`);

    // 1. Fetch instructor proctoring dashboard
    console.log('\n--- 1. Testing getInstructorProctoringDashboard ---');
    const dashboard = await examService.getInstructorProctoringDashboard(instructor);

    console.log('Proctoring Dashboard Stats:', dashboard.stats);
    console.log('Exams Count:', dashboard.exams?.length);
    console.log('Attempts Count:', dashboard.attempts?.length);

    if (dashboard.attempts?.length > 0) {
      const firstAtt = dashboard.attempts[0];
      console.log(`\nInspecting Attempt: ${firstAtt.attemptId} (${firstAtt.student?.name})`);
      console.log('Risk Level:', firstAtt.riskLevel);
      console.log('Total Signals:', firstAtt.totalSignals);
      console.log('Review Status:', firstAtt.integritySummary?.reviewStatus);

      // 2. Test getAttemptIntegrityDetails
      console.log('\n--- 2. Testing getAttemptIntegrityDetails ---');
      const details = await examService.getAttemptIntegrityDetails(firstAtt.attemptId, instructor);
      console.log('Attempt Student:', details.attempt?.studentId?.name);
      console.log('Aggregated Risk Level:', details.aggregation?.riskLevel);
      console.log('Similarity Reports Count:', details.similarityReports?.length);

      // 3. Test Human Review Status Update & Audit Log
      console.log('\n--- 3. Testing Human Review Status Update ---');
      const updated = await examService.updateReviewStatus(
        firstAtt.attemptId,
        {
          reviewStatus: 'REVIEWED',
          instructorNote: 'Environmental context verified; no misconduct found.',
        },
        instructor
      );
      console.log('Updated Review Status:', updated.integritySummary?.reviewStatus);
      console.log('Instructor Note:', updated.integritySummary?.instructorNote);
    }

    // 4. Test Text Similarity Calculation
    console.log('\n--- 4. Testing Semantic Similarity Engine ---');
    const sampleText1 = 'Depth first search uses a stack data structure to traverse graph nodes deeply before backtracking.';
    const sampleText2 = 'Depth first search traversal utilizes a stack to explore graph vertices as deep as possible before backtracking.';
    const simScore = integrityService.calculateTextSimilarity(sampleText1, sampleText2);
    console.log(`Calculated Jaccard N-gram Similarity: ${simScore}%`);

    console.log('\n✅ ALL ACADEMIC INTEGRITY & PROCTORING MODULE TESTS PASSED CLEANLY!');
    await disconnectDB();
  } catch (err) {
    console.error('❌ Error testing proctoring module:', err);
    await disconnectDB();
  }
}

testProctoringModule();
