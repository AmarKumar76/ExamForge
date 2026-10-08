const app = require('./src/app');
const config = require('./src/config/env');
const { connectDB, disconnectDB } = require('./src/config/db');

let server;

const startServer = async () => {
  try {
    // 1. Connect MongoDB
    await connectDB();

    const PORT = config.port;
    server = app.listen(PORT, '0.0.0.0', () => {
      if (config.env !== 'test') {
        console.log(`🚀 ExamForge API Server running in [${config.env}] mode on port ${PORT}`);
        console.log(`🔗 Health Check: http://localhost:${PORT}/api/v1/health`);
        console.log(`🔐 Auth Endpoints: http://localhost:${PORT}/api/v1/auth`);
      }
    });

    const { initSocketServer } = require('./src/sockets/socket.server');
    initSocketServer(server);

    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} is already in use by another process.`);
        console.error(`👉 Solution: Stop the process using port ${PORT} or change PORT in .env.`);
      } else {
        console.error('❌ Server error:', error.message);
      }
      process.exit(1);
    });

    // Handle Unhandled Rejections & Uncaught Exceptions
    process.on('unhandledRejection', (reason) => {
      console.error('❌ Unhandled Rejection at:', reason);
    });

    process.on('uncaughtException', (error) => {
      console.error('❌ Uncaught Exception thrown:', error);
      gracefulShutdown('uncaughtException');
    });

    // Graceful Shutdown Signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  } catch (error) {
    console.error('❌ Failed to start ExamForge API Server:', error);
    process.exit(1);
  }
};

const gracefulShutdown = async (signal) => {
  console.log(`\n⚠️ ${signal} received. Initiating graceful shutdown...`);
  if (server) {
    server.close(async () => {
      console.log('🛑 HTTP Server closed.');
      await disconnectDB();
      process.exit(0);
    });
  } else {
    await disconnectDB();
    process.exit(0);
  }
};

if (process.env.NODE_ENV !== 'test') {
  startServer();
}

module.exports = app;
