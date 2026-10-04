# Grading & Evaluation — Implementation Plan

## 1. Module Overview
The Grading & Evaluation module processes assessment attempts to calculate student scores, apply marking rules, perform automated objective grading, provide AI-assisted rubric evaluation for subjective questions, enable instructor score overrides, and finalize results for release.

## 2. SRS Requirements Covered
- Section 5.7: Grading
- Section 6.2: AI Features (Subjective Grading Assistance)
- Section 9: Grading & Analytics

## 3. Module Scope

### In Scope
- Instant automated grading for objective question types (MCQ, Multiple-Select, True/False, Numerical)
- Configurable positive marking and negative marking penalty calculation
- Rubric-based subjective grading workflow for Short Answer and Descriptive questions
- AI-assisted subjective evaluation generating suggested scores and feedback based on instructor rubrics
- Manual instructor review, score override, and feedback editing interface
- Grade calculation aggregation (Total Score, Percentage, Pass/Fail determination)
- Result finalization, locking, and release state management

### Out of Scope
- Student analytics dashboard visual rendering (handled by Analytics module)
- Live exam response capturing during test taking (handled by Student Examination module)

## 4. User Roles
- **Instructor**: Evaluates subjective responses, reviews AI grading suggestions, inputs/overrides scores, provides feedback, and finalizes exam results.
- **Student**: Views finalized grades, score breakdown, question correctness (if permitted), and instructor feedback.
- **Institution Admin**: Views overall grade distributions and grading completion progress across courses.

## 5. User Flow
Student submits exam attempt 
→ System instantly grades objective questions (MCQ, True/False, Numerical) and applies negative marking rules 
→ Attempt status updates to `SUBMITTED` / `PENDING_GRADING` 
→ Instructor opens Grading Studio for the exam 
→ For subjective responses, system displays student answer alongside instructor rubric and AI-suggested score/feedback 
→ Instructor accepts AI suggestion OR overrides score and edits feedback 
→ Instructor submits evaluated scores for all candidates 
→ Instructor clicks Finalize & Publish Grades 
→ System calculates final total scores, updates attempt status to `GRADED` / `PUBLISHED`, and releases results to students.

## 6. Core Features

### Instant Objective Auto-Grading & Negative Marking
- **Purpose**: Instantly calculate accurate scores for objective question types upon submission.
- **Expected behavior**: Compare student selections against answer key; award full marks for correct answers, zero for unattempted, and deduct configured negative marks for incorrect options.
- **User interaction**: None for instructor (computes automatically upon attempt submission).
- **System behavior**: Evaluate answer payload against answer key, compute net score per question, and record objective subtotal.

### AI Rubric-Assisted Subjective Grading
- **Purpose**: Assist instructors in evaluating descriptive and short-answer responses quickly and consistently.
- **Expected behavior**: Compare student response text against instructor rubric and model answer; generate suggested score and constructive feedback.
- **User interaction**: Instructor views subjective question card in Grading Studio; sees student response, model answer, rubric, and AI-Suggested Score box.
- **System behavior**: Process response through AI evaluation service, compute semantic adherence to rubric, and present draft score/feedback.

### Instructor Score Override & Grade Finalization
- **Purpose**: Ensure instructors maintain full authority over all student evaluations ("Human-in-the-Loop").
- **Expected behavior**: Instructor can override any automated or AI-suggested score, input custom comments, and lock final results.
- **User interaction**: Edit score input box, type feedback comments, click Finalize Results.
- **System behavior**: Store final instructor-approved score, recalculate total exam percentage, lock attempt against further edits, update status to `GRADED`.

## 7. Business Rules
- Objective questions must grade instantly upon exam submission.
- AI subjective evaluation provides suggestions ONLY; grades do NOT become official until reviewed or finalized by an instructor.
- Instructor overrides take absolute precedence over AI-suggested or automated scores.
- Total exam percentage must account for positive marks, negative marking penalties, and subjective score allocations.
- Finalized/published grades are locked and cannot be altered without generating an explicit audit log entry.

## 8. Module Dependencies

### Depends On
- Authentication & Account Management
- RBAC & Authorization
- Institution & Course Management
- Question Bank
- Exam Management
- Student Examination

### Depends On This Module
- Analytics
- AI Learning Recommendations
- Notifications & Reporting

## 9. Important States
- Pending Grading
- Partially Graded (Objective Complete, Subjective Pending)
- AI Evaluation Suggested
- Instructor Reviewed
- Graded & Locked
- Published to Students

## 10. Error & Edge Behavior

### Missing Rubric for Subjective Question
- **Scenario**: Instructor attempts to request AI grading assistance for a descriptive question that has no evaluation rubric defined.
- **Expected behavior**: Prompt instructor to define evaluation criteria or manually grade response without AI assistance.

### Negative Score Floor
- **Scenario**: Severe negative marking penalties result in a net calculated score below zero.
- **Expected behavior**: Enforce minimum total score boundary of 0 (unless institution policy explicitly permits negative overall exam totals, marked as "Requires product decision.").

### Attempt Edit After Result Lock
- **Scenario**: User attempts to modify a grade after exam results have been locked and published.
- **Expected behavior**: Prevent modification unless privileged instructor re-opens grading with mandatory audit reason entry.

## 11. Security Considerations
- Correct answers and grading rubrics must remain hidden from students until results are officially published by the instructor.
- All grade overrides must record instructor identity and timestamp for audit compliance.

## 12. Implementation Phases
- **Phase 1 — Objective Auto-Grading Engine**: Automated evaluation for MCQ, True/False, and Numerical questions with negative marking.
- **Phase 2 — Instructor Grading Studio UI**: Subjective review interface, rubric display, and manual score entry.
- **Phase 3 — AI Subjective Evaluation**: AI rubric scoring pipeline and suggestion generation.
- **Phase 4 — Finalization & Locking**: Grade aggregation, result publishing, and override audit tracking.

## 13. Testing Scope
- Verifying objective grading accuracy across MCQ, Multi-Select, True/False, and Numerical questions.
- Testing negative marking penalty calculations.
- Verifying AI subjective score suggestion alignment with instructor rubrics.
- Testing instructor score override and feedback editing.
- Verifying result locking once published.

## 14. Definition of Done
- Objective questions grade automatically upon exam submission.
- Subjective questions feature AI rubric suggestions with seamless instructor score override.
- Finalized grades are locked, recorded accurately, and released to student dashboards.
