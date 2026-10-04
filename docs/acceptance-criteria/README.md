# ExamForge Acceptance Criteria Framework

## Overview
This directory contains acceptance criteria specifications and "Definition of Done" (DoD) standards for all ExamForge modules. Acceptance criteria provide measurable, verifiable standards that every feature must satisfy before being considered complete and ready for production deployment.

All acceptance criteria documented within this framework map directly back to the requirements established in `docs/SRS.md`.

## Definition of Done (DoD) Standards
A feature or module within ExamForge is considered **DONE** only when it satisfies all testing tiers outlined below:

### 1. Functional Testing Criteria
- All functional user stories and requirements specified in the SRS are fully verified.
- Business logic rules (e.g., Human-in-the-Loop AI approval, draft question state, server-authoritative timer) function as intended.
- Edge cases marked as `Defined by SRS` are tested and passing.

### 2. API Testing Criteria
- Every endpoint returns correct HTTP status codes (`200 OK`, `201 Created`, `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`, `500 Server Error`).
- Request body and query parameter validation schemas reject invalid inputs cleanly.
- API responses conform strictly to defined JSON payload structures without exposing sensitive system internals.

### 3. Security Testing Criteria
- Authentication and RBAC middleware enforce role permissions on every protected endpoint.
- Rate limiting prevents brute-force login and AI generation quota abuse.
- Input fields sanitize data against XSS and NoSQL injection attacks.
- Sensitive credentials, JWT secrets, and API keys are verified to exist only in environment configurations.
- Answer keys are verified to never leak to student clients prior to exam result finalization.

### 4. UI Testing Criteria
- Visual layouts adhere strictly to the visual direction defined by the reference UI board (in the UI implementation phase).
- Responsive layouts operate seamlessly across Desktop, Tablet, and Mobile breakpoints.
- Interactive states (Loading skeletons, Empty states, Error boundaries, Disabled buttons) are fully rendered.
- Light and Dark mode toggles operate smoothly without breaking component layouts.

### 5. Integration Testing Criteria
- Cross-service workflows (e.g., Node.js API calling Python FastAPI AI service) complete reliably.
- Redis cache invalidation and session storage operate cleanly with MongoDB persistence.
- S3 presigned URL generation allows authorized file upload and download.
- Socket.IO events transmit bidirectionally between client and server without event drops.

### 6. End-to-End (E2E) Testing Criteria
- Complete end-to-end user workflows execute successfully without manual database interventions:
  1. Instructor uploads material → AI generates questions → Instructor approves → Question added to Question Bank.
  2. Instructor creates blueprint exam → Exam published → Student takes exam with timer/autosave → Student submits → Objective auto-graded → Instructor reviews subjective responses → Results published → Student views analytics.

## Future Module Acceptance Files
As implementation progresses, module-specific acceptance files will be added to this folder (e.g., `01-auth-acceptance.md`, `08-exam-engine-acceptance.md`), detailing explicit test cases, Gherkin scenarios (Given/When/Then), and verification steps mapped to SRS section numbers.
