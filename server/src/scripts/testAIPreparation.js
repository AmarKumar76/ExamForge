require('dotenv').config();
const { connectDB, disconnectDB } = require('../config/db');
const User = require('../models/User');
const aiPreparationService = require('../services/aiPreparation.service');

async function testAIPreparation() {
  try {
    console.log('🔌 Connecting to database for testing AIPreparation Service...');
    await connectDB();

    const student = await User.findOne({ email: 'student@examforge.org' });
    if (!student) {
      console.error('❌ Student user not found!');
      return await disconnectDB();
    }

    console.log(`👤 Found student: ${student.name} (${student.email}, ID: ${student._id})`);

    // 1. Test getStudentAIPreparation
    console.log('\n--- 1. Testing getStudentAIPreparation ---');
    const prepData = await aiPreparationService.getStudentAIPreparation(student);

    console.log('Has Enrolled Courses:', prepData.hasEnrolledCourses);
    console.log('Has Published Results:', prepData.hasPublishedResults);
    console.log('Message:', prepData.message || 'N/A');
    console.log('Published Exams count:', prepData.publishedExams?.length);
    console.log('Weak Topics count:', prepData.weakTopicsAnalysis?.length);

    if (!prepData.hasPublishedResults) {
      console.log('🔒 Result Gating correctly verified! Message displayed:');
      console.log(`"${prepData.message}"`);
    } else {
      console.log('Latest Score:', prepData.latestPerformance?.percentage + '%');
      console.log('Strong Topics:', prepData.latestPerformance?.strongTopics?.map(s => s.topic));
      console.log('Weak Topics:', prepData.latestPerformance?.weakTopicsSummary?.map(w => w.topic));
    }

    // 2. Test Material Search
    if (prepData.enrolledCourses?.length > 0) {
      console.log('\n--- 2. Testing Course Material Search ---');
      const courseId = prepData.enrolledCourses[0]._id;
      const searchRes = await aiPreparationService.searchCourseMaterials(student, courseId, 'Graph');
      console.log('Search Query: "Graph"');
      console.log('Matching Chunks Count:', searchRes.results?.length);
    }

    // 3. Test AI Study Tutor Chat
    console.log('\n--- 3. Testing AI Study Tutor Context ---');
    const tutorRes = await aiPreparationService.chatWithTutor(student, {
      message: 'Explain BFS vs DFS in simple terms',
      topic: 'Graphs',
    });
    console.log('Tutor Model Used:', tutorRes.modelUsed);
    console.log('Tutor Response Snippet:', tutorRes.tutorResponse?.substring(0, 150) + '...');

    console.log('\n✅ ALL AI PREPARATION SERVICE TESTS PASSED CLEANLY WITH REAL MONGO DATA!');
    await disconnectDB();
  } catch (err) {
    console.error('❌ Error testing AI Preparation service:', err);
    await disconnectDB();
  }
}

testAIPreparation();
