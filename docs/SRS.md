
EXAMFORGE
AI-Assisted Assessment Platform
Software Requirements Specification (SRS)

Version 1.0  |  Complete Product & UI Specification

Reference UI board — the implementation should preserve this visual direction, spacing, card hierarchy, sidebar layout, and purple/blue accent system.

Document Control
Item
Value
Project
ExamForge — AI-Assisted Assessment Platform
Project ID
HSB-12
Document
Software Requirements Specification
Version
1.0
Primary UI Direction
Modern SaaS dashboard, clean white cards, indigo/blue accents, responsive layout
Theme
Light mode + Dark mode toggle
Primary Users
Super Admin, Institution Admin, Instructor, Student
Primary Stack
React, Node.js + Express, MongoDB, Python FastAPI, Gemini, Hugging Face, LangChain, Redis, Socket.IO, JWT/RBAC, Docker, GitHub Actions, AWS ECS, S3, Prometheus, Grafana

Table of Contents
1. Introduction
2. Product Vision and Goals
3. Scope
4. User Roles
5. Functional Requirements
6. AI/RAG Requirements
7. Examination Engine Requirements
8. Academic Integrity & Proctoring
9. Grading & Analytics
10. UI/UX Specification
11. Screen-by-Screen UI Requirements
12. System Architecture
13. Data Model
14. API Requirements
15. Security Requirements
16. Non-Functional Requirements
17. Notifications & Reporting
18. DevOps & Deployment
19. Observability
20. Testing & Acceptance Criteria
21. MVP vs Advanced Scope
22. Future Enhancements
23. Resume/GitHub Positioning
1. Introduction
ExamForge is a secure, AI-assisted assessment platform for educational institutions. It manages the complete assessment lifecycle: approved course-material ingestion, AI-assisted question drafting, instructor review, question-bank management, exam creation, timed delivery, automatic and rubric-assisted grading, academic-integrity signals, analytics, reporting, and personalized learning recommendations.
1.1 Problem Statement
Institutions often use separate tools for question preparation, online examinations, grading, proctoring, and performance analysis. This creates manual work, fragmented data, weak visibility into learning gaps, and inconsistent assessment workflows. ExamForge unifies these processes in one role-based platform while keeping instructors in control of AI-generated assessment content.
1.2 Core Principle
AI-generated content is treated as a draft. Instructor approval is required before an AI-generated question can become an official question-bank item or appear in a published examination.
2. Product Vision and Goals
ID
Goal
Description
G1
Reduce instructor effort
Generate high-quality draft questions from approved course material.
G2
Improve assessment quality
Use blueprints, difficulty levels, topic coverage and validation.
G3
Deliver secure exams
Use server-controlled timing, autosave, randomized questions and integrity signals.
G4
Improve grading efficiency
Automatically grade objective answers and assist rubric-based subjective evaluation.
G5
Create actionable analytics
Show question, topic, student and exam-level performance.
G6
Close the learning loop
Recommend revision topics based on student performance.
G7
Support production scale
Use containerization, Redis, cloud object storage, CI/CD and observability.

3. Scope
3.1 In Scope
Multi-role authentication and authorization
Institution/course management
Course-material upload and secure storage
RAG-based AI question generation
Question review, editing, approval and rejection
Question bank with tagging, filtering and versioning
Smart exam blueprint and manual question selection
Timed online examination with autosave
Question/option randomization
Objective auto-grading
Rubric-assisted subjective grading
Real-time exam monitoring
Academic-integrity and plagiarism/similarity signals
Student and instructor analytics
AI-generated learning insights
Reports and exports
Notifications
Audit logs
Dark/light theme
Docker, CI/CD, AWS deployment and monitoring
3.2 Out of Scope for Initial Release
Fully autonomous AI proctoring that declares a student guilty
AI-generated questions published without instructor approval
Automated high-stakes grading without instructor override
Native mobile apps
Payment/subscription billing
Full LMS replacement
4. User Roles
Role
Primary Responsibilities
Super Admin
Global platform control, institutions, system health, users, audit logs.
Institution Admin
Manage institution users, departments, courses and institution-level reports.
Instructor
Create courses, upload materials, generate/review questions, create exams, grade, analyze.
Student
Join courses, take exams, view results, analytics and recommendations.

5. Functional Requirements
5.1 Authentication & Account Management
Register/login with email or institution credentials.
Secure password hashing and validation.
JWT access token with refresh-token mechanism.
Logout and session invalidation.
Forgot/reset password.
Optional email verification.
Profile management and avatar.
Theme preference persisted per user/device.
5.2 RBAC & Authorization
Every protected API must validate identity and role.
Permissions must be enforced server-side, not only in React.
UI navigation must hide actions the user cannot access.
Users must only access exams, courses and results belonging to their authorized institution/context.
Sensitive actions must generate audit-log entries.
5.3 Institution & Course Management
Create/edit/archive institutions.
Create departments and courses.
Assign instructors to courses.
Enroll/remove students.
Upload approved learning material.
Track course material versions and processing status.
5.4 Question Bank
Create questions manually.
Import AI-generated drafts.
Support MCQ, multiple-select, true/false, short answer, descriptive and numerical types.
Store topic, subtopic, difficulty, marks, explanation, source material and status.
Search, filter, sort and paginate questions.
Duplicate/similarity detection.
Question version history.
Approve, reject, edit, archive and reuse questions.
5.5 Exam Management
Create exam title, course, description, duration, marks and instructions.
Schedule start/end date and time.
Choose manual selection or smart blueprint.
Configure difficulty distribution and topic distribution.
Configure negative marking, attempts, navigation and review behavior.
Randomize questions and options.
Publish/unpublish exam.
Preview exam before publication.
5.6 Student Exam
Pre-exam system/instruction check.
Server-authoritative timer.
Question navigation palette.
Answer selection and autosave.
Mark for review.
Connection/reconnect handling.
Automatic submission at deadline.
Manual submission with confirmation.
Submission receipt and timestamp.
5.7 Grading
Instant objective grading.
Configurable marks and negative marks.
Rubric-based subjective grading.
AI-assisted feedback and suggested score.
Instructor override.
Grade finalization and result locking.
5.8 Analytics
Exam-level average, highest, lowest and distribution.
Question-wise correctness and average time.
Topic-wise performance.
Student-level accuracy and time analysis.
Learning-gap identification.
AI-generated study/revision recommendations.
Exportable reports.
6. AI/RAG Requirements
The AI layer will be implemented as a separate Python FastAPI service. LangChain will orchestrate retrieval/generation workflows where useful, Gemini will provide generative reasoning, and Hugging Face models may support embeddings, NLP or vision workloads.
6.1 RAG Pipeline
Instructor uploads approved PDF/DOC/PPT material.
File is stored in private object storage.
Text/content is extracted and normalized.
Content is chunked with metadata such as course, topic, page and source.
Embeddings are generated.
Chunks are indexed in the selected vector-search layer.
Instructor specifies topic, number, type and difficulty.
Retriever selects relevant approved content.
Gemini generates draft questions with source references.
Validation checks structure, answer consistency, difficulty and duplication.
Instructor reviews and approves/rejects/edits.
Approved question is stored in the question bank.
6.2 AI Features
Feature
Requirement
AI Question Generation
Generate draft questions from approved course material.
Difficulty Classification
Estimate Easy/Medium/Hard and allow instructor override.
Duplicate Detection
Use semantic similarity to detect conceptually similar questions.
Subjective Grading Assistance
Compare response against instructor rubric and generate suggested marks/feedback.
Learning Gap Detection
Identify weak topics from exam performance.
Personalized Recommendations
Recommend revision content and practice questions.
Integrity Assistance
Generate similarity/behavior summaries; never make an automatic cheating verdict.

6.3 AI Guardrails
Every generated question must retain source/context metadata where applicable.
AI content must be reviewable before publication.
The system must expose confidence/validation indicators where feasible.
AI must not invent course policy, grading rules or official answers.
Instructor override must always be available for high-impact grading.
Proctoring signals are evidence for review, not automatic proof of misconduct.
7. Examination Engine Requirements
Requirement
Expected Behavior
Server-side timing
Server stores authoritative start/end timestamps; browser timer is display only.
Autosave
Answer state is persisted continuously or at short intervals.
Reconnect
A temporary connection loss must not erase saved answers.
Randomization
Question and option order can be randomized per attempt.
Attempt state
Not Started → In Progress → Submitted → Graded → Published.
Auto-submit
Server closes the attempt at the configured deadline.
Idempotency
Repeated submit requests must not create duplicate submissions.
Concurrency
System must support many simultaneous attempts without corrupting state.
Auditability
Start, answer, submit and administrative changes are timestamped.

8. Academic Integrity & Proctoring
ExamForge uses a signal-based academic-integrity model. Signals are surfaced to authorized instructors for review; the platform must not automatically label a student as cheating based on a single signal.
Tab/window focus changes
Fullscreen exit
Copy/paste attempts where technically observable
Unusual answer timing
Semantic answer similarity between submissions
Optional face-presence signal
Optional multiple-person signal
Connection anomalies
Repeated suspicious interaction patterns
8.1 Integrity Dashboard
The dashboard shall display student, risk level, individual signals, event count, timestamps and a review action. It should provide enough evidence for an instructor to make a human decision.
9. Grading & Analytics
9.1 Student Analytics
Overall score and percentage
Correct/incorrect/unattempted count
Time spent
Topic-wise performance
Exam history
Recommended revision topics
Recommended practice questions
9.2 Instructor Analytics
Average/highest/lowest score
Score distribution
Question correctness rate
Average time per question
Topic performance
Difficulty performance
Submission statistics
Integrity signal summary
AI-generated learning insights
10. UI/UX Specification
The UI must closely follow the supplied reference board. The design language is a premium educational SaaS product: generous whitespace, rounded cards, subtle shadows, compact sidebar navigation, indigo/purple primary actions, blue secondary accents, clear data hierarchy, clean typography and responsive behavior.
10.1 Visual Design System
Element
Specification
Primary
Indigo/purple gradient or solid indigo for primary CTAs and active navigation.
Background
Very light neutral/blue-white in light mode; deep charcoal/navy in dark mode.
Cards
White/light cards with 12–16px radius, subtle border/shadow.
Typography
Modern sans-serif such as Inter/Manrope; strong headings and compact metadata.
Buttons
Rounded 8–12px, clear primary/secondary hierarchy.
Charts
Minimal gridlines, clear labels, accessible contrast.
Icons
Consistent outline icon set.
Spacing
8px-based spacing system; avoid crowded layouts.
Responsive
Desktop-first dashboard but fully responsive for tablet/mobile.
Theme
Light/Dark toggle in top-right; preference persisted with localStorage and user profile.

10.2 Layout Rules
Desktop dashboard: fixed/collapsible left sidebar + top header + scrollable content area.
Landing page: navbar, hero, feature grid, workflow, analytics/value section, CTA and footer.
Tables must support responsive horizontal scrolling or card transformation.
Forms should use clear labels, validation states and inline help.
Long workflows use step indicators as shown in the AI Question Studio and Create Exam screens.
Critical actions such as Publish, Submit and Delete require confirmation.
11. Screen-by-Screen UI Requirements
Screen
UI Requirements
01. Landing Page
Hero with 'Smarter Assessments for Better Learning', primary Get Started CTA, Watch Demo, trust metrics, AI/security/analytics visual.
02. Features Section
Six feature cards: AI Question Generation, Question Bank, Secure Online Exams, AI Grading & Evaluation, Analytics & Insights, Proctoring & Integrity.
03. Authentication
Split-screen login; role tabs Student/Instructor/Admin; email/roll number, password, social sign-in if enabled; branded illustration panel.
04. Student Dashboard
Sidebar, greeting, performance overview, upcoming exams, completed exams, subject/topic performance and quick links.
05. Instructor Dashboard
Course count, question count, exam count, student count, recent activity, quick actions for Generate Questions/Create Exam/View Analytics.
06. AI Question Studio
Upload material, file list, processing state, stepper and generation entry point.
07. Generate Questions – Config
Subject/topic, question count, types, difficulty distribution and Generate Questions CTA.
08. Generated Questions Preview
AI-generated cards with source, difficulty and actions Accept/Edit/Regenerate/Reject.
09. Create Exam
Exam details, course, marks, duration, start/end, description and step-based navigation.
10. Question Selection / Blueprint
Manual vs Smart Blueprint; difficulty sliders/inputs, topic distribution and total question count.
11. Live Exam Interface
Timer, question number, navigation palette, mark for review, answer area, previous/next and submit.
12. Submission Confirmation
Success state, exam metadata, score availability status, timestamp and dashboard CTA.
13. Student Result & Analytics
Score, accuracy, topic-wise bars, recommended topics, report download and answer key if permitted.
14. Instructor Exam Analytics
Total students, submitted count, average/highest/lowest, score distribution, question analysis and export report.
15. Proctoring & Integrity Dashboard
Live students, progress, elapsed time, risk level, event count and review action.
16. Admin Panel
System overview, user counts, institution/course management, recent users and system health.

12. System Architecture
Recommended logical architecture:
React Web Client
        ↓ HTTPS / WebSocket
Node.js + Express API
   ↙        ↓        ↘
MongoDB   Redis     S3
   ↓        ↓
Results   Sessions / Cache / Real-time coordination
        ↓
Python FastAPI AI Service
   ↙          ↓          ↘
LangChain   Gemini     Hugging Face
12.1 Service Responsibilities
Component
Responsibility
React
All user-facing screens and responsive UI.
Node.js/Express
Auth, RBAC, exams, questions, attempts, results, analytics APIs.
MongoDB
Users, courses, exams, questions, attempts, results, logs.
Redis
Cache, rate limiting, temporary exam state, distributed real-time coordination.
Socket.IO
Live exam events, monitoring updates and connection state.
FastAPI
AI/ML endpoints and processing jobs.
LangChain
RAG and LLM orchestration.
Gemini
Question generation, summarization, feedback and selected reasoning tasks.
Hugging Face
Embeddings/NLP/vision models where required.
S3
Private storage for course material, reports and generated assets.
ECS/Docker
Containerized production deployment.
Prometheus/Grafana
Metrics and operational dashboards.

13. Data Model
Collection
Core Fields
User
_id, name, email, passwordHash, role, institutionId, status, preferences, createdAt
Institution
_id, name, code, departments, settings, status
Course
_id, institutionId, name, code, instructorIds, studentIds, status
Material
_id, courseId, fileKey, fileName, version, processingStatus, metadata
Question
_id, courseId, type, text, options, answer, explanation, topic, difficulty, sourceRefs, status, version
Exam
_id, courseId, title, duration, schedule, blueprint, questionIds, settings, status
Attempt
_id, examId, studentId, startedAt, submittedAt, status, answers, score
IntegrityEvent
_id, attemptId, type, timestamp, metadata, severity
SimilarityReport
_id, attemptId, comparedAttemptId, questionId, score, status
AIJob
_id, type, inputRef, status, outputRef, model, tokens/usage, createdAt
AuditLog
_id, actorId, action, resourceType, resourceId, metadata, timestamp
Notification
_id, userId, type, title, message, readAt, createdAt

14. API Requirements
Method
Endpoint
Purpose
POST
/api/auth/login
Authenticate user
POST
/api/auth/refresh
Refresh access token
GET
/api/users/me
Current profile
GET
/api/courses
List authorized courses
POST
/api/materials
Upload/register material
POST
/api/ai/questions/generate
Generate question drafts
POST
/api/questions
Create question
GET
/api/questions
Search/filter question bank
PATCH
/api/questions/:id
Edit/approve/reject question
POST
/api/exams
Create exam
POST
/api/exams/:id/publish
Publish exam
GET
/api/exams/:id
Get exam
POST
/api/exams/:id/attempts
Start attempt
PATCH
/api/attempts/:id/answers
Save answers
POST
/api/attempts/:id/submit
Submit attempt
GET
/api/results/:attemptId
Get result
GET
/api/analytics/exams/:id
Exam analytics
GET
/api/integrity/exams/:id
Integrity dashboard data

14.1 WebSocket Events
Event
Direction
Purpose
exam:join
Client → Server
Student joins live exam room.
exam:state
Server → Client
Sync exam state.
answer:saved
Client → Server
Persist answer state.
attempt:updated
Server → Instructor
Update monitoring dashboard.
integrity:event
Client → Server
Send permitted integrity signal.
timer:warning
Server → Client
Deadline warning.
attempt:autoSubmitted
Server → Client
Notify automatic submission.

15. Security Requirements
Passwords must be hashed using a modern password-hashing algorithm; plaintext passwords must never be stored.
JWT secrets and API keys must be stored in environment/secret management, never in source control.
Authorization must be checked on every protected backend operation.
Use request validation and sanitization for all user-controlled data.
Apply rate limiting to authentication, AI-generation and high-cost endpoints.
Use secure HTTP headers and a restrictive CORS policy.
Use private S3 buckets and short-lived presigned URLs for protected files.
Never expose answer keys to the client before the exam result is finalized.
Exam end time must be server authoritative.
Prevent duplicate submission using idempotency/state checks.
Maintain audit logs for publication, grading overrides, role changes and other sensitive actions.
Minimize retention of camera/proctoring data and clearly disclose collection and purpose.
16. Non-Functional Requirements
Area
Requirement
Performance
Typical API responses should target <500ms for normal CRUD operations under expected load; heavy AI jobs are asynchronous.
Availability
Production services should be designed for restart/redeployment without corrupting exam state.
Scalability
Stateless API instances should scale horizontally; Redis supports shared transient state where needed.
Reliability
Autosave and idempotent submission must prevent answer loss and duplicate results.
Accessibility
Keyboard navigation, visible focus, readable contrast and semantic controls.
Responsiveness
Desktop, tablet and mobile layouts must preserve task usability.
Maintainability
Modular services, clear controller/service/repository boundaries and documented APIs.
Observability
Metrics, structured logs, health checks and dashboards.
Security
RBAC, validation, rate limiting, secure secrets and auditability.

17. Notifications & Reporting
Upcoming exam reminder.
Exam started/available notification.
Exam submission confirmation.
Result published notification.
Instructor alert for high-severity integrity signals.
AI generation completed/failed notification.
System/admin alerts.
Export exam results to CSV/XLSX/PDF.
Generate instructor-friendly exam summary report.
18. DevOps & Deployment
Use Dockerfiles for React/web, Node API and FastAPI AI service.
Use Docker Compose for local development where practical.
GitHub Actions pipeline: lint → test → build → image build → security checks → deployment.
Use AWS ECS for containerized backend/AI workloads.
Use S3 for private course materials and generated reports.
Use environment-specific configuration for local/staging/production.
Use health endpoints for API and AI services.
Implement database backup and recovery strategy before production.
19. Observability
Metric/Signal
Examples
API
Request count, latency, status code, error rate
AI
Generation count, failure rate, latency, token/usage metadata where available
Exam
Active attempts, submissions/minute, autosave failures
WebSocket
Active connections, reconnects, event errors
Redis
Memory usage, cache hit/miss, connection health
MongoDB
Query latency, connection pool health
Infrastructure
CPU, memory, container restarts

20. Testing & Acceptance Criteria
20.1 Testing Levels
Unit tests for services/utilities
API integration tests
React component tests
End-to-end exam flow tests
AI pipeline evaluation tests
Load/concurrency tests
Security tests
Responsive UI tests
20.2 Key Acceptance Criteria
✓ An instructor can upload approved material and generate draft questions.
✓ AI-generated questions remain in draft/review state until instructor approval.
✓ Approved questions can be added to a question bank and reused.
✓ Instructor can create a timed exam from manual selection or blueprint.
✓ Student can start, answer, autosave, reconnect and submit without losing saved answers.
✓ Exam automatically closes at the server-defined deadline.
✓ Objective questions are graded correctly.
✓ Subjective grading can be AI-assisted but instructor can override.
✓ Analytics show score, question and topic-level performance.
✓ Integrity signals appear with timestamp and context.
✓ Role-restricted endpoints reject unauthorized access.
✓ Dark/light theme works without changing layout or component structure.
✓ UI remains usable across desktop, tablet and mobile breakpoints.
✓ Production deployment exposes health/metrics endpoints and operational dashboards.
21. MVP vs Advanced Scope
MVP
Advanced / Production
Authentication + RBAC
RAG with vector retrieval
Student/Instructor dashboards
Semantic duplicate detection
Question bank
AI subjective grading with rubric
Manual exam creation
Socket.IO live monitoring
Timed exam
Redis distributed session/event support
Autosave
Academic-integrity signal engine
Objective grading
Optional vision-based signals
Results
AI learning recommendations
Basic analytics
AWS ECS/S3 deployment
PDF/material upload
Prometheus/Grafana monitoring
Gemini-assisted question generation with instructor approval
CI/CD
Dark/light mode

22. Future Enhancements
LMS integrations (LTI/API-based)
Question difficulty calibration using historical item performance
Adaptive testing based on student ability
Multilingual question generation
Offline-friendly exam recovery
Advanced psychometric/item-response analysis
Mobile applications
Institution-level benchmarking
Accessibility-focused assessment modes
AI tutor linked to weak concepts
23. Resume/GitHub Positioning
Recommended resume project title:
ExamForge — AI-Assisted Assessment Platform
Recommended description:
Built a full-stack AI-assisted assessment platform using React, Node.js/Express, MongoDB and FastAPI, with RAG-based question generation from instructor-approved course material, secure timed examinations, automated/rubric-assisted grading, semantic answer-similarity analysis, real-time monitoring, RBAC, learning analytics and personalized revision recommendations.
Suggested GitHub highlights:
RAG-based AI question generation with instructor-in-the-loop approval
Server-authoritative exam engine with autosave and randomized questions
Semantic similarity and academic-integrity signal dashboard
Real-time monitoring using Socket.IO + Redis
Containerized deployment with Docker/AWS ECS and S3
Prometheus/Grafana observability
Final UI Implementation Rules
Use the supplied UI board as the visual source of truth.
Do not redesign the overall layout when implementing functionality.
Keep the same sidebar/header/card hierarchy across authenticated dashboards.
Use the same indigo/purple primary action language throughout the product.
Add a compact light/dark theme toggle in the top-right header.
Dark mode changes tokens/colors only; component layout remains consistent.
All screens must be responsive; do not simply shrink desktop screenshots.
Use loading skeletons, empty states, error states and success states for production quality.
Keep destructive/irreversible actions behind confirmations.
Keep AI actions visually distinguishable but not visually overpowering.