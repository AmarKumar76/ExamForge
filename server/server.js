/**
 * ExamForge API Server Entrypoint Skeleton
 * 
 * NOTE: Architectural placeholder entrypoint.
 * Server startup, MongoDB connection, Redis initialization, and Socket.IO attachment
 * will be implemented in subsequent module implementation phases.
 */

const app = require('./src/app');

const PORT = process.env.PORT || 5000;

if (process.env.NODE_ENV !== 'test') {
  console.log(`ExamForge API Server initialized. Port configured: ${PORT}`);
}
