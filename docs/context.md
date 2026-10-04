# ExamForge Project Context

## 1. Project Overview
ExamForge is an enterprise-grade, AI-assisted assessment platform designed for educational institutions. It unifies and automates the end-to-end examination lifecycle:
- Approved course material ingestion via Retrieval-Augmented Generation (RAG)
- AI-assisted draft question generation with mandatory instructor review ("Human-in-the-Loop")
- Question bank management with versioning, duplication detection, and tagging
- Smart blueprint-driven or manual exam creation
- Secure, server-authoritative timed examination delivery with continuous autosave
- Instant objective grading and rubric-assisted subjective grading with instructor override
- Signal-based academic integrity and similarity monitoring (non-punitive AI)
- Deep performance analytics, learning gap detection, and personalized study recommendations

## 2. Product Goals
- **G1: Reduce Instructor Effort** — Automatically generate high-quality draft assessment questions from uploaded, approved course materials.
- **G2: Improve Assessment Quality** — Enforce blueprint balances (difficulty distributions, topic coverage) and automated validation.
- **G3: Deliver Secure Exams** — Provide server-controlled timing, real-time autosave, randomized question/option ordering, and non-intrusive integrity signals.
- **G4: Improve Grading Efficiency** — Instantly grade objective questions and offer AI rubric recommendations for subjective evaluations.
- **G5: Create Actionable Analytics** — Deliver multidimensional insights across questions, topics, students, and examinations.
- **G6: Close the Learning Loop** — Map performance gaps directly to targeted revision topics and practice questions.
- **G7: Support Production Scale** — Utilize microservice architecture, containerization, distributed caching, cloud storage, CI/CD, and full observability.

## 3. User Roles
- **Super Admin**: Platform-wide administration, managing institutions, monitoring platform health, inspecting audit logs, and configuring global system parameters.
- **Institution Admin**: Manages institution-specific users (instructors, students), departments, courses, and institution-level performance and compliance reporting.
- **Instructor**: Creates courses, uploads approved course materials, triggers and reviews AI question generation, manages question banks, creates and schedules exams, evaluates subjective responses, and analyzes student performance.
- **Student**: Enrolls in courses, takes timed online exams, receives real-time progress and submission confirmations, views graded results, and accesses personalized revision insights.

## 4. Technology Stack
- **Frontend**: React (Single Page Application, responsive, modern component architecture)
- **Backend API**: Node.js + Express (RESTful APIs, JWT/RBAC middleware, WebSocket server)
- **Database**: MongoDB (Mongoose ODM, document storage for structured application data)
- **AI Service**: Python FastAPI (Asynchronous microservice for heavy AI/ML workflows)
- **AI/ML Frameworks**: Gemini API (Generative reasoning & drafting), LangChain (RAG orchestration & context retrieval), Hugging Face (Embeddings, NLP, and vision models)
- **Cache & Real-time**: Redis (Distributed caching, rate limiting, transient exam session state)
- **WebSocket**: Socket.IO (Bidirectional real-time exam state, warnings, and proctoring event streaming)
- **Object Storage**: AWS S3 (Private storage for course PDFs/DOCs, generated exports, and static assets)
- **Containerization & Deployment**: Docker, Docker Compose, AWS ECS (Elastic Container Service), GitHub Actions (CI/CD)
- **Observability**: Prometheus (Metrics collection) & Grafana (Visualization dashboards)
- **Authentication**: JWT (JSON Web Tokens with short-lived access and refresh tokens), Role-Based Access Control (RBAC)

## 5. System Architecture
```
React Web Client
        ↓ (HTTPS REST / WebSocket WSS)
Node.js + Express API
   ├── MongoDB (Users, Courses, Questions, Exams, Attempts, Logs)
   ├── Redis (Cache, Rate Limiting, Active Session State)
   └── AWS S3 (Course Materials, Reports)
        ↓ (Internal HTTP RPC)
Python FastAPI AI Service
   ├── LangChain (RAG & Vector Retrieval Orchestration)
   ├── Gemini API (Question Generation & Evaluation)
   └── Hugging Face Models (Embeddings & Semantic Similarity)
```

### Component Responsibilities:
- **React Client**: Renders role-authenticated user interfaces, client-side route guards, real-time exam timer UI, live proctoring signal emission, and interactive analytics.
- **Node.js/Express Server**: Central API gateway handling Authentication, Authorization (RBAC), Course Management, Question Bank, Exam Engine, Grading workflows, Audit Logging, and Socket.IO real-time events.
- **MongoDB**: Primary persistent datastore holding relational and document entities (Users, Courses, Material metadata, Questions, Exams, Attempts, Integrity Events, Audit Logs).
- **Redis**: Low-latency memory store for session tokens, active exam attempt locks, rate-limiting counters, and real-time Socket.IO adapter state.
- **Python FastAPI Service**: Isolated microservice handling document chunking, vector indexing, RAG query pipelines, Gemini prompt generation, semantic duplicate check, and rubric grading suggestions.
- **AWS S3**: Private cloud object store holding uploaded course materials (PDF, DOCX, PPTX), generated PDF reports, and export files with presigned access URL generation.
- **Docker / AWS ECS**: Container orchestration providing isolated execution environments for Node.js API and FastAPI AI service.
- **Prometheus & Grafana**: System observability pipeline monitoring request latencies, system errors, AI throughput, Redis memory, and database connections.

## 6. Core Modules
1. **Authentication & Account Management**: Registration, Login, JWT access/refresh token rotation, Password reset, User profile, Theme persistence.
2. **RBAC & Authorization**: Server-side role enforcement (Super Admin, Institution Admin, Instructor, Student) and context-level data isolation.
3. **Institution & Course Management**: Institution hierarchy, department mapping, course assignment, student enrollment, and course material management.
4. **Course Material & RAG Ingestion**: Upload, storage, text extraction, semantic chunking, vector indexing, and processing status tracking.
5. **AI Question Generation Studio**: RAG-assisted question drafting from course material, difficulty estimation, duplicate detection, and instructor review/approval pipeline.
6. **Question Bank Management**: Centralized repository supporting MCQ, Multi-Select, True/False, Short Answer, Descriptive, Numerical question types with tagging, filtering, and version history.
7. **Exam Management & Blueprint Engine**: Exam scheduling, manual question selection or smart blueprint generation, question/option randomization, and publication state machine.
8. **Student Examination Engine**: Secure test runner, pre-exam readiness check, server-authoritative timer, real-time autosave, mark for review, reconnection handling, and auto-submission.
9. **Grading & Evaluation Engine**: Instant objective auto-grading, rubric-assisted subjective evaluation with AI suggestions, instructor score override, and grade locking.
10. **Academic Integrity & Proctoring**: Event signal emission (tab switch, fullscreen exit, copy-paste, timing anomaly, semantic answer similarity) and instructor review panel.
11. **Student Analytics & Learning Recommendations**: Individual performance reports, topic-wise mastery tracking, learning gap identification, and AI-recommended study items.
12. **Instructor & Exam Analytics**: Aggregated class metrics, score distribution charts, question-wise correctness analysis, and exportable summary reports.
13. **Notification Engine**: Multi-channel alerts for upcoming exams, published results, high-severity integrity warnings, and AI job completions.
14. **Audit Logging & Security Compliance**: Immutable tracking of sensitive system actions (grading overrides, exam publication, user permissions).
15. **Reporting & Data Export**: Exporting exam results, roster reports, and integrity summaries into CSV, XLSX, and PDF formats.
16. **DevOps & Infrastructure**: Docker container management, environment configuration, CI/CD pipeline definition, and deployment scripts.
17. **Observability & Health Monitoring**: Application health check endpoints, Prometheus metric scrapers, and Grafana dashboard configurations.

## 7. Database Context (MongoDB Collections)
Strictly conforming to the SRS specifications, the system utilizes the following 12 MongoDB collections:
1. **User**: `_id`, `name`, `email`, `passwordHash`, `role`, `institutionId`, `status`, `preferences`, `createdAt`
2. **Institution**: `_id`, `name`, `code`, `departments`, `settings`, `status`
3. **Course**: `_id`, `institutionId`, `name`, `code`, `instructorIds`, `studentIds`, `status`
4. **Material**: `_id`, `courseId`, `fileKey`, `fileName`, `version`, `processingStatus`, `metadata`
5. **Question**: `_id`, `courseId`, `type`, `text`, `options`, `answer`, `explanation`, `topic`, `difficulty`, `sourceRefs`, `status`, `version`
6. **Exam**: `_id`, `courseId`, `title`, `duration`, `schedule`, `blueprint`, `questionIds`, `settings`, `status`
7. **Attempt**: `_id`, `examId`, `studentId`, `startedAt`, `submittedAt`, `status`, `answers`, `score`
8. **IntegrityEvent**: `_id`, `attemptId`, `type`, `timestamp`, `metadata`, `severity`
9. **SimilarityReport**: `_id`, `attemptId`, `comparedAttemptId`, `questionId`, `score`, `status`
10. **AIJob**: `_id`, `type`, `inputRef`, `status`, `outputRef`, `model`, `tokens`, `createdAt`
11. **AuditLog**: `_id`, `actorId`, `action`, `resourceType`, `resourceId`, `metadata`, `timestamp`
12. **Notification**: `_id`, `userId`, `type`, `title`, `message`, `readAt`, `createdAt`

## 8. API Context
The platform implements RESTful API routes under `/api`:
- **Auth**: `POST /api/auth/login`, `POST /api/auth/refresh`
- **Users**: `GET /api/users/me`
- **Courses & Materials**: `GET /api/courses`, `POST /api/materials`
- **AI Service**: `POST /api/ai/questions/generate`
- **Question Bank**: `POST /api/questions`, `GET /api/questions`, `PATCH /api/questions/:id`
- **Exam Management**: `POST /api/exams`, `POST /api/exams/:id/publish`, `GET /api/exams/:id`
- **Student Exam Execution**: `POST /api/exams/:id/attempts`, `PATCH /api/attempts/:id/answers`, `POST /api/attempts/:id/submit`
- **Results & Analytics**: `GET /api/results/:attemptId`, `GET /api/analytics/exams/:id`
- **Integrity & Proctoring**: `GET /api/integrity/exams/:id`

## 9. WebSocket Context (Socket.IO Events)
Real-time bidirectional event contracts:
- `exam:join` (Client → Server): Student joins an active exam channel.
- `exam:state` (Server → Client): Synchronizes exam metadata, server clock offset, and attempt status.
- `answer:saved` (Client → Server): Asynchronous notification of client-side answer state save.
- `attempt:updated` (Server → Instructor): Broadcasts progress updates to the live instructor monitoring view.
- `integrity:event` (Client → Server): Sends monitored browser focus/visibility events.
- `timer:warning` (Server → Client): Emits server-driven time remaining warnings (e.g., 5 min remaining).
- `attempt:autoSubmitted` (Server → Client): Forces exam submission when server deadline expires.

## 10. Security Context
- **Password Hashing**: Modern Argon2 / bcrypt hashing with unique per-user salt.
- **Tokens & Session Management**: Short-lived JWT access tokens + HTTP-only secure refresh tokens stored in Redis.
- **Role-Based Access Control**: Strict RBAC middleware enforced on all protected backend API routes.
- **Input Sanitization & Validation**: Request schema validation (Joi/Zod) preventing XSS, SQL/NoSQL injection.
- **Rate Limiting**: Express rate limiting on auth, AI generation, and submit endpoints.
- **CORS & Headers**: Strict CORS origin whitelisting, Helmet.js header protection.
- **Cloud File Storage Security**: Private S3 buckets with time-limited presigned URLs.
- **Server-Authoritative Exam Timing**: Exam duration and end-timestamp calculated and enforced exclusively by backend server clocks.
- **Submission Idempotency**: Cryptographic attempt tokens preventing double submissions or duplicate answer records.
- **Answer Key Protection**: Correct answer payload stripped from student client API responses prior to result publication.
- **Audit Logging**: Mandatory immutable logging of admin, publishing, and grading override actions.

## 11. AI Guardrails & Human-in-the-Loop Rules
- **Draft Status Mandatory**: All AI-generated questions enter a `DRAFT` state and cannot be added to an exam without explicit instructor approval.
- **Source Material Attribution**: AI-generated questions retain source metadata (file key, chunk ID, page number) for instructor verification.
- **Validation Rules**: Automated structural checks for complete options, correct answer presence, and answer key consistency before presenting to instructor.
- **Instructor Override**: Instructor maintains full right to edit, modify score allocations, or override AI-assisted subjective grading suggestions.
- **Non-Punitive Proctoring**: AI proctoring signals generate objective evidence items for human review; automatic cheating convictions are strictly forbidden.

## 12. Non-Functional Requirements
- **Performance**: API responses <500ms for standard CRUD; AI pipelines executed asynchronously with real-time status updates.
- **Availability**: High-availability design ensuring backend redeployments do not disrupt active exam sessions.
- **Scalability**: Stateless Express nodes scaling horizontally behind load balancers with Redis shared session storage.
- **Reliability**: Fault-tolerant continuous autosave preserving student work against network interruptions.
- **Accessibility**: WCAG 2.1 AA compliance with keyboard navigation, visible focus indicators, readable contrast ratios, and ARIA labels.
- **Responsiveness**: Fluid layout support for Desktop, Tablet, and Mobile viewport sizes.
- **Maintainability**: Clean layered architecture separating Controllers, Services, Repositories, and Validators.
- **Observability**: Prometheus metrics exposure (`/metrics`) and structured JSON logging.

## 13. UI Implementation Directive
> **Reference UI board is the visual source of truth for future frontend implementation.**
> The visual layout, color scheme (indigo/purple primary, blue secondary), spacing system, and dashboard structure are reserved for the subsequent frontend implementation phase and MUST NOT be built during project setup.
