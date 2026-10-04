# ExamForge Backend API Architecture

Node.js + Express API server powering authentication, RBAC, courses, question bank, exam engine, grading, real-time WebSocket communication, and analytics.

## Directory Structure
- `src/config/`: Configuration for MongoDB, Redis, AWS S3, and environment variables
- `src/controllers/`: Route handler controllers executing business operations
- `src/middleware/`: Authentication, RBAC, rate-limiting, error-handling middleware
- `src/models/`: Mongoose schemas matching the 12 SRS database collections
- `src/routes/`: Express REST API route definitions (`/api/auth`, `/api/exams`, etc.)
- `src/services/`: Core business logic service layer
- `src/repositories/`: Data access layer interfacing directly with Mongoose models
- `src/utils/`: Shared utilities (token generators, response formatters, math helpers)
- `src/validators/`: Request validation schemas (Joi/Zod)
- `src/sockets/`: Socket.IO real-time event handlers (`exam:join`, `timer:warning`, etc.)
- `src/app.js`: Express application configuration module
- `server.js`: HTTP server entry point initializing DB connections and Socket.IO
