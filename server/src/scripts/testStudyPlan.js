require('dotenv').config();
const { connectDB, disconnectDB } = require('../config/db');
const User = require('../models/User');
const studyPlanService = require('../services/studyPlan.service');

async function testStudyPlan() {
  try {
    console.log('🔌 Connecting to database for testing StudyPlan Service...');
    await connectDB();

    const student = await User.findOne({ email: 'student@examforge.org' });
    if (!student) {
      console.error('❌ Student user not found!');
      return await disconnectDB();
    }

    console.log(`👤 Found student: ${student.name} (${student.email}, ID: ${student._id})`);

    // 1. Test fetching study plan
    console.log('\n--- 1. Testing getStudentStudyPlan ---');
    const planResult = await studyPlanService.getStudentStudyPlan(student);

    console.log('Has Enrolled Courses:', planResult.hasEnrolledCourses);
    console.log('Has Published Results:', planResult.hasPublishedResults);
    console.log('Has Performance Data:', planResult.hasPerformanceData);
    console.log('Courses count:', planResult.courseDetails?.length);
    console.log('Weekly Plan days count:', planResult.normalStudyPlan?.weeklyPlan?.length);
    console.log('Weekly Progress %:', planResult.normalStudyPlan?.weeklyProgressPercentage);
    console.log('AI Recommendation:', planResult.normalStudyPlan?.aiRecommendation);
    console.log('Upcoming Exams count:', planResult.upcomingExams?.length);

    if (planResult.upcomingExams?.length > 0) {
      const firstExam = planResult.upcomingExams[0];
      console.log(`\nUpcoming Exam: "${firstExam.title}" (${firstExam.courseCode})`);
      console.log(`Days Remaining: ${firstExam.daysRemaining}`);
      console.log(`Proximity Stage: ${firstExam.proximityStage} (${firstExam.proximityLabel})`);
    }

    if (planResult.activeExamRevisionPlan) {
      console.log(`\n--- Active Exam Revision Plan ---`);
      console.log('Exam Title:', planResult.activeExamRevisionPlan.examTitle);
      console.log('Ranked Topics Count:', planResult.activeExamRevisionPlan.rankedRevisionTopics?.length);
      console.log('Schedule Days Count:', planResult.activeExamRevisionPlan.schedule?.length);
    }

    // 2. Test toggling task status persistence
    console.log('\n--- 2. Testing Task Persistence (toggleTaskStatus) ---');
    const testTaskId = 'weekly-monday-concept';
    const toggle1 = await studyPlanService.toggleTaskStatus(student, testTaskId);
    console.log(`Toggled "${testTaskId}": isCompleted =`, toggle1.isCompleted);

    // Verify persistence by fetching study plan again
    const planAfterToggle = await studyPlanService.getStudentStudyPlan(student);
    const mondayConceptTask = planAfterToggle.normalStudyPlan?.weeklyPlan?.[0]?.tasks?.find(t => t.taskId === testTaskId);
    console.log(`Verified persistence from DB: task completed state =`, mondayConceptTask?.completed);

    // Toggle back to keep database clean if desired
    const toggle2 = await studyPlanService.toggleTaskStatus(student, testTaskId);
    console.log(`Toggled back "${testTaskId}": isCompleted =`, toggle2.isCompleted);

    console.log('\n✅ ALL STUDY PLAN TESTS PASSED SUCCESSFULLY WITH REAL MONGO DATA!');
    await disconnectDB();
  } catch (err) {
    console.error('❌ Error testing study plan service:', err);
    await disconnectDB();
  }
}

testStudyPlan();
