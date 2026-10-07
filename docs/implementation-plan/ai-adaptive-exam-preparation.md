# AI-Powered Adaptive Exam Preparation & Practice — Implementation Plan

# Status

[COMPLETED]

## Completed

- Result gating requiring a published official exam result before generating AI preparation guidance
- Performance & Learning Analysis engine (`aiPreparation.service.js`) calculating strong vs weak topics and accuracy rates from real MongoDB attempt data
- Gemini-powered RAG weak topic study guide generation grounded in uploaded course material
- AI practice assessment generation creating targeted practice papers with `assessmentType: PRACTICE`
- Execution of practice assessments using the core test runner
- Practice score evaluation, score delta calculation (+X% comparison against source official attempt), and topic mastery status updates (`STRONG`, `IMPROVING`, `NEEDS PRACTICE`, `WEAK`)
- Compact slide-out `AIStudyTutor` assistant providing interactive AI concept explanations
- Integration test suite (`scratch/testAIPreparation.js`) passing 100%

## Remaining

- None (All core SRS AI adaptive exam preparation requirements are fully implemented and verified)

## Verification Evidence

- Backend tests: PASS (`node scratch/testAIPreparation.js` passed 100%)
- Frontend build: PASS (`npx vite build` succeeded cleanly)
- API verification: PASS (`/api/v1/ai-prep/analysis/:attemptId`, `/api/v1/ai-prep/generate-practice`, `/api/v1/ai-prep/tutor-chat`)
- Browser verification: PASS (Published result gating, RAG study guide, practice paper generation, score delta calculation, and AI tutor verified)
- Relevant files: `server/src/services/aiPreparation.service.js`, `server/src/routes/aiPreparation.routes.js`, `client/src/pages/AIPreparationViewPage.jsx`, `client/src/components/AIStudyTutor.jsx`

## 1. Module Overview
The AI-Powered Adaptive Exam Preparation & Practice module provides a student-centric learning loop that connects official examination performance with intelligent self-preparation. Following an official exam attempt, the module analyzes learning gaps, generates Gemini-assisted revision recommendations grounded in approved RAG course material, allows candidates to generate custom practice assessments, executes practice attempts via the existing test runner, and tracks performance improvements (+X% score delta) over time.

### Student Learning Cycle
```
OFFICIAL EXAM
      ↓
RESULT
      ↓
PERFORMANCE & GAP ANALYSIS
      ↓
WEAK TOPIC / CONCEPT IDENTIFICATION
      ↓
GEMINI-POWERED PREPARATION GUIDANCE
      ↓
PRACTICE ASSESSMENT GENERATION
      ↓
STUDENT PRACTICE ATTEMPT
      ↓
PRACTICE RESULT & SCORING
      ↓
IMPROVEMENT ANALYSIS & SCORE DELTA
      ↓
NEXT PRACTICE / REASSESSMENT RECOMMENDATION
      ↓
NEXT OFFICIAL EXAM
```

## 2. SRS Requirements Covered
- Section 2: Product Vision and Goals (G8: Deliver adaptive practice)
- Section 3.1: In Scope (AI-powered adaptive exam preparation & practice assessment engine)
- Section 5.9: Functional Requirements (AI-Powered Adaptive Exam Preparation & Practice)
- Section 6.2 & 6.3: AI Features & Guardrails (Adaptive Preparation Guidance, Practice Assessment Generation, RAG Grounding, Official vs. Practice Boundaries)
- Section 9.1: Student Analytics (AI Preparation Card, improvement delta, learning status indicators)
- Section 11: Screen-by-Screen UI Requirements (Screen 04 Student Dashboard & Screen 17 AI Preparation & Practice Studio)
- Section 13: Data Model (`PracticeAssessment` and `LearningAnalysis` collections, `assessmentType` fields)
- Section 14: API Requirements (`/api/student/learning-analysis`, `/api/student/preparation`, `/api/student/practice`)
- Section 20.2: Key Acceptance Criteria (Gap analysis, RAG preparation, practice runner execution, score delta tracking, boundary enforcement)
- Section 21: MVP vs Advanced Scope (Phase 2 Extension / Advanced Scope)

## 3. Module Scope

### In Scope
- Official exam performance gap analysis across score, topics, concepts, difficulty, and repeated mistakes
- AI Preparation Card integration on the Student Dashboard
- Gemini-powered personalized study guidance and revision steps using RAG-approved course materials
- Student-customizable practice assessment generation (Topic, Concept focus, Question count, Difficulty, Question type)
- Execution of practice assessments via the core exam runner with `assessmentType: PRACTICE`
- Practice result evaluation, score comparison against previous official attempts, and improvement tracking (+X% score delta)
- Adaptive learning loop state updates and status indicators (`STRONG`, `IMPROVING`, `NEEDS PRACTICE`, `WEAK`)
- Practice history tracking and progress dashboard
- Role-based security and strict separation between student practice and official instructor exams

### Out of Scope
- Converting student-generated practice assessments into official published exams
- Overriding instructor exam schedules, official blueprints, or official question bank items
- Autonomous cheating verdicts or fake/mock AI performance claims unsupported by actual test data

## 4. User Roles
- **Student**: Views post-exam learning gap analysis, reads Gemini study recommendations, generates custom practice assessments, completes practice attempts, tracks score improvement, and reviews practice history.
- **Instructor**: Views cohort learning gap summaries and aggregate student practice engagement metrics.
- **Institution Admin**: Views department-level learning progress and system adaptation usage metrics.

## 5. User Flow
Student completes an Official Exam attempt and views published results 
→ System runs Learning Analysis Engine to compute weak topics, concepts, and mistake patterns 
→ Student opens Student Dashboard or Result screen and sees "AI Preparation Card" 
→ Student clicks "Start AI Preparation" to view Gemini-generated personalized study guide 
→ Student clicks "Generate Practice Assessment" and either accepts AI recommendation or customizes parameters (Topic, Concept, Difficulty, Question Count) 
→ Gemini generates practice assessment grounded in RAG course material 
→ Candidate attempts practice paper using the existing core exam runner (Timer, Autosave, Palette) marked as `assessmentType: PRACTICE` 
→ System grades practice attempt instantly, compares score with previous official attempt, and computes improvement delta (+X%) 
→ System updates learning status (`IMPROVING`, `NEEDS PRACTICE`, `STRONG`) and records entry in Practice History 
→ Gemini recommends next preparation step or next practice focus area.

## 6. Core Features

### Learning Analysis Engine
- **Purpose**: Analyze official exam attempt data to identify concrete conceptual weaknesses.
- **Expected behavior**: Compute topic, concept, and difficulty accuracy rates; identify repeated mistake patterns based on empirical attempt data.
- **User interaction**: View "Weak Concepts" and "Performance Breakdown" on Student Dashboard / Analysis screen.
- **System behavior**: Aggregate question correctness by topic/concept tags, evaluate accuracy against mastery thresholds, and generate `LearningAnalysis` record.

### Gemini Preparation Service (RAG-Grounded)
- **Purpose**: Provide clear, actionable study steps tailored to identified learning gaps.
- **Expected behavior**: Generate structured revision steps, concept summaries, and practice strategies utilizing approved RAG course material.
- **User interaction**: View "AI Study Guide" section on Preparation View.
- **System behavior**: Retrieve relevant course material chunks via existing RAG retriever, format Gemini prompt with learning gap context, and return study guidance.

### Practice Assessment Generator
- **Purpose**: Enable students to create self-preparation practice assessments tailored to weak areas.
- **Expected behavior**: Allow candidate customization or AI auto-fill; generate practice paper without altering official question bank.
- **User interaction**: Set Topic, Concept, Difficulty (Easy/Medium/Hard), Question Count, Question Type (MCQ/Short Answer), and click Generate.
- **System behavior**: Query RAG pipeline and Question Bank for matching practice items, generate missing draft items via Gemini, and assemble `PracticeAssessment` paper.

### Practice Assessment Runner & Scoring Engine
- **Purpose**: Execute practice attempts reusing existing core test runner components.
- **Expected behavior**: Render questions, enforce timer (if configured), continuously autosave answers, grade objective items, and calculate score.
- **User interaction**: Answer practice questions using standard exam UI; click Submit Practice.
- **System behavior**: Grade response payload, record attempt score, compute score delta compared to source official exam attempt, and update attempt status.

### Adaptive Learning Loop & Progress Tracker
- **Purpose**: Maintain an iterative learning cycle and track candidate improvement over time.
- **Expected behavior**: Continuously update topic mastery status (`STRONG`, `IMPROVING`, `NEEDS PRACTICE`, `WEAK`) after each practice attempt.
- **User interaction**: View updated learning status badges and progress charts on Student Dashboard.
- **System behavior**: Re-evaluate topic accuracy after practice submit, update candidate mastery index, and log entry in Practice History.

## 7. Business Rules

### Official vs. Practice Boundary Rule
- **Official Exam**: Instructor/Institution controlled, published through official workflow, affects official grades/transcripts, cannot be generated or altered by students.
- **Practice Assessment**: Student-initiated, Gemini-assisted, generated for self-preparation, marked as `assessmentType: PRACTICE`, does NOT affect official grades or transcripts, and cannot be converted into an official exam.

### Grounding & AI Integrity Rules
- Gemini study guidance must rely on RAG approved course material rather than unsupported external knowledge.
- Learning gap analysis must derive from actual candidate attempt data; unsupported AI claims are strictly prohibited.
- Practice assessments must be accessible exclusively to the logged-in student who generated them.

## 8. Module Dependencies

### Depends On
- Authentication & Account Management
- RBAC & Authorization
- Student Dashboard
- Exam Management (Official Exam Engine)
- Student Examination (Core Test Runner)
- Grading & Evaluation Engine
- Analytics Module
- Question Bank Management
- AI/RAG Question Generation (Gemini & LangChain Pipeline)

### Depends On This Module
- Notifications & Reporting

## 9. Important States
- `[ ] Not Started` — Module setup pending prerequisite core services
- `[ ] Gap Analysis Pending` — Official exam attempt completed, gap analysis queued
- `[ ] Gap Analysis Complete` — Learning gaps identified, ready for preparation
- `[ ] Preparation Generated` — Gemini study guidance ready for candidate review
- `[ ] Practice Generated` — Practice assessment assembled and ready for candidate attempt
- `[ ] Practice In Progress` — Candidate actively taking practice paper in test runner
- `[ ] Practice Submitted` — Practice attempt submitted and graded
- `[ ] Status: WEAK` — Topic accuracy <50%
- `[ ] Status: NEEDS PRACTICE` — Topic accuracy 50%–69%
- `[ ] Status: IMPROVING` — Topic accuracy 70%–84% with positive score delta
- `[ ] Status: STRONG` — Topic accuracy ≥85%

## 10. Error & Edge Behavior

### Zero Weak Topics (100% Official Exam Score)
- **Scenario**: Student achieves perfect score on official exam.
- **Expected behavior**: Display congratulations message ("Mastery Achieved!"), present optional challenge practice topics, and update learning status to `STRONG`.

### RAG Material Missing for Weak Topic
- **Scenario**: Approved course material contains insufficient text for RAG retrieval on an identified weak topic.
- **Expected behavior**: Provide text-based AI study guide, notify instructor of content gap, and allow practice question generation using standard question templates.

### Practice Assessment Score Decline
- **Scenario**: Student scores lower on a practice assessment than on the previous attempt (-X% score delta).
- **Expected behavior**: Update status to `NEEDS PRACTICE`, highlight specific missed concepts, and recommend targeted fundamental revision before next practice.

## 11. Security & Authorization
- Student can access ONLY their own learning analysis, practice assessments, and practice history.
- All Gemini API calls must execute through backend service proxies; raw API keys must never be exposed to the frontend.
- Standard RBAC middleware must validate student session claims on all practice endpoints.
- Rate limiting must be applied to practice generation endpoints to prevent API quota abuse.

## 12. Implementation Phases

- **[ ] Phase A — Architecture & Integration**
  - Tasks: Inspect existing student dashboard, exam runner, grading, and Gemini/RAG services; define data flow from official exam attempts to adaptive practice; specify `assessmentType` discriminator.
  - Deliverable: Integrated architecture and data-flow specification for adaptive practice.

- **[ ] Phase B — Learning Analysis Engine**
  - Tasks: Build backend service to analyze official exam attempt scores, topic accuracy, concept performance, and mistake patterns; create `LearningAnalysis` record.
  - Deliverable: Operational Learning Analysis Engine producing empirical weakness reports.

- **[ ] Phase C — Gemini Preparation Service**
  - Tasks: Integrate Gemini API with existing RAG retriever to generate personalized revision steps, concept summaries, and study guidance grounded in course materials.
  - Deliverable: RAG-grounded Gemini Preparation Service.

- **[ ] Phase D — Practice Assessment Generator**
  - Tasks: Implement practice generation workflow supporting candidate customization (Topic, Concept, Question Count, Difficulty, Question Type) or AI auto-fill.
  - Deliverable: Practice Assessment Generation engine creating structured `PracticeAssessment` objects.

- **[ ] Phase E — Practice Assessment Data Model**
  - Tasks: Extend `Exam` and `Attempt` schemas with `assessmentType` (`OFFICIAL` | `PRACTICE`); define `PracticeAssessment` and `LearningAnalysis` datastore models.
  - Deliverable: Extended data models maintaining relationships between student, source exam, practice paper, and score delta.

- **[ ] Phase F — Student Dashboard Integration**
  - Tasks: Extend Student Dashboard with "AI Preparation Card", weak topic tags, target score indicators, AI recommendation summary, and quick action CTAs.
  - Deliverable: UI Preparation Card and weak topic summary on Student Dashboard.

- **[ ] Phase G — Practice Assessment UI Runner**
  - Tasks: Adapt existing core exam runner UI for practice execution; render clear "PRACTICE ASSESSMENT" header badge; reuse timer, palette, autosave, and submission confirmation.
  - Deliverable: Practice test runner UI reusing core exam engine.

- **[ ] Phase H — Practice Result & Analysis**
  - Tasks: Implement instant practice grading, score delta calculation (+X% comparison against source official attempt), topic accuracy update, and next-step recommendation.
  - Deliverable: Practice Result screen rendering score comparison and improvement status.

- **[ ] Phase I — Adaptive Learning Loop State Machine**
  - Tasks: Build state engine managing continuous `ASSESS → ANALYZE → PREPARE → PRACTICE → REASSESS` cycle; update learning status badges (`STRONG`, `IMPROVING`, `NEEDS PRACTICE`, `WEAK`).
  - Deliverable: Adaptive learning loop state manager.

- **[ ] Phase J — Practice History Ledger**
  - Tasks: Build Practice History view displaying list of past practice attempts, date, topic, score, delta (+/-%), difficulty, and status indicator.
  - Deliverable: Practice History table on Student Dashboard.

- **[ ] Phase K — REST API Implementation**
  - Tasks: Implement `/api/student/learning-analysis`, `/api/student/preparation/generate`, `/api/student/practice/generate`, `/api/student/practice/history`, `/api/student/practice/:id/analysis`.
  - Deliverable: Complete RESTful API endpoints for adaptive practice.

- **[ ] Phase L — Security & Authorization Validation**
  - Tasks: Apply RBAC session checks, candidate data isolation guards, backend Gemini API key proxying, and rate limiting.
  - Deliverable: Secure, rate-limited adaptive practice service.

- **[ ] Phase M — Testing & Acceptance Verification**
  - Tasks: Execute Unit, Integration, Security, and UI test suites.
  - Deliverable: Verified, test-backed adaptive practice module.

## 13. Testing Scope

### Unit Tests
- `LearningAnalysis` service weak topic calculation logic.
- Score improvement delta calculation (+/- percentage delta).
- `assessmentType` schema validation (`OFFICIAL` vs. `PRACTICE`).
- Learning gap status badge assignment (`STRONG`, `IMPROVING`, `NEEDS PRACTICE`, `WEAK`).

### Integration Tests
- Official exam submission → result finalization → `LearningAnalysis` generation.
- Learning gap analysis → RAG document chunk retrieval → Gemini study plan generation.
- Customized practice configuration → Gemini draft generation → `PracticeAssessment` creation.
- Practice attempt submission → objective grading → score delta calculation → updated learning status.

### Security Tests
- Verification that Student A cannot access Student B's learning analysis or practice attempts.
- Rejection of student attempts to convert a practice assessment into an official exam.
- Verification that Gemini API requests execute exclusively via backend proxies without exposed client keys.

### UI Tests
- AI Preparation Card rendering on Student Dashboard.
- Practice Assessment Generator form submission.
- Practice test runner UI displaying "PRACTICE ASSESSMENT" badge.
- Practice Result comparison view and Practice History table.

## 14. Definition of Done
- Students can view AI Preparation recommendations on the Student Dashboard following an official exam.
- Gemini generates study guidance and practice questions grounded in approved RAG course material.
- Candidates can generate and attempt practice assessments using the core test runner marked as `PRACTICE`.
- Practice results calculate score improvement (+X%) compared to previous attempts and update learning status indicators (`STRONG`, `IMPROVING`, `NEEDS PRACTICE`, `WEAK`).
- Student practice assessments remain strictly separate from official instructor-controlled examinations.
