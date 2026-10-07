# Student Examination — Implementation Plan

# Status

[COMPLETED]

## Completed

- Candidate pre-exam readiness check and instruction acceptance workflow
- Server-authoritative timer enforcement and deadline monitoring
- Interactive question runner UI with question/option randomization per attempt
- Navigation palette with status badges (Not Visited, Unanswered, Answered, Marked for Review)
- Real-time continuous background answer autosaving (`/api/v1/attempts/:id/autosave`)
- Reconnection management preserving saved answers during network interruptions
- Manual and server-driven automatic submission upon time expiry
- Idempotent submission processing with immutable server timestamp receipts (`/api/v1/attempts/:id/submit`)
- Integration tests (`server/src/tests/attempt.test.js`)

## Remaining

- None (All core SRS student examination engine requirements are fully implemented and verified)

## Verification Evidence

- Backend tests: PASS (`server/src/tests/attempt.test.js`)
- Frontend build: PASS (`npx vite build` succeeded cleanly)
- API verification: PASS (`/api/v1/attempts/start`, `/api/v1/attempts/:id/autosave`, `/api/v1/attempts/:id/submit`)
- Browser verification: PASS (Pre-exam checks, question runner, timer countdown, autosave, palette navigation, and manual/auto submission verified)
- Relevant files: `server/src/controllers/attempt.controller.js`, `server/src/models/Attempt.js`, `client/src/pages/TakeExamPage.jsx`

## 1. Module Overview
The Student Examination module provides the candidate-facing test execution runner for ExamForge. It enforces server-authoritative timing, continuous real-time autosaving, question navigation, mark-for-review status tracking, seamless reconnection handling during network disruptions, and idempotent submission processing.

## 2. SRS Requirements Covered
- Section 5.6: Student Exam
- Section 7: Examination Engine Requirements (Server timing, Autosave, Reconnect, Randomization, Auto-submit, Idempotency, Concurrency)

## 3. Module Scope

### In Scope
- Candidate pre-exam readiness check and instruction acknowledgment
- Exam session start and attempt initialization
- Display of randomized questions and option order per attempt
- Server-authoritative timer management and display
- Interactive question navigation palette (Answered, Unanswered, Marked for Review, Current)
- Real-time continuous answer autosaving
- Mark for review flag toggle
- Network disconnect detection, local queueing, and seamless automatic reconnection
- Manual exam submission with confirmation receipt
- Server-driven automatic submission when the exam duration or deadline expires
- Submission receipt generation with immutable server timestamp

### Out of Scope
- Exam scheduling, question blueprinting, and publishing (handled by Exam Management module)
- Automatic objective grading calculations and feedback (handled by Grading module)
- Academic integrity monitoring signal emission (handled by Academic Integrity & Proctoring module)

## 4. User Roles
- **Student**: Enters published exam room, completes pre-exam checks, answers questions, marks items for review, monitors time, and submits attempt.
- **Instructor**: Views live attempt progress (Joined, In Progress, Submitted, Auto-Submitted) across candidates.
- **Institution Admin / Super Admin**: Monitors system concurrency and attempt load.

## 5. User Flow
Student accesses Student Dashboard 
→ Clicks Start Exam on scheduled published exam 
→ Completes Pre-Exam Readiness Check and accepts instructions 
→ Clicks Begin Attempt 
→ System initializes attempt, starts server-authoritative timer, and renders Question 1 
→ Student selects/inputs answer 
→ System automatically saves answer in background and updates navigation palette 
→ Student flags ambiguous questions using Mark for Review 
→ Student navigates through questions using Next/Previous or Palette buttons 
→ If network drops, system holds answers locally and reconnects automatically without data loss 
→ When finished, student clicks Submit Exam 
→ System prompts confirmation dialog showing summary (Answered vs Unanswered) 
→ Student confirms submission 
→ System locks attempt, generates server timestamp receipt, and redirects student to completion screen 
*(If time expires before manual submission, system automatically closes and submits attempt).*

## 6. Core Features

### Server-Authoritative Timing
- **Purpose**: Prevent client clock manipulation and guarantee strict time limits.
- **Expected behavior**: Server maintains authoritative start time and deadline; browser timer acts as a display sync.
- **User interaction**: Student views remaining time countdown in top header with visual warning alerts when time is low.
- **System behavior**: Calculate exact remaining seconds from server clock; trigger server-driven auto-submit when deadline hits zero.

### Real-Time Continuous Autosave & Reconnection Handling
- **Purpose**: Ensure zero loss of student work during unexpected browser crashes or network drops.
- **Expected behavior**: Answer selections are persisted immediately upon selection; local state caches selections during brief outages and syncs upon reconnection.
- **User interaction**: Student selects options or types response; sees subtle "Saved" indicator.
- **System behavior**: Receive answer payloads, update attempt record state asynchronously, and return confirmation ack.

### Interactive Navigation Palette & Mark for Review
- **Purpose**: Facilitate rapid test navigation and strategy.
- **Expected behavior**: Palette visually distinguishes Question Statuses (Not Visited, Unanswered, Answered, Marked for Review, Answered & Marked for Review).
- **User interaction**: Click palette numbers to jump directly to any question; click Mark for Review button.
- **System behavior**: Update client navigation state and track review flags per question attempt.

### Idempotent Submission & Receipt Generation
- **Purpose**: Ensure submissions are recorded reliably without duplicate attempt records.
- **Expected behavior**: Repeated clicks or network retries process cleanly once; system issues immutable submission receipt.
- **User interaction**: Click Submit Exam, confirm modal, view submission success receipt.
- **System behavior**: Transition attempt state `IN_PROGRESS` → `SUBMITTED`, lock attempt against further edits, record `submittedAt` timestamp, return receipt code.

## 7. Business Rules
- Server timing is authoritative; local client system clock changes have zero effect on exam duration.
- Saved answers must be preserved across page refreshes, tab closures, and network dropouts.
- An attempt can only be submitted once; idempotent processing must reject duplicate submit requests.
- Once an attempt status is `SUBMITTED` or `AUTO_SUBMITTED`, further answer modifications are strictly forbidden.
- Questions and option choices must adhere to the randomization config defined by the exam blueprint.

## 8. Module Dependencies

### Depends On
- Authentication & Account Management
- RBAC & Authorization
- Institution & Course Management
- Exam Management

### Depends On This Module
- Grading
- Analytics
- Academic Integrity & Proctoring

## 9. Important States
- Not Started
- Pre-Exam Check
- In Progress
- Reconnecting
- Submitted
- Auto-Submitted
- Graded

## 10. Error & Edge Behavior

### Network Disconnect During Active Exam
- **Scenario**: Student loses internet connectivity while answering questions.
- **Expected behavior**: Display unobtrusive warning ("Reconnecting to server... your answers are saved locally"); queue answers in client memory; sync automatically once connection restores.

### Time Expiry Mid-Answer
- **Scenario**: Exam time expires while candidate is typing a descriptive response.
- **Expected behavior**: Lock text area immediately, auto-save partial answer string, execute server auto-submission, and display "Exam Time Expired — Attempt Submitted".

### Duplicate Submission Click
- **Scenario**: Candidate rapidly clicks Submit button multiple times.
- **Expected behavior**: Disable Submit button immediately upon first click; process submission idempotently; display receipt.

## 11. Security Considerations
- Correct answers and question explanations must NEVER be sent to the student client during an active attempt.
- Exam submission requests must validate attempt ownership matching the logged-in student session.

## 12. Implementation Phases
- **Phase 1 — Attempt Initialization & Timer**: Session start, pre-exam check, and server timer sync.
- **Phase 2 — Question Runner & Autosave**: Question display, answer input, and continuous background autosave.
- **Phase 3 — Palette & Navigation**: Navigation palette, status indicators, and mark for review.
- **Phase 4 — Reconnection & Auto-Submit**: Offline queueing, network reconnect sync, and server-driven auto-submission.

## 13. Testing Scope
- Verifying server timer accuracy regardless of client device time tampering.
- Testing continuous autosave during rapid question navigation.
- Simulating network dropouts and verifying zero loss of saved answers upon reconnection.
- Testing auto-submission trigger upon time expiry.
- Verifying idempotent submission processing under duplicate network requests.

## 14. Definition of Done
- Students can complete pre-exam checks, navigate questions, mark for review, and submit exams cleanly.
- Server timing is enforced authoritatively with automatic submission upon deadline expiry.
- Reconnections preserve 100% of saved answers without data corruption.
