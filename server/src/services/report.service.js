const mongoose = require('mongoose');
const Exam = require('../models/Exam');
const ExamAttempt = require('../models/ExamAttempt');
const Course = require('../models/Course');
const User = require('../models/User');
const Question = require('../models/Question');
const auditService = require('./audit.service');
const integrityService = require('./integrity.service');
const { ROLES } = require('../constants/roles');

class ReportService {
  /**
   * Helper to calculate letter grade from percentage
   */
  calculateGrade(percentage) {
    if (percentage >= 90) return 'A+';
    if (percentage >= 80) return 'A';
    if (percentage >= 70) return 'B';
    if (percentage >= 60) return 'C';
    if (percentage >= 50) return 'D';
    return 'F';
  }

  /**
   * Validate user role & access to course/exam resources
   */
  async getAuthorizedCourseIds(user) {
    if (user.role === ROLES.STUDENT) {
      const error = new Error('Access denied. Students are not authorized to view reports.');
      error.statusCode = 403;
      throw error;
    }

    let query = {};
    if (user.role === ROLES.INSTRUCTOR) {
      query.instructorIds = user._id;
    } else if (user.role === ROLES.INSTITUTION_ADMIN) {
      if (user.institutionId) {
        query.institutionId = user.institutionId;
      }
    }

    const courses = await Course.find(query)
      .populate('studentIds', 'name email rollNumber')
      .select('_id name code department studentIds institutionId');

    return {
      courses,
      courseIds: courses.map((c) => c._id),
    };
  }

  /**
   * Generate report data based on parameters
   */
  async generateReport(user, filters = {}) {
    const { courses, courseIds } = await this.getAuthorizedCourseIds(user);

    const reportType = (filters.reportType || filters.type || 'EXAM_RESULT').toUpperCase();
    const selectedCourseId = filters.courseId || null;
    const selectedExamId = filters.examId || null;
    const selectedStudentId = filters.studentId || null;
    const fromDate = filters.fromDate ? new Date(filters.fromDate) : null;
    const toDate = filters.toDate ? new Date(filters.toDate) : null;

    // Filter courses based on user selection
    let activeCourseIds = courseIds;
    if (selectedCourseId) {
      const isAuthorized = courseIds.some((id) => id.toString() === selectedCourseId.toString());
      if (!isAuthorized) {
        const error = new Error('Access denied. You do not have access to this course.');
        error.statusCode = 403;
        throw error;
      }
      activeCourseIds = [new mongoose.Types.ObjectId(selectedCourseId)];
    }

    // Build Exam Query
    const examQuery = { courseId: { $in: activeCourseIds } };
    if (selectedExamId) {
      examQuery._id = selectedExamId;
    }
    const exams = await Exam.find(examQuery)
      .populate('courseId', 'code name studentIds')
      .populate('questionIds')
      .lean();

    const activeExamIds = exams.map((e) => e._id);

    // Build Attempt Query
    const attemptQuery = {
      courseId: { $in: activeCourseIds },
      status: { $in: ['SUBMITTED', 'GRADED', 'PUBLISHED', 'IN_PROGRESS'] },
    };
    if (activeExamIds.length > 0) {
      attemptQuery.examId = { $in: activeExamIds };
    } else if (selectedExamId) {
      attemptQuery.examId = selectedExamId;
    }
    if (selectedStudentId) {
      attemptQuery.studentId = selectedStudentId;
    }
    if (fromDate || toDate) {
      attemptQuery.createdAt = {};
      if (fromDate) attemptQuery.createdAt.$gte = fromDate;
      if (toDate) attemptQuery.createdAt.$lte = toDate;
    }

    const attempts = await ExamAttempt.find(attemptQuery)
      .populate('studentId', 'name email rollNumber')
      .populate('examId', 'title durationMinutes passingPercentage totalMarks scheduledDate questionIds')
      .populate('courseId', 'code name studentIds')
      .populate('answers.questionId', 'questionText type difficulty points options')
      .lean();

    // Students options list for filter dropdowns
    const enrolledStudentMap = {};
    courses.forEach((c) => {
      if (!selectedCourseId || c._id.toString() === selectedCourseId.toString()) {
        (c.studentIds || []).forEach((s) => {
          if (s && s._id) {
            enrolledStudentMap[s._id.toString()] = {
              _id: s._id,
              name: s.name,
              email: s.email,
              rollNumber: s.rollNumber || 'N/A',
            };
          }
        });
      }
    });
    const students = Object.values(enrolledStudentMap);

    let result = {
      reportType,
      summary: {},
      columns: [],
      rows: [],
      courses: courses.map((c) => ({ _id: c._id, name: c.name, code: c.code })),
      exams: exams.map((e) => ({ _id: e._id, title: e.title, courseId: e.courseId?._id || e.courseId })),
      students,
      generatedAt: new Date().toISOString(),
    };

    switch (reportType) {
      case 'EXAM_RESULT':
      case 'EXAM_PERFORMANCE':
        result = { ...result, ...(await this.getExamResultReport(courses, exams, attempts, filters)) };
        break;

      case 'STUDENT_PERFORMANCE':
        result = { ...result, ...(await this.getStudentPerformanceReport(courses, exams, attempts, filters)) };
        break;

      case 'QUESTION_ANALYSIS':
        result = { ...result, ...(await this.getQuestionAnalysisReport(courses, exams, attempts, filters)) };
        break;

      case 'COURSE_PERFORMANCE':
        result = { ...result, ...(await this.getCoursePerformanceReport(courses, exams, attempts, filters)) };
        break;

      case 'ACADEMIC_INTEGRITY':
      case 'INTEGRITY':
        result = { ...result, ...(await this.getAcademicIntegrityReport(courses, exams, attempts, filters)) };
        break;

      default:
        result = { ...result, ...(await this.getExamResultReport(courses, exams, attempts, filters)) };
        break;
    }

    // Log Audit Event
    await auditService.logAudit({
      user,
      action: 'REPORT_GENERATED',
      resourceType: 'REPORT',
      resourceId: reportType,
      resourceName: `${reportType} Report`,
      courseId: selectedCourseId || (courseIds.length > 0 ? courseIds[0] : null),
      metadata: { reportType, selectedCourseId, selectedExamId, rowsCount: result.rows.length },
    });

    return result;
  }

  /**
   * 1. EXAM RESULT REPORT
   */
  async getExamResultReport(courses, exams, attempts, filters) {
    const selectedExam = exams.length === 1 ? exams[0] : null;

    // Enrolled students calculation
    let enrolledStudents = 0;
    if (selectedExam && selectedExam.courseId) {
      enrolledStudents = selectedExam.courseId.studentIds?.length || 0;
    } else {
      const studentSet = new Set();
      courses.forEach((c) => (c.studentIds || []).forEach((s) => studentSet.add(s._id?.toString() || s.toString())));
      enrolledStudents = studentSet.size;
    }

    const completedAttempts = attempts.filter((a) => ['SUBMITTED', 'GRADED', 'PUBLISHED'].includes(a.status));
    const appearedStudentsCount = new Set(attempts.map((a) => a.studentId?._id?.toString() || a.studentId?.toString())).size;
    const completedStudentsCount = new Set(completedAttempts.map((a) => a.studentId?._id?.toString() || a.studentId?.toString())).size;
    const absentCount = Math.max(0, enrolledStudents - appearedStudentsCount);

    const scores = completedAttempts.map((a) => a.percentage || 0);
    const avgScore = scores.length > 0 ? parseFloat((scores.reduce((sum, s) => sum + s, 0) / scores.length).toFixed(1)) : 0;
    const highestScore = scores.length > 0 ? Math.max(...scores) : 0;
    const lowestScore = scores.length > 0 ? Math.min(...scores) : 0;

    const passCount = completedAttempts.filter((a) => a.passed).length;
    const failCount = completedAttempts.length - passCount;
    const passRate = completedAttempts.length > 0 ? Math.round((passCount / completedAttempts.length) * 100) : 0;

    const summary = {
      examTitle: selectedExam ? selectedExam.title : 'All Exams',
      courseCode: selectedExam?.courseId?.code || (courses.length === 1 ? courses[0].code : 'Multiple Courses'),
      examDate: selectedExam?.scheduledDate ? new Date(selectedExam.scheduledDate).toLocaleDateString() : 'N/A',
      totalStudents: enrolledStudents,
      appeared: appearedStudentsCount,
      completed: completedStudentsCount,
      absent: absentCount,
      averageScore: `${avgScore}%`,
      highestScore: `${highestScore}%`,
      lowestScore: `${lowestScore}%`,
      passCount,
      failCount,
      passRate: `${passRate}%`,
    };

    const columns = [
      { key: 'studentName', label: 'Student Name' },
      { key: 'rollNumber', label: 'Roll Number' },
      { key: 'email', label: 'Email' },
      { key: 'examTitle', label: 'Exam' },
      { key: 'score', label: 'Score' },
      { key: 'percentage', label: 'Percentage' },
      { key: 'grade', label: 'Grade' },
      { key: 'status', label: 'Status' },
      { key: 'submissionTime', label: 'Submission Time' },
    ];

    const rows = attempts.map((att) => {
      const student = att.studentId || {};
      const percentage = att.percentage !== undefined ? att.percentage : 0;
      const grade = this.calculateGrade(percentage);
      const isPassed = att.passed !== undefined ? att.passed : percentage >= (att.examId?.passingPercentage || 40);

      return {
        studentName: student.name || 'Unknown Student',
        rollNumber: student.rollNumber || 'N/A',
        email: student.email || 'N/A',
        examTitle: att.examId?.title || 'Exam',
        score: `${att.totalScore || 0} / ${att.examId?.totalMarks || 100}`,
        percentage: `${percentage}%`,
        grade,
        status: isPassed ? 'PASS' : 'FAIL',
        submissionTime: att.submittedAt ? new Date(att.submittedAt).toLocaleString() : 'In Progress / Not Submitted',
      };
    });

    return { summary, columns, rows };
  }

  /**
   * 2. STUDENT PERFORMANCE REPORT
   */
  async getStudentPerformanceReport(courses, exams, attempts, filters) {
    const columns = [
      { key: 'studentName', label: 'Student Name' },
      { key: 'rollNumber', label: 'Roll Number' },
      { key: 'course', label: 'Course' },
      { key: 'exam', label: 'Exam' },
      { key: 'totalQuestions', label: 'Total Questions' },
      { key: 'attempted', label: 'Attempted' },
      { key: 'correct', label: 'Correct' },
      { key: 'incorrect', label: 'Incorrect' },
      { key: 'skipped', label: 'Skipped' },
      { key: 'totalMarks', label: 'Total Marks' },
      { key: 'obtainedMarks', label: 'Obtained Marks' },
      { key: 'percentage', label: 'Percentage' },
      { key: 'grade', label: 'Grade' },
      { key: 'status', label: 'Pass/Fail' },
      { key: 'startTime', label: 'Start Time' },
      { key: 'submissionTime', label: 'Submission Time' },
      { key: 'timeTaken', label: 'Time Taken' },
    ];

    const rows = attempts.map((att) => {
      const student = att.studentId || {};
      const course = att.courseId || {};
      const exam = att.examId || {};
      const answers = att.answers || [];

      const totalQuestions = att.questionIds?.length || answers.length || exam.questionIds?.length || 0;
      let correct = 0;
      let incorrect = 0;
      let attemptedCount = 0;

      answers.forEach((ans) => {
        if (ans.selectedOption || ans.textAnswer) {
          attemptedCount++;
          if (ans.isCorrect) correct++;
          else incorrect++;
        }
      });

      const skipped = Math.max(0, totalQuestions - attemptedCount);
      const percentage = att.percentage || 0;
      const grade = this.calculateGrade(percentage);
      const isPassed = att.passed !== undefined ? att.passed : percentage >= (exam.passingPercentage || 40);

      // Time taken calculation
      let timeTaken = 'N/A';
      if (att.startedAt && att.submittedAt) {
        const diffMs = new Date(att.submittedAt) - new Date(att.startedAt);
        const mins = Math.floor(diffMs / 60000);
        const secs = Math.floor((diffMs % 60000) / 1000);
        timeTaken = `${mins}m ${secs}s`;
      }

      return {
        studentName: student.name || 'Unknown Student',
        rollNumber: student.rollNumber || 'N/A',
        course: `${course.code || ''} ${course.name || ''}`.trim() || 'N/A',
        exam: exam.title || 'Exam',
        totalQuestions,
        attempted: attemptedCount,
        correct,
        incorrect,
        skipped,
        totalMarks: exam.totalMarks || 100,
        obtainedMarks: att.totalScore || 0,
        percentage: `${percentage}%`,
        grade,
        status: isPassed ? 'PASS' : 'FAIL',
        startTime: att.startedAt ? new Date(att.startedAt).toLocaleString() : 'N/A',
        submissionTime: att.submittedAt ? new Date(att.submittedAt).toLocaleString() : 'N/A',
        timeTaken,
      };
    });

    const summary = {
      totalAttempts: attempts.length,
      averagePercentage: `${attempts.length > 0 ? (attempts.reduce((a, b) => a + (b.percentage || 0), 0) / attempts.length).toFixed(1) : 0}%`,
      passRate: `${attempts.length > 0 ? Math.round((attempts.filter((a) => a.passed).length / attempts.length) * 100) : 0}%`,
    };

    return { summary, columns, rows };
  }

  /**
   * 3. QUESTION ANALYSIS REPORT
   */
  async getQuestionAnalysisReport(courses, exams, attempts, filters) {
    const questionStatsMap = {};

    // Collect questions from exams
    exams.forEach((exam) => {
      (exam.questionIds || []).forEach((q, idx) => {
        if (!q || !q._id) return;
        const qId = q._id.toString();
        if (!questionStatsMap[qId]) {
          questionStatsMap[qId] = {
            questionNo: idx + 1,
            questionText: q.questionText || 'Question',
            type: q.type || 'MCQ',
            difficulty: q.difficulty || 'MEDIUM',
            marks: q.points || 1,
            attempted: 0,
            correct: 0,
            incorrect: 0,
            skipped: 0,
            totalTimeSeconds: 0,
            timingResponsesCount: 0,
          };
        }
      });
    });

    // Accumulate answer stats from attempts
    attempts.forEach((att) => {
      const answersMap = {};
      (att.answers || []).forEach((ans) => {
        if (ans.questionId) {
          const qId = (ans.questionId._id || ans.questionId).toString();
          answersMap[qId] = ans;
        }
      });

      // Question timings map
      const timingsMap = {};
      (att.questionTimings || []).forEach((t) => {
        if (t.questionId) {
          const qId = (t.questionId._id || t.questionId).toString();
          timingsMap[qId] = t.timeSpentSeconds || 0;
        }
      });

      Object.keys(questionStatsMap).forEach((qId) => {
        const stat = questionStatsMap[qId];
        const ans = answersMap[qId];

        if (ans && (ans.selectedOption || ans.textAnswer)) {
          stat.attempted++;
          if (ans.isCorrect) stat.correct++;
          else stat.incorrect++;
        } else {
          stat.skipped++;
        }

        if (timingsMap[qId] !== undefined && timingsMap[qId] > 0) {
          stat.totalTimeSeconds += timingsMap[qId];
          stat.timingResponsesCount++;
        }
      });
    });

    const columns = [
      { key: 'questionNo', label: 'Question No.' },
      { key: 'questionText', label: 'Question' },
      { key: 'type', label: 'Question Type' },
      { key: 'difficulty', label: 'Difficulty' },
      { key: 'marks', label: 'Marks' },
      { key: 'attempted', label: 'Attempted' },
      { key: 'correct', label: 'Correct' },
      { key: 'incorrect', label: 'Incorrect' },
      { key: 'skipped', label: 'Skipped' },
      { key: 'correctPct', label: 'Correct %' },
      { key: 'averageTime', label: 'Average Time' },
    ];

    const rows = Object.values(questionStatsMap).map((q, index) => {
      const correctPct = q.attempted > 0 ? Math.round((q.correct / q.attempted) * 100) : 0;
      let averageTime = 'N/A / Not Available';
      if (q.timingResponsesCount > 0) {
        const avgSecs = Math.round(q.totalTimeSeconds / q.timingResponsesCount);
        averageTime = `${avgSecs}s`;
      }

      return {
        questionNo: index + 1,
        questionText: q.questionText,
        type: q.type,
        difficulty: q.difficulty,
        marks: q.marks,
        attempted: q.attempted,
        correct: q.correct,
        incorrect: q.incorrect,
        skipped: q.skipped,
        correctPct: `${correctPct}%`,
        averageTime,
      };
    });

    const summary = {
      totalQuestionsAnalyzed: rows.length,
      averageCorrectPct: `${rows.length > 0 ? (rows.reduce((a, b) => a + parseInt(b.correctPct, 10), 0) / rows.length).toFixed(1) : 0}%`,
    };

    return { summary, columns, rows };
  }

  /**
   * 4. COURSE PERFORMANCE REPORT
   */
  async getCoursePerformanceReport(courses, exams, attempts, filters) {
    const courseStatsList = courses.map((course) => {
      const courseExams = exams.filter((e) => (e.courseId?._id || e.courseId).toString() === course._id.toString());
      const courseAttempts = attempts.filter((a) => (a.courseId?._id || a.courseId).toString() === course._id.toString());

      const enrolledStudents = course.studentIds?.length || 0;
      const appearedStudentIds = new Set(courseAttempts.map((a) => (a.studentId?._id || a.studentId).toString()));
      const scores = courseAttempts.map((a) => a.percentage || 0);

      const avgScore = scores.length > 0 ? parseFloat((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1)) : 0;
      const passCount = courseAttempts.filter((a) => a.passed).length;
      const passRate = courseAttempts.length > 0 ? Math.round((passCount / courseAttempts.length) * 100) : 0;
      const highestScore = scores.length > 0 ? Math.max(...scores) : 0;
      const lowestScore = scores.length > 0 ? Math.min(...scores) : 0;

      return {
        course: `${course.code} - ${course.name}`,
        totalStudents: enrolledStudents,
        studentsAppeared: appearedStudentIds.size,
        examsConducted: courseExams.length,
        averageScore: `${avgScore}%`,
        passRate: `${passRate}%`,
        highestScore: `${highestScore}%`,
        lowestScore: `${lowestScore}%`,
      };
    });

    const columns = [
      { key: 'course', label: 'Course' },
      { key: 'totalStudents', label: 'Total Students' },
      { key: 'studentsAppeared', label: 'Students Appeared' },
      { key: 'examsConducted', label: 'Exams Conducted' },
      { key: 'averageScore', label: 'Average Score' },
      { key: 'passRate', label: 'Pass Rate' },
      { key: 'highestScore', label: 'Highest Score' },
      { key: 'lowestScore', label: 'Lowest Score' },
    ];

    const summary = {
      totalCourses: courses.length,
      totalExams: exams.length,
      overallAverageScore: `${attempts.length > 0 ? (attempts.reduce((a, b) => a + (b.percentage || 0), 0) / attempts.length).toFixed(1) : 0}%`,
    };

    return { summary, columns, rows: courseStatsList };
  }

  /**
   * 5. ACADEMIC INTEGRITY REPORT
   */
  async getAcademicIntegrityReport(courses, exams, attempts, filters) {
    const columns = [
      { key: 'studentName', label: 'Student' },
      { key: 'rollNumber', label: 'Roll Number' },
      { key: 'examTitle', label: 'Exam' },
      { key: 'riskLevel', label: 'Risk Level' },
      { key: 'riskScore', label: 'Risk Score' },
      { key: 'totalSignals', label: 'Total Signals' },
      { key: 'signalBreakdown', label: 'Signal Breakdown' },
      { key: 'timestamp', label: 'Timestamp' },
      { key: 'reviewStatus', label: 'Review Status' },
      { key: 'instructorNote', label: 'Instructor Note' },
    ];

    const rows = attempts.map((att) => {
      const student = att.studentId || {};
      const exam = att.examId || {};
      const signals = att.integritySignals || [];
      const timings = att.questionTimings || [];

      const aggregation = integrityService.aggregateSignals(signals, timings);
      const riskLevelLabel = aggregation.riskLevel === 'HIGH' ? 'High Risk' : aggregation.riskLevel === 'MEDIUM' ? 'Medium Risk' : 'Low Risk';

      // Signal breakdown formatting
      const breakdown = Object.entries(aggregation.signalCounts)
        .map(([k, v]) => `${k.replace(/_/g, ' ')}: ${v}`)
        .join(', ') || 'No signals';

      const reviewStatus = att.integritySummary?.reviewStatus || 'UNREVIEWED';
      const instructorNote = att.integritySummary?.instructorNote || 'N/A';

      return {
        studentName: student.name || 'Unknown Student',
        rollNumber: student.rollNumber || 'N/A',
        examTitle: exam.title || 'Exam',
        riskLevel: riskLevelLabel,
        riskScore: aggregation.totalScore,
        totalSignals: aggregation.totalSignals,
        signalBreakdown: breakdown,
        timestamp: att.submittedAt ? new Date(att.submittedAt).toLocaleString() : new Date(att.startedAt).toLocaleString(),
        reviewStatus,
        instructorNote,
      };
    });

    const highRiskCount = rows.filter((r) => r.riskLevel === 'High Risk').length;
    const medRiskCount = rows.filter((r) => r.riskLevel === 'Medium Risk').length;
    const lowRiskCount = rows.filter((r) => r.riskLevel === 'Low Risk').length;

    const summary = {
      totalMonitoredAttempts: attempts.length,
      highRiskCount,
      mediumRiskCount: medRiskCount,
      lowRiskCount,
    };

    return { summary, columns, rows };
  }

  /**
   * Format & generate file exports (CSV, XLSX, PDF)
   */
  async exportReport(user, filters = {}, res) {
    const report = await this.generateReport(user, filters);
    const format = (filters.format || 'csv').toLowerCase();

    // Log Audit Event
    await auditService.logAudit({
      user,
      action: 'REPORT_EXPORTED',
      resourceType: 'REPORT',
      resourceId: report.reportType,
      resourceName: `${report.reportType} Report Export (${format.toUpperCase()})`,
      courseId: filters.courseId || null,
      metadata: { reportType: report.reportType, format, rowsCount: report.rows.length },
    });

    const filename = `ExamForge_${report.reportType}_${new Date().toISOString().split('T')[0]}`;

    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`);

      const headers = report.columns.map((c) => `"${c.label.replace(/"/g, '""')}"`).join(',');
      const rows = report.rows.map((row) =>
        report.columns
          .map((c) => {
            const val = row[c.key] !== undefined && row[c.key] !== null ? row[c.key] : '';
            return `"${String(val).replace(/"/g, '""')}"`;
          })
          .join(',')
      );

      return res.send([headers, ...rows].join('\n'));
    }

    if (format === 'xlsx' || format === 'excel') {
      // Generate clean XML Spreadsheet (supported natively by Microsoft Excel)
      res.setHeader('Content-Type', 'application/vnd.ms-excel');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}.xls"`);

      let xml = `<?xml version="1.0"?>\n<?mso-application progid="Excel.Sheet"?>\n<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">\n`;

      // Summary Sheet
      xml += `  <Worksheet ss:Name="Summary">\n    <Table>\n`;
      xml += `      <Row><Cell><Data ss:Type="String">Report Type</Data></Cell><Cell><Data ss:Type="String">${report.reportType}</Data></Cell></Row>\n`;
      xml += `      <Row><Cell><Data ss:Type="String">Generated At</Data></Cell><Cell><Data ss:Type="String">${report.generatedAt}</Data></Cell></Row>\n`;
      Object.entries(report.summary || {}).forEach(([k, v]) => {
        xml += `      <Row><Cell><Data ss:Type="String">${k}</Data></Cell><Cell><Data ss:Type="String">${v}</Data></Cell></Row>\n`;
      });
      xml += `    </Table>\n  </Worksheet>\n`;

      // Data Sheet
      xml += `  <Worksheet ss:Name="Report Data">\n    <Table>\n`;
      xml += `      <Row>\n`;
      report.columns.forEach((col) => {
        xml += `        <Cell><Data ss:Type="String">${col.label}</Data></Cell>\n`;
      });
      xml += `      </Row>\n`;

      report.rows.forEach((row) => {
        xml += `      <Row>\n`;
        report.columns.forEach((col) => {
          const val = row[col.key] !== undefined && row[col.key] !== null ? String(row[col.key]) : '';
          xml += `        <Cell><Data ss:Type="String">${val.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</Data></Cell>\n`;
        });
        xml += `      </Row>\n`;
      });

      xml += `    </Table>\n  </Worksheet>\n</Workbook>`;

      return res.send(xml);
    }

    if (format === 'pdf') {
      // Printable HTML formatted document for PDF rendering/download
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Content-Disposition', `inline; filename="${filename}.pdf"`);

      let html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>ExamForge Report - ${report.reportType}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 30px; color: #1e293b; font-size: 12px; }
    .header { border-b: 2px solid #4f46e5; padding-bottom: 12px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; }
    .title { font-size: 20px; font-weight: bold; color: #4f46e5; margin: 0; }
    .subtitle { font-size: 12px; color: #64748b; margin-top: 4px; }
    .summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 20px; }
    .summary-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px; }
    .summary-label { font-size: 10px; color: #64748b; text-transform: uppercase; font-weight: bold; }
    .summary-val { font-size: 14px; font-weight: bold; color: #0f172a; margin-top: 4px; }
    table { width: 100%; border-collapse: collapse; margin-top: 15px; }
    th { background: #f1f5f9; text-align: left; padding: 8px 10px; border-bottom: 2px solid #cbd5e1; font-weight: bold; font-size: 11px; }
    td { padding: 8px 10px; border-bottom: 1px solid #e2e8f0; font-size: 11px; }
    tr:nth-child(even) { background: #f8fafc; }
    .footer { margin-top: 30px; border-t: 1px solid #e2e8f0; padding-top: 10px; text-align: center; font-size: 10px; color: #94a3b8; }
    @media print { body { margin: 0; } }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1 class="title">ExamForge Report</h1>
      <div class="subtitle">${report.reportType.replace(/_/g, ' ')} Report</div>
    </div>
    <div style="text-align: right; font-size: 10px; color: #64748b;">
      <div>Generated: ${new Date(report.generatedAt).toLocaleString()}</div>
    </div>
  </div>

  <div class="summary-grid">`;

      Object.entries(report.summary || {}).forEach(([k, v]) => {
        html += `
    <div class="summary-card">
      <div class="summary-label">${k.replace(/([A-Z])/g, ' $1').trim()}</div>
      <div class="summary-val">${v}</div>
    </div>`;
      });

      html += `
  </div>

  <table>
    <thead>
      <tr>`;
      report.columns.forEach((c) => {
        html += `<th>${c.label}</th>`;
      });
      html += `</tr>
    </thead>
    <tbody>`;

      report.rows.forEach((row) => {
        html += `<tr>`;
        report.columns.forEach((c) => {
          const val = row[c.key] !== undefined && row[c.key] !== null ? String(row[c.key]) : '—';
          html += `<td>${val}</td>`;
        });
        html += `</tr>`;
      });

      html += `
    </tbody>
  </table>

  <div class="footer">
    Generated by ExamForge &bull; Confidential Academic Report
  </div>
</body>
</html>`;

      return res.send(html);
    }

    return res.status(400).json({ success: false, message: 'Invalid export format. Supported formats: csv, xlsx, pdf' });
  }
}

module.exports = new ReportService();
