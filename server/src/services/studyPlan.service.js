const StudyTask = require('../models/StudyTask');
const StudyGoal = require('../models/StudyGoal');
const StudyPlan = require('../models/StudyPlan');
const RevisionPlan = require('../models/RevisionPlan');
const Course = require('../models/Course');
const QuestionFolder = require('../models/QuestionFolder');
const Exam = require('../models/Exam');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const aiConfig = require('../config/ai');

class StudyPlanService {
  constructor() {
    this.ensureIndexes();
  }

  async ensureIndexes() {
    try {
      await StudyPlan.collection.dropIndex('studentId_1');
    } catch (e) {
      // Index did not exist or already dropped
    }
  }

  /**
   * Helper to format dates to start of day
   */
  getStartOfDay(dateStr = null) {
    const d = dateStr ? new Date(dateStr) : new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }

  getEndOfDay(dateStr = null) {
    const d = dateStr ? new Date(dateStr) : new Date();
    d.setHours(23, 59, 59, 999);
    return d;
  }

  /**
   * 1. Get complete Study Plan Dashboard Overview
   */
  async getDashboardOverview(user) {
    const studentId = user._id;

    // Enrolled courses for dropdown / linking
    const enrolledCourses = await Course.find({ studentIds: studentId })
      .select('_id name code department')
      .lean();

    const courseIds = enrolledCourses.map((c) => c._id);

    // Fetch question folders for units/chapters
    const courseFolders = await QuestionFolder.find({ courseId: { $in: courseIds } })
      .select('_id courseId title description')
      .lean();

    // Fetch upcoming official exams for student enrollment
    const upcomingExams = await Exam.find({
      courseId: { $in: courseIds },
      status: { $in: ['PUBLISHED', 'SCHEDULED', 'ACTIVE'] },
    })
      .select('_id title courseId startTime endTime duration')
      .populate('courseId', 'code name')
      .lean();

    // All student tasks
    const allTasks = await StudyTask.find({ studentId })
      .populate('courseId', 'name code')
      .sort({ dueDate: 1, dueTime: 1 })
      .lean();

    const todayStart = this.getStartOfDay();
    const todayEnd = this.getEndOfDay();

    const tasksToday = allTasks.filter((t) => {
      if (!t.dueDate) return false;
      const d = new Date(t.dueDate);
      return d >= todayStart && d <= todayEnd;
    });

    const upcomingTasks = allTasks.filter((t) => {
      if (!t.dueDate) return false;
      const d = new Date(t.dueDate);
      return d > todayEnd && t.status === 'PENDING';
    });

    const completedTasks = allTasks.filter((t) => t.status === 'COMPLETED');
    const pendingTasks = allTasks.filter((t) => t.status === 'PENDING');

    const totalTasks = allTasks.length;
    const completedCount = completedTasks.length;
    const overallProgressPct = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;

    // Goals, Roadmaps, Revision Plans
    const activeGoals = await StudyGoal.find({ studentId, status: 'ACTIVE' })
      .populate('courseId', 'name code')
      .sort({ targetDate: 1 })
      .lean();

    const activeRoadmaps = await StudyPlan.find({ studentId, status: 'ACTIVE' })
      .populate('courseId', 'name code')
      .sort({ createdAt: -1 })
      .lean();

    const activeRevisionPlans = await RevisionPlan.find({ studentId, status: 'ACTIVE' })
      .populate('courseId', 'name code')
      .sort({ examDate: 1 })
      .lean();

    // Calculate goal progress for each active goal
    const goalsWithProgress = activeGoals.map((goal) => {
      const goalTasks = allTasks.filter((t) => t.goalId && t.goalId.toString() === goal._id.toString());
      const goalCompleted = goalTasks.filter((t) => t.status === 'COMPLETED').length;
      const progressPct = goalTasks.length > 0 ? Math.round((goalCompleted / goalTasks.length) * 100) : 0;
      return {
        ...goal,
        id: goal._id,
        totalTasks: goalTasks.length,
        completedTasks: goalCompleted,
        progressPercentage: progressPct,
      };
    });

    return {
      stats: {
        tasksTodayCount: tasksToday.length,
        completedTasksCount: completedCount,
        pendingTasksCount: pendingTasks.length,
        activeGoalsCount: activeGoals.length,
        overallProgressPercentage: overallProgressPct,
      },
      tasksToday,
      upcomingTasks: upcomingTasks.slice(0, 10),
      activeGoals: goalsWithProgress,
      activeRoadmaps,
      activeRevisionPlans,
      enrolledCourses,
      courseFolders,
      upcomingExams,
    };
  }

  /**
   * 2. Manual Task Management CRUD
   */
  async createTask(user, data) {
    const studentId = user._id;

    if (!data.title || !data.title.trim()) {
      const error = new Error('Task title is required');
      error.statusCode = 400;
      throw error;
    }

    const task = await StudyTask.create({
      studentId,
      courseId: data.courseId || null,
      folderId: data.folderId || null,
      goalId: data.goalId || null,
      revisionPlanId: data.revisionPlanId || null,
      roadmapId: data.roadmapId || null,
      title: data.title.trim(),
      description: data.description ? data.description.trim() : '',
      topic: data.topic ? data.topic.trim() : '',
      dueDate: data.dueDate ? new Date(data.dueDate) : new Date(),
      dueTime: data.dueTime || '19:00',
      estimatedDurationMinutes: parseInt(data.estimatedDurationMinutes, 10) || 45,
      priority: ['LOW', 'MEDIUM', 'HIGH'].includes(data.priority) ? data.priority : 'MEDIUM',
      reminder: {
        enabled: Boolean(data.reminder?.enabled),
        reminderTime: data.reminder?.reminderTime ? new Date(data.reminder.reminderTime) : null,
      },
      isRecurring: Boolean(data.isRecurring),
      recurrencePattern: data.recurrencePattern || 'NONE',
    });

    return task.populate('courseId', 'name code');
  }

  async getTasks(user, query = {}) {
    const studentId = user._id;
    const dbQuery = { studentId };

    if (query.courseId) dbQuery.courseId = query.courseId;
    if (query.priority) dbQuery.priority = query.priority;
    if (query.status) dbQuery.status = query.status;

    const view = query.view || 'ALL';
    const todayStart = this.getStartOfDay();
    const todayEnd = this.getEndOfDay();

    if (view === 'TODAY') {
      dbQuery.dueDate = { $gte: todayStart, $lte: todayEnd };
    } else if (view === 'UPCOMING') {
      dbQuery.dueDate = { $gt: todayEnd };
      dbQuery.status = 'PENDING';
    } else if (view === 'COMPLETED') {
      dbQuery.status = 'COMPLETED';
    }

    const tasks = await StudyTask.find(dbQuery)
      .populate('courseId', 'name code')
      .sort({ dueDate: 1, dueTime: 1 })
      .lean();

    return tasks;
  }

  async updateTask(user, taskId, updateData) {
    const studentId = user._id;
    const task = await StudyTask.findOne({ _id: taskId, studentId });

    if (!task) {
      const error = new Error('Task not found or unauthorized.');
      error.statusCode = 404;
      throw error;
    }

    if (updateData.title) task.title = updateData.title.trim();
    if (updateData.description !== undefined) task.description = updateData.description.trim();
    if (updateData.topic !== undefined) task.topic = updateData.topic.trim();
    if (updateData.courseId !== undefined) task.courseId = updateData.courseId || null;
    if (updateData.dueDate) task.dueDate = new Date(updateData.dueDate);
    if (updateData.dueTime) task.dueTime = updateData.dueTime;
    if (updateData.estimatedDurationMinutes) task.estimatedDurationMinutes = parseInt(updateData.estimatedDurationMinutes, 10);
    if (updateData.priority) task.priority = updateData.priority;
    if (updateData.reminder) {
      task.reminder = {
        enabled: Boolean(updateData.reminder.enabled),
        reminderTime: updateData.reminder.reminderTime ? new Date(updateData.reminder.reminderTime) : null,
      };
    }

    if (updateData.status && updateData.status !== task.status) {
      task.status = updateData.status;
      task.completedAt = updateData.status === 'COMPLETED' ? new Date() : null;
    }

    await task.save();
    return task.populate('courseId', 'name code');
  }

  async deleteTask(user, taskId) {
    const studentId = user._id;
    const result = await StudyTask.deleteOne({ _id: taskId, studentId });
    if (result.deletedCount === 0) {
      const error = new Error('Task not found or unauthorized.');
      error.statusCode = 404;
      throw error;
    }
    return { success: true, taskId };
  }

  async toggleTaskStatus(user, taskId) {
    const studentId = user._id;
    const task = await StudyTask.findOne({ _id: taskId, studentId });

    if (!task) {
      const error = new Error('Task not found or unauthorized.');
      error.statusCode = 404;
      throw error;
    }

    task.status = task.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED';
    task.completedAt = task.status === 'COMPLETED' ? new Date() : null;
    await task.save();

    return task.populate('courseId', 'name code');
  }

  /**
   * 3. Study Goals CRUD
   */
  async createGoal(user, data) {
    const studentId = user._id;

    if (!data.title || !data.title.trim() || !data.courseId || !data.targetDate) {
      const error = new Error('Goal title, courseId, and targetDate are required.');
      error.statusCode = 400;
      throw error;
    }

    const goal = await StudyGoal.create({
      studentId,
      courseId: data.courseId,
      title: data.title.trim(),
      description: data.description ? data.description.trim() : '',
      topics: Array.isArray(data.topics) ? data.topics : [],
      targetDate: new Date(data.targetDate),
      dailyStudyTimeMinutes: parseInt(data.dailyStudyTimeMinutes, 10) || 120,
      currentLevel: ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'].includes(data.currentLevel) ? data.currentLevel : 'INTERMEDIATE',
      preferredActivities: Array.isArray(data.preferredActivities) ? data.preferredActivities : ['LEARN', 'PRACTICE', 'REVISION'],
    });

    return goal.populate('courseId', 'name code');
  }

  async getGoals(user) {
    const studentId = user._id;
    const goals = await StudyGoal.find({ studentId })
      .populate('courseId', 'name code')
      .sort({ createdAt: -1 })
      .lean();

    return goals;
  }

  async deleteGoal(user, goalId) {
    const studentId = user._id;
    await StudyTask.deleteMany({ goalId, studentId });
    await StudyPlan.deleteMany({ goalId, studentId });
    const result = await StudyGoal.deleteOne({ _id: goalId, studentId });
    if (result.deletedCount === 0) {
      const error = new Error('Goal not found or unauthorized.');
      error.statusCode = 404;
      throw error;
    }
    return { success: true, goalId };
  }

  /**
   * 4. AI Study Roadmap Generation & Task Conversion
   */
  async generateAIRoadmap(user, params) {
    const studentId = user._id;
    const { goalId, courseId, title, topics = [], targetDate, dailyStudyTimeMinutes = 120, currentLevel = 'INTERMEDIATE', preferredActivities = ['LEARN', 'PRACTICE'] } = params;

    const course = await Course.findById(courseId).select('name code');
    if (!course) {
      const error = new Error('Selected course not found.');
      error.statusCode = 404;
      throw error;
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      const error = new Error('GEMINI_API_KEY is not configured in server environment.');
      error.statusCode = 500;
      throw error;
    }

    const tDate = targetDate ? new Date(targetDate) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const daysDiff = Math.max(1, Math.min(14, Math.ceil((tDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))));

    const prompt = `You are ExamForge AI Planning Assistant. Generate a realistic ${daysDiff}-day study roadmap for a student.

INPUT DETAILS:
- Course: ${course.name} (${course.code})
- Goal Title: ${title || 'Study Goal'}
- Selected Topics: ${topics.join(', ') || 'Core Course Concepts'}
- Target Days: ${daysDiff} Days
- Available Daily Study Time: ${dailyStudyTimeMinutes} minutes
- Current Skill Level: ${currentLevel}
- Preferred Activities: ${preferredActivities.join(', ')}

REQUIREMENTS:
Return a strictly valid JSON array of daily schedule objects:
[
  {
    "dayNumber": 1,
    "dayLabel": "Day 1",
    "topic": "Topic Name",
    "activityType": "LEARN",
    "durationMinutes": 45,
    "priority": "HIGH"
  }
]

RULES:
1. dayNumber must go from 1 to ${daysDiff}.
2. activityType MUST be one of: "LEARN", "PRACTICE", "REVISION", "MOCK_TEST".
3. durationMinutes must not exceed ${dailyStudyTimeMinutes} mins per day.
4. Output ONLY valid raw JSON with no markdown formatting.`;

    const genAI = new GoogleGenerativeAI(apiKey);
    const targetModel = process.env.GEMINI_GENERATION_MODEL || aiConfig.geminiGenerationModel || 'gemini-3.5-flash-lite';
    const model = genAI.getGenerativeModel({ model: targetModel });

    const result = await model.generateContent(prompt);
    let rawText = result.response.text();
    rawText = rawText.replace(/```(?:json)?\s*([\s\S]*?)\s*```/i, '$1').trim();

    let dailySchedule = [];
    try {
      dailySchedule = JSON.parse(rawText);
    } catch (e) {
      console.warn('Failed to parse Gemini roadmap JSON, building fallback roadmap:', e.message);
      for (let i = 1; i <= daysDiff; i++) {
        const tp = topics[(i - 1) % topics.length] || 'Course Review';
        dailySchedule.push({
          dayNumber: i,
          dayLabel: `Day ${i}`,
          topic: tp,
          activityType: i % 2 === 0 ? 'PRACTICE' : 'LEARN',
          durationMinutes: Math.min(60, dailyStudyTimeMinutes),
          priority: i <= 2 ? 'HIGH' : 'MEDIUM',
        });
      }
    }

    const roadmapDoc = await StudyPlan.create({
      studentId,
      goalId: goalId || null,
      courseId: course._id,
      title: title || `${course.code} Study Roadmap`,
      targetDate: tDate,
      dailySchedule,
    });

    return roadmapDoc.populate('courseId', 'name code');
  }

  async convertRoadmapToTasks(user, roadmapId) {
    const studentId = user._id;
    const roadmap = await StudyPlan.findOne({ _id: roadmapId, studentId });

    if (!roadmap) {
      const error = new Error('Roadmap not found or unauthorized.');
      error.statusCode = 404;
      throw error;
    }

    const createdTasks = [];
    const now = new Date();

    for (let idx = 0; idx < roadmap.dailySchedule.length; idx++) {
      const item = roadmap.dailySchedule[idx];

      if (!item.isConvertedToTask) {
        const dueDate = new Date(now.getTime() + (item.dayNumber - 1) * 24 * 60 * 60 * 1000);
        const taskTitle = `${item.activityType || 'Study'}: ${item.topic}`;

        const task = await StudyTask.create({
          studentId,
          courseId: roadmap.courseId,
          roadmapId: roadmap._id,
          goalId: roadmap.goalId,
          title: taskTitle,
          topic: item.topic,
          dueDate,
          dueTime: '19:00',
          estimatedDurationMinutes: item.durationMinutes || 45,
          priority: item.priority || 'MEDIUM',
          status: 'PENDING',
        });

        item.isConvertedToTask = true;
        item.taskId = task._id;
        createdTasks.push(task);
      }
    }

    await roadmap.save();
    return { convertedCount: createdTasks.length, tasks: createdTasks };
  }

  /**
   * 5. Explicit Student Exam Revision Plan
   */
  async createRevisionPlan(user, params) {
    const studentId = user._id;
    const { courseId, examId, title, examDate, topics = [], dailyStudyTimeMinutes = 120 } = params;

    if (!courseId || !examDate) {
      const error = new Error('CourseId and examDate are required to create a revision plan.');
      error.statusCode = 400;
      throw error;
    }

    const course = await Course.findById(courseId).select('name code');
    if (!course) {
      const error = new Error('Course not found.');
      error.statusCode = 404;
      throw error;
    }

    const eDate = new Date(examDate);
    const diffMs = eDate.getTime() - Date.now();
    const daysRemaining = Math.max(1, Math.min(14, Math.ceil(diffMs / (1000 * 60 * 60 * 24))));

    let proximityStage = 'EARLY_REVISION';
    if (daysRemaining <= 1) proximityStage = 'FINAL_REVISION';
    else if (daysRemaining <= 3) proximityStage = 'HIGH_PRIORITY_REVISION';
    else if (daysRemaining <= 6) proximityStage = 'REVISION_MODE';

    const schedule = [];
    const selectedTopics = topics.length > 0 ? topics : ['Core Exam Topics'];

    for (let i = 1; i <= daysRemaining; i++) {
      const isFinal = i === daysRemaining;
      const topicName = selectedTopics[(i - 1) % selectedTopics.length];
      const taskTitle = isFinal ? `Final Exam Mock & Quick Revision` : `Revision: ${topicName}`;

      schedule.push({
        dayNumber: i,
        dayLabel: isFinal ? 'EXAM DAY / FINAL' : `Day ${i}`,
        title: taskTitle,
        topic: topicName,
        durationMinutes: isFinal ? 30 : Math.min(60, dailyStudyTimeMinutes),
        focus: isFinal ? 'Quick Summary & Mental Check' : 'Concept Revision & Practice',
        priority: proximityStage === 'HIGH_PRIORITY_REVISION' || isFinal ? 'HIGH' : 'MEDIUM',
      });
    }

    const revisionPlan = await RevisionPlan.create({
      studentId,
      courseId,
      examId: examId || null,
      title: title || `${course.code} Exam Revision Plan`,
      examDate: eDate,
      topics: selectedTopics,
      dailyStudyTimeMinutes,
      proximityStage,
      schedule,
    });

    // Automatically convert revision schedule into actual tasks
    const createdTasks = [];
    const now = new Date();
    for (let item of revisionPlan.schedule) {
      const dueDate = new Date(now.getTime() + (item.dayNumber - 1) * 24 * 60 * 60 * 1000);
      const task = await StudyTask.create({
        studentId,
        courseId,
        revisionPlanId: revisionPlan._id,
        title: item.title,
        topic: item.topic,
        dueDate,
        dueTime: '18:00',
        estimatedDurationMinutes: item.durationMinutes,
        priority: item.priority,
        status: 'PENDING',
      });
      item.isConvertedToTask = true;
      item.taskId = task._id;
      createdTasks.push(task);
    }

    await revisionPlan.save();
    return revisionPlan.populate('courseId', 'name code');
  }

  async getRevisionPlans(user) {
    const studentId = user._id;
    return RevisionPlan.find({ studentId, status: 'ACTIVE' })
      .populate('courseId', 'name code')
      .sort({ examDate: 1 })
      .lean();
  }

  async deleteRevisionPlan(user, revisionPlanId) {
    const studentId = user._id;
    await StudyTask.deleteMany({ revisionPlanId, studentId });
    const result = await RevisionPlan.deleteOne({ _id: revisionPlanId, studentId });
    if (result.deletedCount === 0) {
      const error = new Error('Revision plan not found or unauthorized.');
      error.statusCode = 404;
      throw error;
    }
    return { success: true, revisionPlanId };
  }

  /**
   * 6. Compact AI Planning Assistant Chat
   */
  async chatWithPlanningAssistant(user, { message }) {
    if (!message || !message.trim()) {
      const error = new Error('Message is required.');
      error.statusCode = 400;
      throw error;
    }

    const studentId = user._id;

    // Build context from MongoDB
    const activeGoals = await StudyGoal.find({ studentId, status: 'ACTIVE' }).select('title targetDate topics').lean();
    const pendingTasks = await StudyTask.find({ studentId, status: 'PENDING' }).select('title topic dueDate priority estimatedDurationMinutes').lean();
    const activeRevisionPlans = await RevisionPlan.find({ studentId, status: 'ACTIVE' }).select('title examDate proximityStage').lean();

    const contextSummary = `
STUDENT CONTEXT:
- Student Name: ${user.name || 'Student'}
- Active Goals: ${activeGoals.map((g) => g.title).join(', ') || 'None'}
- Pending Tasks Count: ${pendingTasks.length}
- Sample Pending Tasks: ${pendingTasks.slice(0, 5).map((t) => `${t.title} (${t.priority} priority, ${t.estimatedDurationMinutes}m)`).join('; ') || 'None'}
- Active Revision Plans: ${activeRevisionPlans.map((r) => `${r.title} (Stage: ${r.proximityStage})`).join(', ') || 'None'}
`;

    const systemPrompt = `You are ExamForge AI Planning Assistant, a helpful productivity and study planning advisor.

YOUR PURPOSE:
1. Help the student organize, schedule, prioritize, and manage their study time and tasks.
2. Provide short, highly structured, practical planning advice.
3. Suggest clear task orders, daily schedules, or priority adjustments based on available time.

${contextSummary}

STUDENT PROMPT:
"${message.trim()}"

Respond in a clear, friendly, structured bulleted manner.`;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      const error = new Error('GEMINI_API_KEY is not configured in server environment.');
      error.statusCode = 500;
      throw error;
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const targetModel = process.env.GEMINI_GENERATION_MODEL || aiConfig.geminiGenerationModel || 'gemini-3.5-flash-lite';
    const model = genAI.getGenerativeModel({ model: targetModel });

    const result = await model.generateContent(systemPrompt);
    const responseText = result.response.text();

    return {
      response: responseText,
      modelUsed: targetModel,
    };
  }
}

module.exports = new StudyPlanService();
