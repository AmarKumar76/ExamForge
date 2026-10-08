const geminiService = require('./ai/gemini.service');
const SimilarityReport = require('../models/SimilarityReport');
const ExamAttempt = require('../models/ExamAttempt');
const Exam = require('../models/Exam');
const Course = require('../models/Course');

class IntegrityService {
  /**
   * Calculate Jaccard token n-gram similarity between two text strings (0 - 100%)
   */
  calculateTextSimilarity(str1, str2) {
    if (!str1 || !str2) return 0;
    const clean1 = str1.toLowerCase().replace(/[^\w\s]/g, '').trim();
    const clean2 = str2.toLowerCase().replace(/[^\w\s]/g, '').trim();

    if (clean1 === clean2) return 100;
    if (clean1.length < 10 || clean2.length < 10) return 0;

    const words1 = clean1.split(/\s+/);
    const words2 = clean2.split(/\s+/);

    // Build 2-gram sets
    const getBigrams = (words) => {
      const set = new Set();
      for (let i = 0; i < words.length - 1; i++) {
        set.add(`${words[i]} ${words[i + 1]}`);
      }
      return set;
    };

    const set1 = getBigrams(words1);
    const set2 = getBigrams(words2);

    if (set1.size === 0 || set2.size === 0) return 0;

    let intersectionCount = 0;
    set1.forEach((val) => {
      if (set2.has(val)) intersectionCount++;
    });

    const unionSize = set1.size + set2.size - intersectionCount;
    if (unionSize === 0) return 0;

    return Math.round((intersectionCount / unionSize) * 100);
  }

  /**
   * Run semantic text similarity check across all submitted attempts for an exam
   */
  async runExamSimilarityCheck(examId, user, threshold = 75) {
    const exam = await Exam.findById(examId);
    if (!exam) {
      const error = new Error('Exam not found.');
      error.statusCode = 404;
      throw error;
    }

    // Verify instructor assignment
    const course = await Course.findById(exam.courseId);
    if (!course || !course.instructorIds.some((id) => id.toString() === user._id.toString())) {
      const error = new Error('Access denied. You are not assigned to this course.');
      error.statusCode = 403;
      throw error;
    }

    const attempts = await ExamAttempt.find({
      examId: exam._id,
      status: { $in: ['SUBMITTED', 'GRADED', 'PUBLISHED'] },
    })
      .populate('studentId', 'name email rollNumber')
      .populate('answers.questionId', 'questionText type')
      .lean();

    if (attempts.length < 2) {
      return { reportsCount: 0, message: 'Fewer than 2 submissions available to compare.' };
    }

    const createdReports = [];

    // Compare pairs of student attempts for text/short answer questions
    for (let i = 0; i < attempts.length; i++) {
      for (let j = i + 1; j < attempts.length; j++) {
        const att1 = attempts[i];
        const att2 = attempts[j];

        if (att1.studentId?._id?.toString() === att2.studentId?._id?.toString()) continue;

        for (const ans1 of att1.answers || []) {
          const q1 = ans1.questionId;
          if (!q1 || q1.type !== 'SHORT_ANSWER' || !ans1.textAnswer || ans1.textAnswer.length < 15) continue;

          const ans2 = (att2.answers || []).find(
            (a) => a.questionId && (a.questionId._id || a.questionId).toString() === (q1._id || q1).toString()
          );

          if (ans2 && ans2.textAnswer && ans2.textAnswer.length >= 15) {
            const similarityScore = this.calculateTextSimilarity(ans1.textAnswer, ans2.textAnswer);

            if (similarityScore >= threshold) {
              // Upsert SimilarityReport document
              const report = await SimilarityReport.findOneAndUpdate(
                {
                  examId: exam._id,
                  questionId: q1._id || q1,
                  attemptId: att1._id,
                  comparedAttemptId: att2._id,
                },
                {
                  courseId: exam.courseId,
                  studentId: att1.studentId._id,
                  comparedStudentId: att2.studentId._id,
                  similarityScore,
                  thresholdUsed: threshold,
                  flaggedSnippet: ans1.textAnswer,
                  comparedSnippet: ans2.textAnswer,
                  reviewStatus: 'UNREVIEWED',
                },
                { upsert: true, new: true }
              );

              createdReports.push(report);

              // Push SEMANTIC_SIMILARITY signal to target attempts if not already recorded
              await this.pushSimilaritySignal(att1._id, similarityScore, att2.studentId.name, q1.questionText);
              await this.pushSimilaritySignal(att2._id, similarityScore, att1.studentId.name, q1.questionText);
            }
          }
        }
      }
    }

    return {
      reportsCount: createdReports.length,
      reports: createdReports,
    };
  }

  /**
   * Helper to add SEMANTIC_SIMILARITY signal to attempt if not existing
   */
  async pushSimilaritySignal(attemptId, similarityScore, comparedStudentName, questionText) {
    const attemptDoc = await ExamAttempt.findById(attemptId);
    if (!attemptDoc) return;

    const exists = (attemptDoc.integritySignals || []).some(
      (s) => s.signalType === 'SEMANTIC_SIMILARITY' && s.metadata?.comparedStudentName === comparedStudentName
    );

    if (!exists) {
      attemptDoc.integritySignals.push({
        signalType: 'SEMANTIC_SIMILARITY',
        timestamp: new Date(),
        severity: 'MEDIUM',
        source: 'SERVER',
        metadata: {
          similarityScore,
          comparedStudentName,
          questionText: questionText ? questionText.substring(0, 60) : '',
          message: 'Potentially similar response detected requiring instructor review',
        },
      });
      await attemptDoc.save();
    }
  }

  /**
   * Deterministically aggregate integrity signals into structured summary
   */
  aggregateSignals(integritySignals = [], questionTimings = []) {
    const signalCounts = {};
    let totalScore = 0;

    for (const sig of integritySignals) {
      const type = sig.signalType || 'UNKNOWN';
      signalCounts[type] = (signalCounts[type] || 0) + 1;

      switch (type) {
        case 'MULTIPLE_PERSON_DETECTED':
          totalScore += 25;
          break;
        case 'COPY_ATTEMPT':
        case 'PASTE_ATTEMPT':
        case 'CUT_ATTEMPT':
        case 'SEMANTIC_SIMILARITY':
          totalScore += 15;
          break;
        case 'FULLSCREEN_EXIT':
        case 'TAB_SWITCH':
        case 'FACE_NOT_DETECTED':
        case 'CAMERA_DISCONNECTED':
        case 'CAMERA_PERMISSION_DENIED':
          totalScore += 10;
          break;
        case 'UNUSUAL_ANSWER_TIMING':
        case 'UNUSUAL_TIMING':
        case 'WINDOW_BLUR':
        case 'CONTEXT_MENU':
        case 'CONNECTION_LOST':
          totalScore += 5;
          break;
        default:
          totalScore += 5;
          break;
      }
    }

    // Add timing anomalies (< 3 sec per question)
    let unusualTimingCount = 0;
    for (const t of questionTimings) {
      if (t.timeSpentSeconds !== undefined && t.timeSpentSeconds < 3 && t.timeSpentSeconds > 0) {
        unusualTimingCount++;
      }
    }
    if (unusualTimingCount > 0 && !signalCounts['UNUSUAL_TIMING']) {
      signalCounts['UNUSUAL_TIMING'] = unusualTimingCount;
      totalScore += unusualTimingCount * 5;
    }

    let riskLevel = 'LOW';
    if (totalScore >= 50) {
      riskLevel = 'HIGH';
    } else if (totalScore >= 20) {
      riskLevel = 'MEDIUM';
    }

    const totalSignals = integritySignals.length + (signalCounts['UNUSUAL_TIMING'] || 0);

    return {
      totalSignals,
      riskLevel,
      signalCounts,
      totalScore,
    };
  }

  /**
   * Generates AI-assisted integrity summary using Gemini with fallback
   */
  async generateAIIntegritySummary(examTitle, integritySignals = [], questionTimings = []) {
    const aggregation = this.aggregateSignals(integritySignals, questionTimings);

    const deterministicSummary = this.buildDeterministicSummary(aggregation);
    const deterministicRec =
      aggregation.riskLevel === 'HIGH' || aggregation.riskLevel === 'MEDIUM'
        ? 'Instructor review recommended to verify environmental context.'
        : 'No significant integrity anomalies observed.';

    if (!process.env.GEMINI_API_KEY || integritySignals.length === 0) {
      return {
        ...aggregation,
        aiSummary: deterministicSummary,
        aiRecommendation: deterministicRec,
      };
    }

    try {
      const signalSummaryText = Object.entries(aggregation.signalCounts)
        .map(([key, val]) => `- ${key}: ${val} occurrence(s)`)
        .join('\n');

      const prompt = `You are an academic integrity monitoring assistant for an online LMS.
Analyze the following structured exam monitoring signals for exam "${examTitle}":

SIGNALS RECORDED:
${signalSummaryText}

TOTAL SIGNALS: ${aggregation.totalSignals}
DETERMINISTIC RISK LEVEL: ${aggregation.riskLevel}

IMPORTANT RULES:
1. Be strictly neutral, analytical, and concise (2-3 sentences).
2. NEVER use phrases like "Student cheated", "Malicious intent", or "Definite dishonesty".
3. Frame signals as indicators for instructor review, acknowledging potential technical/environmental explanations.
4. Output MUST be a valid JSON object with keys "summary" and "recommendation".

Example JSON format:
{
  "summary": "During the attempt, 2 tab switches and 1 camera face absence were recorded.",
  "recommendation": "Instructor review recommended to verify context."
}`;

      if (geminiService.genAI) {
        const model = geminiService.genAI.getGenerativeModel({
          model: process.env.GEMINI_GENERATION_MODEL || 'gemini-3.5-flash-lite',
        });
        const result = await model.generateContent(prompt);
        const responseText = result.response.text();
        const jsonText = geminiService.cleanJsonOutput(responseText);
        const parsed = JSON.parse(jsonText);

        if (parsed && parsed.summary) {
          return {
            ...aggregation,
            aiSummary: parsed.summary,
            aiRecommendation: parsed.recommendation || deterministicRec,
          };
        }
      }
    } catch (err) {
      console.warn('[AI_INTEGRITY_SUMMARY_FALLBACK]', err.message);
    }

    return {
      ...aggregation,
      aiSummary: deterministicSummary,
      aiRecommendation: deterministicRec,
    };
  }

  buildDeterministicSummary(aggregation) {
    if (aggregation.totalSignals === 0) {
      return 'The attempt was completed with zero integrity signals recorded.';
    }

    const countsArr = Object.entries(aggregation.signalCounts)
      .map(([type, count]) => `${count} ${type.toLowerCase().replace(/_/g, ' ')}`)
      .join(', ');

    return `Attempt recorded ${aggregation.totalSignals} integrity signal(s) (${countsArr}). Risk level is assessed as ${aggregation.riskLevel}. Signals are indicators for instructor review and are not automatic proof of misconduct.`;
  }
}

module.exports = new IntegrityService();
