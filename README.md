# ExamForge — AI-Assisted Assessment Platform

## 1. Project Overview
ExamForge is an enterprise-grade, AI-assisted assessment platform designed for educational institutions. It manages the complete assessment lifecycle: approved course-material ingestion, AI-assisted question drafting, instructor review, question-bank management, exam creation, timed delivery, automatic and rubric-assisted grading, academic-integrity signals, analytics, reporting, and personalized learning recommendations.

## 2. Problem Statement
Institutions often use separate tools for question preparation, online examinations, grading, proctoring, and performance analysis. This creates manual work, fragmented data, weak visibility into learning gaps, and inconsistent assessment workflows. ExamForge unifies these processes in one role-based platform while keeping instructors in control of AI-generated assessment content ("Human-in-the-Loop").

## 3. Product Goals
- **Reduce Instructor Effort**: Generate high-quality draft questions from approved course material.
- **Improve Assessment Quality**: Use blueprints, difficulty levels, topic coverage, and automated validation.
- **Deliver Secure Exams**: Use server-controlled timing, autosave, randomized questions/options, and integrity signals.
- **Improve Grading Efficiency**: Automatically grade objective answers and assist rubric-based subjective evaluation.
- **Create Actionable Analytics**: Show question, topic, student, and exam-level performance.
- **Close the Learning Loop**: Recommend revision topics based on student performance.
- **Support Production Scale**: Use containerization, Redis, cloud object storage, CI/CD, and full observability.

## 4. User Roles
- **Super Admin**: Global platform control, institution setup, system health monitoring, audit logs.
- **Institution Admin**: Manage institution users, departments, courses, and compliance reporting.
- **Instructor**: Create courses, upload materials, generate/review questions, create exams, evaluate responses, analyze performance.
- **Student**: Join courses, take timed exams, view results, track performance, access personalized revision topics.

## 5. System Architecture
```
React Web Client
        ↓ (HTTPS / WebSocket)
Node.js + Express API
   ├── MongoDB (Users, Courses, Questions, Exams, Attempts, Logs)
   ├── Redis (Cache, Sessions, Rate Limiting)
   └── AWS S3 (Course Materials, Export Files)
        ↓
Python FastAPI AI Service
   ├── LangChain (RAG Orchestration)
   ├── Gemini API (Generative Question Drafting & Reasoning)
   └── Hugging Face Models (Embeddings & Semantic Similarity)
```

## 6. Technology Stack
- **Frontend**: React (Single Page Application, responsive layout system)
- **Backend API**: Node.js + Express (RESTful APIs, JWT/RBAC, Socket.IO)
- **Database**: MongoDB (Mongoose ODM)
- **AI Microservice**: Python FastAPI
- **AI/ML Libraries**: Gemini API, LangChain, Hugging Face Models
- **Caching & Real-Time**: Redis, Socket.IO
- **Cloud & DevOps**: AWS S3, Docker, Docker Compose, AWS ECS, GitHub Actions
- **Observability**: Prometheus, Grafana

## 7. Project Structure
```
examforge/
│
├── client/                 # React Web Client
├── server/                 # Node.js + Express Backend API
├── ai-service/             # Python FastAPI AI & RAG Microservice
├── docs/                   # Complete Project Documentation & Specs
│   ├── SRS.md              # Software Requirements Specification
│   ├── context.md          # Technical Project Context & Architecture
│   ├── implementation-plan/ # Implementation Roadmap & Module Plans
│   ├── edge-cases/         # System Edge Cases & Exception Handling
│   └── acceptance-criteria/# Module Acceptance Criteria & DoD
├── infrastructure/         # Docker, AWS, Monitoring, CI/CD Templates
├── tests/                  # Unit, Integration, and E2E Test Suites
├── .env.example            # Environment Configuration Template
├── .gitignore              # Repository Git Ignore Rules
├── docker-compose.yml      # Local Multi-Container Development Setup
└── README.md               # Root Project Documentation
```

## 8. MVP vs Advanced Scope

### MVP Scope
- Authentication + RBAC (Super Admin, Institution Admin, Instructor, Student)
- Student and Instructor Dashboards
- Question Bank management (MCQ, True/False, Short Answer, Descriptive)
- Manual exam creation and smart blueprint scheduling
- Server-authoritative timed exam delivery with continuous autosave
- Objective auto-grading and instructor score overrides
- Basic student/instructor analytics
- PDF / course material upload
- Gemini-assisted draft question generation with instructor approval
- Dark / light mode UI framework

### Advanced / Production Scope
- RAG with vector retrieval indexing
- Semantic duplicate question detection
- AI subjective grading with instructor rubrics
- Socket.IO live exam monitoring & instructor integrity dashboard
- Redis distributed session and event coordination
- Academic-integrity signal engine (tab switch, window focus, timing anomalies)
- Optional vision-based proctoring signals
- Personalized AI learning recommendations
- AWS ECS & S3 production deployment
- Prometheus & Grafana operational observability
- Full CI/CD automated pipeline

## 9. Key Documentation Links
- [Software Requirements Specification (SRS)](file:///c:/Users/amar7/Desktop/ExamForge/docs/SRS.md)
- [Technical Context Document](file:///c:/Users/amar7/Desktop/ExamForge/docs/context.md)
- [Implementation Plan Framework](file:///c:/Users/amar7/Desktop/ExamForge/docs/implementation-plan/README.md)
- [Edge Cases Framework](file:///c:/Users/amar7/Desktop/ExamForge/docs/edge-cases/README.md)
- [Acceptance Criteria Framework](file:///c:/Users/amar7/Desktop/ExamForge/docs/acceptance-criteria/README.md)

## 10. Security & Compliance
- Password hashing with Argon2 / bcrypt
- Short-lived JWT access tokens + secure refresh tokens
- Mandatory server-side RBAC validation on all protected endpoints
- Strict input validation and sanitization against injection attacks
- Rate limiting on authentication and AI generation endpoints
- Private S3 storage with presigned URL access
- Server-authoritative exam timing and idempotent submit checks
- Immutable audit log tracking for sensitive administrative actions

## 11. Testing & Quality Assurance
- **Unit Tests**: Utility functions, schema validations, service calculations
- **API Tests**: Express endpoint routes, status codes, payload structures
- **Integration Tests**: FastAPI AI microservice interactions, Redis/MongoDB state
- **E2E Tests**: Complete student exam flow from start to submission and grading

## 12. Deployment & Operations
- Local deployment managed via `docker-compose up`
- Production workloads containerized via AWS ECS
- Continuous Integration & Deployment configured using GitHub Actions
- Operational monitoring exposed via Prometheus metrics (`/metrics`) and Grafana dashboards
