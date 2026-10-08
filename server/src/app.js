const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const config = require('./config/env');
const healthRoutes = require('./routes/health.routes');
const authRoutes = require('./routes/auth.routes');
const institutionRoutes = require('./routes/institution.routes');
const courseRoutes = require('./routes/course.routes');
const materialRoutes = require('./routes/material.routes');
const standaloneMaterialRoutes = require('./routes/standaloneMaterial.routes');
const aiCourseRoutes = require('./routes/aiCourse.routes');
const aiQuestionRoutes = require('./routes/aiQuestion.routes');
const userRoutes = require('./routes/user.routes');
const auditRoutes = require('./routes/audit.routes');
const examRoutes = require('./routes/exam.routes');
const folderRoutes = require('./routes/folder.routes');
const courseFolderRoutes = require('./routes/courseFolder.routes');
const studyPlanRoutes = require('./routes/studyPlan.routes');
const aiPreparationRoutes = require('./routes/aiPreparation.routes');
const examMonitoringRoutes = require('./routes/examMonitoring.routes');
const reportRoutes = require('./routes/report.routes');
const { notFoundHandler, errorHandler } = require('./middleware/error.middleware');

const app = express();

// Security Middlewares
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || config.env === 'development') {
        return callback(null, true);
      }
      if (origin === config.clientUrl) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Request Parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// API Route Bindings
app.use('/api/v1/health', healthRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/institutions', institutionRoutes);
app.use('/api/v1/courses', courseRoutes);
app.use('/api/v1/courses/:courseId/materials', materialRoutes);
app.use('/api/v1/courses/:courseId/folders', courseFolderRoutes);
app.use('/api/v1/folders', folderRoutes);
app.use('/api/v1/materials', standaloneMaterialRoutes);
app.use('/api/v1/courses/:courseId/ai', aiCourseRoutes);
app.use('/api/v1/ai/questions', aiQuestionRoutes);
app.use('/api/v1/questions', aiQuestionRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/admin', auditRoutes);
app.use('/api/v1/exams', examRoutes);
app.use('/api/v1/exam-monitoring', examMonitoringRoutes);
app.use('/api/v1/reports', reportRoutes);
app.use('/api/v1/study-plan', studyPlanRoutes);
app.use('/api/v1/ai-preparation', aiPreparationRoutes);

// Error Handling Middlewares
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
