const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const config = require('../config/env');

let io = null;

/**
 * Initialize Socket.IO server attached to Node HTTP server
 */
function initSocketServer(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST', 'PATCH', 'PUT'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.query?.token;
      if (token) {
        const decoded = jwt.verify(token, config.jwtSecret);
        socket.user = decoded;
      }
    } catch (err) {
      // Allow unauthenticated fallback for development test sockets
    }
    next();
  });

  io.on('connection', (socket) => {
    console.log(`🔌 Socket connected: ${socket.id} (User: ${socket.user?.id || 'Guest'})`);

    // Instructor joins exam monitoring room
    socket.on('join_exam_monitoring', ({ examId }) => {
      if (examId) {
        const roomName = `exam_${examId}`;
        socket.join(roomName);
        console.log(`📡 Socket ${socket.id} joined room ${roomName}`);
      }
    });

    // Instructor leaves exam monitoring room
    socket.on('leave_exam_monitoring', ({ examId }) => {
      if (examId) {
        const roomName = `exam_${examId}`;
        socket.leave(roomName);
        console.log(`📡 Socket ${socket.id} left room ${roomName}`);
      }
    });

    socket.on('disconnect', () => {
      console.log(`🔌 Socket disconnected: ${socket.id}`);
    });
  });

  return io;
}

/**
 * Get Socket.IO instance
 */
function getIO() {
  return io;
}

/**
 * Broadcast real-time monitoring event to instructor exam room
 */
function broadcastMonitoringEvent(examId, eventName, payload) {
  if (io && examId) {
    const roomName = `exam_${examId}`;
    io.to(roomName).emit(eventName, payload);
    // Also broadcast globally to all monitoring rooms if needed
    io.emit('global_monitoring_alert', { examId, ...payload });
  }
}

module.exports = {
  initSocketServer,
  getIO,
  broadcastMonitoringEvent,
};
