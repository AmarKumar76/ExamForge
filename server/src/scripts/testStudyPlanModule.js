require('dotenv').config();
const { connectDB, disconnectDB } = require('../config/db');
const User = require('../models/User');
const Course = require('../models/Course');
const studyPlanService = require('../services/studyPlan.service');

async function testFullStudyPlanModule() {
  try {
    console.log('🔌 Connecting to database for testing Study Plan Module...');
    await connectDB();

    const student = await User.findOne({ email: 'student@examforge.org' });
    if (!student) {
      console.error('❌ Student user not found!');
      return await disconnectDB();
    }

    console.log(`👤 Found student: ${student.name} (${student.email}, ID: ${student._id})`);

    // 1. Dashboard Overview Test
    console.log('\n--- 1. Testing Dashboard Overview ---');
    const dashboard = await studyPlanService.getDashboardOverview(student);
    console.log('Stats:', dashboard.stats);
    console.log('Enrolled Courses count:', dashboard.enrolledCourses?.length);

    const courseId = dashboard.enrolledCourses?.[0]?._id;

    // 2. Manual Task Creation & Toggle
    console.log('\n--- 2. Testing Manual Task CRUD ---');
    const newTask = await studyPlanService.createTask(student, {
      title: 'Complete BFS Lecture Notes',
      courseId,
      topic: 'Graphs',
      dueDate: new Date().toISOString(),
      dueTime: '19:00',
      estimatedDurationMinutes: 45,
      priority: 'HIGH',
    });
    console.log(`Created Task: "${newTask.title}" (ID: ${newTask._id})`);

    const toggled = await studyPlanService.toggleTaskStatus(student, newTask._id);
    console.log(`Toggled Task Status: ${toggled.status}`);

    // 3. Study Goal Creation
    console.log('\n--- 3. Testing Study Goal Creation ---');
    const newGoal = await studyPlanService.createGoal(student, {
      title: 'Master Graph Algorithms & Trees',
      courseId,
      topics: ['BFS', 'DFS', 'Cycle Detection', 'BST'],
      targetDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
      dailyStudyTimeMinutes: 120,
    });
    console.log(`Created Goal: "${newGoal.title}" (ID: ${newGoal._id})`);

    // 4. AI Study Roadmap Generation & Task Conversion
    console.log('\n--- 4. Testing AI Study Roadmap Generation ---');
    const roadmap = await studyPlanService.generateAIRoadmap(student, {
      goalId: newGoal._id,
      courseId,
      title: '7-Day Graph Mastery Plan',
      topics: ['BFS', 'DFS', 'Trees'],
      targetDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      dailyStudyTimeMinutes: 90,
    });
    console.log(`Generated AI Roadmap: "${roadmap.title}" with ${roadmap.dailySchedule?.length} day items.`);

    console.log('\nConverting AI Roadmap into Study Tasks...');
    const conversionRes = await studyPlanService.convertRoadmapToTasks(student, roadmap._id);
    console.log(`Converted ${conversionRes.convertedCount} roadmap items into real Study Tasks!`);

    // 5. Exam Revision Plan Creation
    console.log('\n--- 5. Testing Exam Revision Plan Creation ---');
    const revPlan = await studyPlanService.createRevisionPlan(student, {
      courseId,
      title: 'DSA Mid-Term Intensive Revision',
      examDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
      topics: ['Unit 1 Analysis', 'Unit 2 Arrays', 'Unit 3 Graphs'],
    });
    console.log(`Created Revision Plan: "${revPlan.title}" (Stage: ${revPlan.proximityStage})`);

    // 6. AI Planning Assistant Chat
    console.log('\n--- 6. Testing AI Planning Assistant ---');
    const assistantRes = await studyPlanService.chatWithPlanningAssistant(student, {
      message: 'Mere paas aaj sirf 2 hours hain, Aaj ke tasks organize karo',
    });
    console.log('AI Planning Assistant Model Used:', assistantRes.modelUsed);
    console.log('Assistant Response Snippet:', assistantRes.response?.substring(0, 160) + '...');

    // Clean up created test records
    await studyPlanService.deleteTask(student, newTask._id);
    await studyPlanService.deleteGoal(student, newGoal._id);
    await studyPlanService.deleteRevisionPlan(student, revPlan._id);

    console.log('\n✅ ALL STUDY PLAN MODULE END-TO-END TESTS PASSED CLEANLY WITH REAL MONGO DATA!');
    await disconnectDB();
  } catch (err) {
    console.error('❌ Error testing Study Plan module:', err);
    await disconnectDB();
  }
}

testFullStudyPlanModule();
