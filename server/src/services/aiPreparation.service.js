const Course = require('../models/Course');
const Exam = require('../models/Exam');
const ExamAttempt = require('../models/ExamAttempt');
const PracticeAssessment = require('../models/PracticeAssessment');
const QuestionFolder = require('../models/QuestionFolder');
const CourseMaterial = require('../models/CourseMaterial');
const retrieverService = require('./ai/retriever.service');
const geminiService = require('./ai/gemini.service');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const aiConfig = require('../config/ai');

class AIPreparationService {
  /**
   * Main method to generate performance-driven AI Preparation data
   */
  async getStudentAIPreparation(user) {
    const studentId = user._id;

    // 1. Fetch enrolled courses
    const enrolledCourses = await Course.find({ studentIds: studentId })
      .select('_id name code department description')
      .lean();

    const courseIds = enrolledCourses.map((c) => c._id);

    if (courseIds.length === 0) {
      return {
        hasEnrolledCourses: false,
        hasPublishedResults: false,
        message: 'You are not enrolled in any courses.',
        publishedExams: [],
        latestPerformance: null,
        weakTopicsAnalysis: [],
        materialSearchable: false,
      };
    }

    // 2. Query PUBLISHED exam attempts only
    const publishedAttempts = await ExamAttempt.find({
      studentId,
      status: 'PUBLISHED',
    })
      .populate('examId', 'title totalMarks passingMarks duration courseId folderIds')
      .populate('courseId', 'name code department')
      .populate({
        path: 'answers.questionId',
        select: 'questionText topic folderId difficulty type options correctAnswer explanation',
        populate: { path: 'folderId', select: 'title description' },
      })
      .sort({ resultPublishedAt: -1, createdAt: -1 })
      .lean();

    if (publishedAttempts.length === 0) {
      return {
        hasEnrolledCourses: true,
        hasPublishedResults: false,
        message: 'Complete an assessment and wait for your instructor to release the result to unlock AI Preparation.',
        publishedExams: [],
        latestPerformance: null,
        weakTopicsAnalysis: [],
        materialSearchable: true,
        enrolledCourses,
      };
    }

    // 3. Process published exam attempts to build granular analysis
    const publishedExamsSummary = publishedAttempts.map((attempt) => ({
      attemptId: attempt._id,
      examId: attempt.examId?._id || attempt.examId,
      examTitle: attempt.examId?.title || 'Exam',
      courseId: attempt.courseId?._id || attempt.courseId,
      courseCode: attempt.courseId?.code || '',
      courseName: attempt.courseId?.name || '',
      totalScore: attempt.totalScore,
      percentage: attempt.percentage,
      passed: attempt.passed,
      submittedAt: attempt.submittedAt,
      resultPublishedAt: attempt.resultPublishedAt,
    }));

    // Focus analysis on the most recent published attempt
    const latestAttempt = publishedAttempts[0];
    const latestExam = latestAttempt.examId || {};
    const latestCourse = latestAttempt.courseId || {};

    // 4. Topic performance & weak topic extraction
    const topicStats = {}; // topicName -> { totalMarks, earnedMarks, questionCount, correctCount, questions: [] }
    const difficultyStats = {
      EASY: { total: 0, correct: 0 },
      MEDIUM: { total: 0, correct: 0 },
      HARD: { total: 0, correct: 0 },
    };

    let totalQuestionsCount = 0;
    let totalCorrectCount = 0;

    if (Array.isArray(latestAttempt.answers)) {
      latestAttempt.answers.forEach((ans) => {
        totalQuestionsCount++;
        if (ans.isCorrect) totalCorrectCount++;

        const q = ans.questionId;
        if (q) {
          const diff = (q.difficulty || 'MEDIUM').toUpperCase();
          if (difficultyStats[diff]) {
            difficultyStats[diff].total++;
            if (ans.isCorrect) difficultyStats[diff].correct++;
          }

          // Folder or explicit topic name
          let topicName = q.topic;
          if ((!topicName || topicName === 'General') && q.folderId && q.folderId.title) {
            topicName = q.folderId.title;
          }
          if (!topicName) topicName = 'General Concepts';

          if (!topicStats[topicName]) {
            topicStats[topicName] = {
              topic: topicName,
              folderTitle: q.folderId?.title || '',
              totalMarks: 0,
              earnedMarks: 0,
              questionCount: 0,
              correctCount: 0,
              questions: [],
            };
          }

          topicStats[topicName].questionCount++;
          topicStats[topicName].earnedMarks += ans.marksObtained || (ans.isCorrect ? 1 : 0);
          topicStats[topicName].totalMarks += 1;
          if (ans.isCorrect) topicStats[topicName].correctCount++;

          topicStats[topicName].questions.push({
            questionId: q._id,
            questionText: q.questionText,
            difficulty: q.difficulty,
            studentAnswer: ans.selectedOption || ans.textAnswer || 'Not answered',
            correctAnswer: q.correctAnswer,
            isCorrect: ans.isCorrect,
            explanation: q.explanation || '',
          });
        }
      });
    }

    // Compute percentage per topic
    const topicAnalysisList = [];
    Object.keys(topicStats).forEach((tName) => {
      const stat = topicStats[tName];
      const pct = stat.totalMarks > 0 ? Math.round((stat.earnedMarks / stat.totalMarks) * 100) : 0;
      topicAnalysisList.push({
        ...stat,
        percentage: pct,
      });
    });

    const strongTopics = topicAnalysisList.filter((t) => t.percentage >= 75).sort((a, b) => b.percentage - a.percentage);
    const weakTopics = topicAnalysisList.filter((t) => t.percentage < 75).sort((a, b) => a.percentage - b.percentage);

    // Compute difficulty distribution accuracy
    const difficultyAnalysis = {
      easyAccuracy: difficultyStats.EASY.total > 0 ? Math.round((difficultyStats.EASY.correct / difficultyStats.EASY.total) * 100) : null,
      mediumAccuracy: difficultyStats.MEDIUM.total > 0 ? Math.round((difficultyStats.MEDIUM.correct / difficultyStats.MEDIUM.total) * 100) : null,
      hardAccuracy: difficultyStats.HARD.total > 0 ? Math.round((difficultyStats.HARD.correct / difficultyStats.HARD.total) * 100) : null,
    };

    // 5. Fetch real RAG study materials for weak topics
    const weakTopicsWithRAG = await Promise.all(
      weakTopics.map(async (wt) => {
        let ragChunks = [];
        try {
          ragChunks = await retrieverService.retrieveRelevantChunks({
            courseId: latestCourse._id || latestAttempt.courseId,
            topic: wt.topic,
            limit: 3,
          });
        } catch (err) {
          console.warn(`RAG retrieval warning for topic ${wt.topic}:`, err.message);
        }

        return {
          topic: wt.topic,
          percentage: wt.percentage,
          folderTitle: wt.folderTitle,
          correctCount: wt.correctCount,
          questionCount: wt.questionCount,
          questions: wt.questions,
          studyMaterials: ragChunks.map((c) => ({
            chunkId: c.chunkId,
            materialId: c.materialId,
            sourceFileName: c.sourceFileName || 'Course Document',
            pageNumber: c.pageNumber,
            excerpt: c.text,
            similarityScore: c.similarityScore,
          })),
        };
      })
    );

    // 6. Fetch practice assessments history for progress tracking
    const practiceHistory = await PracticeAssessment.find({
      studentId,
      courseId: { $in: courseIds },
    })
      .sort({ createdAt: -1 })
      .lean();

    return {
      hasEnrolledCourses: true,
      hasPublishedResults: true,
      publishedExams: publishedExamsSummary,
      latestPerformance: {
        attemptId: latestAttempt._id,
        examId: latestExam._id || latestAttempt.examId,
        examTitle: latestExam.title || 'Exam',
        courseId: latestCourse._id || latestAttempt.courseId,
        courseCode: latestCourse.code || '',
        courseName: latestCourse.name || '',
        totalScore: latestAttempt.totalScore,
        percentage: latestAttempt.percentage,
        passed: latestAttempt.passed,
        submittedAt: latestAttempt.submittedAt,
        resultPublishedAt: latestAttempt.resultPublishedAt,
        totalQuestions: totalQuestionsCount,
        correctQuestions: totalCorrectCount,
        difficultyAnalysis,
        strongTopics: strongTopics.map((s) => ({ topic: s.topic, percentage: s.percentage })),
        weakTopicsSummary: weakTopics.map((w) => ({ topic: w.topic, percentage: w.percentage })),
      },
      weakTopicsAnalysis: weakTopicsWithRAG,
      practiceHistory: practiceHistory.map((p) => ({
        id: p._id,
        title: p.title,
        topic: p.topic,
        score: p.score,
        percentage: p.percentage,
        questionCount: p.questions?.length || 0,
        createdAt: p.createdAt,
      })),
      enrolledCourses,
    };
  }

  /**
   * Search course study materials using semantic RAG search
   */
  async searchCourseMaterials(user, courseId, queryStr) {
    if (!queryStr || !queryStr.trim()) {
      return { results: [] };
    }

    // Verify course enrollment
    const course = await Course.findOne({ _id: courseId, studentIds: user._id }).select('_id name code');
    if (!course) {
      const error = new Error('Course not found or student not enrolled.');
      error.statusCode = 403;
      throw error;
    }

    const chunks = await retrieverService.retrieveRelevantChunks({
      courseId: course._id,
      topic: queryStr.trim(),
      limit: 10,
    });

    return {
      courseId: course._id,
      courseCode: course.code,
      courseName: course.name,
      query: queryStr.trim(),
      results: chunks.map((c) => ({
        chunkId: c.chunkId,
        materialId: c.materialId,
        sourceFileName: c.sourceFileName || 'Course Document',
        pageNumber: c.pageNumber,
        excerpt: c.text,
        score: c.similarityScore,
      })),
    };
  }

  /**
   * AI Study Tutor Chat with Gemini grounded in course & exam context
   */
  async chatWithTutor(user, { message, courseId, topic, contextText = '' }) {
    if (!message || !message.trim()) {
      const error = new Error('Message text is required');
      error.statusCode = 400;
      throw error;
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      const error = new Error('GEMINI_API_KEY is not configured in environment variables.');
      error.statusCode = 500;
      throw error;
    }

    // Fetch published results summary for student to enrich context
    let performanceContext = '';
    try {
      const latestAttempt = await ExamAttempt.findOne({ studentId: user._id, status: 'PUBLISHED' })
        .populate('examId', 'title')
        .populate('courseId', 'name code')
        .sort({ resultPublishedAt: -1 });

      if (latestAttempt) {
        performanceContext = `Student's Recent Published Exam: ${latestAttempt.examId?.title || 'Exam'} (${latestAttempt.courseId?.code || ''}) - Score: ${latestAttempt.percentage}%`;
      }
    } catch (e) {
      console.warn('Tutor context fetch warning:', e.message);
    }

    // Retrieve relevant course RAG chunks if topic or question provided
    let ragContext = contextText;
    if (!ragContext && courseId) {
      try {
        const chunks = await retrieverService.retrieveRelevantChunks({
          courseId,
          topic: topic || message,
          limit: 3,
        });
        if (chunks.length > 0) {
          ragContext = chunks.map((c) => `[Source: ${c.sourceFileName || 'Document'} (Page ${c.pageNumber || 1})]: ${c.text}`).join('\n\n');
        }
      } catch (e) {
        console.warn('RAG context retrieval warning for tutor:', e.message);
      }
    }

    const systemPrompt = `You are ExamForge AI Study Tutor, an expert, patient, encouraging, and clear academic tutor for higher education students.

YOUR ROLE:
1. Explain academic concepts, definitions, algorithms, formulas, and principles clearly.
2. Answer student questions using simple, step-by-step breakdowns, diagrams in text/markdown, or analogies.
3. Be grounded in the student's actual course materials whenever relevant context is provided.
4. Keep answers concise, highly structured, and easy to read.

STUDENT & COURSE CONTEXT:
- Student Name: ${user.name || 'Student'}
${performanceContext ? `- Performance Context: ${performanceContext}` : ''}
${topic ? `- Current Focus Topic: ${topic}` : ''}
${ragContext ? `\nRELEVANT COURSE STUDY MATERIALS:\n${ragContext}` : ''}

STUDENT QUESTION:
"${message.trim()}"

Provide a clear, helpful academic answer as an expert tutor.`;

    const genAI = new GoogleGenerativeAI(apiKey);
    const targetModel = process.env.GEMINI_GENERATION_MODEL || aiConfig.geminiGenerationModel || 'gemini-3.5-flash-lite';
    const model = genAI.getGenerativeModel({ model: targetModel });

    const result = await model.generateContent(systemPrompt);
    const responseText = result.response.text();

    return {
      tutorResponse: responseText,
      topic: topic || 'General',
      modelUsed: targetModel,
    };
  }
}

module.exports = new AIPreparationService();
