# Exam Management — Implementation Plan

# Status

[COMPLETED]

## Completed

- Exam setup wizard and configuration (`/api/v1/exams`)
- Scheduling controls (Start Date/Time, End Date/Time, Duration, Attempts)
- Manual question selection picker from approved Question Bank items
- Smart Blueprint generation with difficulty sliders and topic coverage percentage distribution
- Security flags configuration (Randomize questions, Randomize options, Fullscreen mandatory, Proctoring enabled)
- Exam preview studio and publishing state engine (`DRAFT` → `PUBLISHED` → `ACTIVE` → `CLOSED`)
- Integration tests (`server/src/tests/exam.test.js`)

## Remaining

- None (All core SRS exam management requirements are fully implemented and verified)

## Verification Evidence

- Backend tests: PASS (`server/src/tests/exam.test.js`)
- Frontend build: PASS (`npx vite build` succeeded cleanly)
- API verification: PASS (`/api/v1/exams`, `/api/v1/exams/:id/publish`)
- Browser verification: PASS (Exam creation, blueprint slider distribution, preview, and publishing verified)
- Relevant files: `server/src/controllers/exam.controller.js`, `server/src/models/Exam.js`, `client/src/pages/ExamManagementPage.jsx`

## 1. Module Overview
The Exam Management module allows instructors to construct, configure, schedule, blueprint, preview, and publish structured examinations. It provides flexible question selection methods—either manual picking from the Question Bank or automated Smart Blueprint generation based on topic and difficulty rules—while setting strict schedule boundaries, attempt limits, marking schemes, and delivery settings.

## 2. SRS Requirements Covered
- Section 5.5: Exam Management
- Section 7: Examination Engine Requirements (Configuration & Publishing)

## 3. Module Scope

### In Scope
- Exam creation (Title, Course association, Description, Duration, Total marks, Instructions)
- Exam scheduling (Start date/time, End date/time, Late entry policies)
- Manual question selection from the Question Bank
- Smart Blueprint generation (Configuring difficulty distribution sliders and topic percentage distribution)
- Exam settings configuration (Negative marking, allowed attempt limits, question/option randomization, question navigation mode)
- Exam preview prior to publication
- Exam publishing and unpublishing state management

### Out of Scope
- Real-time student exam execution, timing enforcement, and autosave (handled by Student Examination module)
- Grade evaluation and scoring calculations (handled by Grading module)

## 4. User Roles
- **Instructor**: Creates, blueprints, configures, previews, schedules, publishes, and unpublishes exams for assigned courses.
- **Institution Admin**: Views scheduled exams, institution exam calendars, and publishing statistics.
- **Student**: Views published, scheduled upcoming exams for enrolled courses.

## 5. User Flow
Instructor opens Exam Setup Studio 
→ Inputs general details (Title, Course, Duration, Total Marks, Instructions) 
→ Sets Schedule (Start Date/Time, End Date/Time) 
→ Selects Question Assembly Method (Manual Selection OR Smart Blueprint) 
→ If Smart Blueprint: sets difficulty distribution (Easy %, Medium %, Hard %) and topic coverage 
→ System selects matching approved questions from Question Bank 
→ Configures Exam Rules (Negative marking, Max Attempts, Randomize questions/options) 
→ Clicks Preview Exam to verify candidate view 
→ Clicks Publish Exam 
→ Exam transitions to `PUBLISHED` state and becomes visible to enrolled students.

## 6. Core Features

### Exam Setup & Configuration
- **Purpose**: Define core assessment parameters and instructions.
- **Expected behavior**: Capture duration in minutes, total marks, attempt limits, negative marking values, and delivery settings.
- **User interaction**: Complete step-based wizard (Details → Schedule → Questions → Settings → Review).
- **System behavior**: Store exam configuration in `DRAFT` state.

### Manual Question Selection & Smart Blueprint Assembly
- **Purpose**: Assemble questions into an exam paper manually or via automated blueprint logic.
- **Expected behavior**: Smart Blueprint selects questions from the approved Question Bank matching specified topic percentages and difficulty distributions; Manual Selection allows individual item picking.
- **User interaction**: Select Assembly Mode; adjust difficulty sliders (e.g., 30% Easy, 50% Medium, 20% Hard) or check individual questions from bank list.
- **System behavior**: Validate question availability in bank, check total marks summation, and bind selected question IDs to the exam object.

### Exam Preview & Randomization Settings
- **Purpose**: Allow instructors to verify exam layout and configure candidate anti-cheating controls.
- **Expected behavior**: Preview displays exam paper exactly as a candidate will see it; settings enable question order and option order randomization per attempt.
- **User interaction**: Click Preview Exam; toggle Randomize Questions and Randomize Options checkboxes.
- **System behavior**: Generate sample preview rendering; save randomization rules to exam settings configuration.

### Exam Publishing Lifecycle Management
- **Purpose**: Control exam availability to candidates.
- **Expected behavior**: Publishing locks question choices and makes exam visible to enrolled students at the scheduled start time; unpublishing hides exam provided no active attempts exist.
- **User interaction**: Click Publish Exam or Unpublish Exam.
- **System behavior**: Validate exam completeness (must have start/end times, questions assigned, total marks matching); update status to `PUBLISHED`.

## 7. Business Rules
- An exam can only be published if it contains at least one question and total question marks equal configured total exam marks.
- Modifying questions or deleting an exam is strictly forbidden once student attempts have commenced.
- Scheduled start time must be earlier than scheduled end time, and total window duration must be greater than or equal to exam duration.
- Only approved questions from the Question Bank of the same course can be included in an exam.

## 8. Module Dependencies

### Depends On
- Authentication & Account Management
- RBAC & Authorization
- Institution & Course Management
- Question Bank

### Depends On This Module
- Student Examination
- Grading
- Analytics
- Academic Integrity & Proctoring

## 9. Important States
- Draft
- Scheduled / Published
- Ongoing / Active
- Completed / Closed
- Archived

## 10. Error & Edge Behavior

### Question Bank Deficit for Smart Blueprint
- **Scenario**: Instructor sets blueprint requiring 10 Hard questions on Topic X, but Question Bank only contains 4 approved items.
- **Expected behavior**: Block blueprint generation, highlight deficit, and notify instructor ("Insufficient approved Hard questions in Topic X. Available: 4, Required: 10.").

### Marks Mismatch
- **Scenario**: Sum of selected question marks does not equal configured Total Exam Marks.
- **Expected behavior**: Prevent publication, display warning ("Total question marks (45) do not match configured exam total (50)").

### Edit Attempt on Published Exam with Active Submissions
- **Scenario**: Instructor attempts to alter questions on a published exam while students are currently taking it.
- **Expected behavior**: Lock configuration fields and display warning ("Cannot modify questions: active student attempts exist.").

## 11. Security Considerations
- Answer keys and question source references must be stripped from candidate exam configurations until exam results are finalized.

## 12. Implementation Phases
- **Phase 1 — Exam Creation & Scheduling**: Basic exam setup and schedule configuration.
- **Phase 2 — Manual & Blueprint Assembly**: Manual question picker and Smart Blueprint generation logic.
- **Phase 3 — Preview & Randomization**: Candidate preview mode and randomization settings.
- **Phase 4 — Publishing State Engine**: Publication validation, locking mechanisms, and lifecycle transitions.

## 13. Testing Scope
- Creating exams with manual question selection and verifying question linkages.
- Generating Smart Blueprints with various difficulty slider distributions.
- Validating schedule parameters (start time < end time).
- Verifying preview layout fidelity.
- Testing publication validation checks and edit locks once attempts exist.

## 14. Definition of Done
- Instructors can create, schedule, blueprint, preview, publish, and unpublish exams.
- Smart Blueprint correctly selects questions adhering to difficulty and topic distributions.
- Published exams lock configuration against invalid edits and present correct schedules to enrolled students.
