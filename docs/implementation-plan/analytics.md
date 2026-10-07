# Analytics — Implementation Plan

# Status

[PARTIAL]

## Completed

- Student performance result view (`/api/v1/analytics/student/:attemptId`) calculating score, percentage, correct/incorrect counts, and topic accuracy
- Instructor exam analytics (`/api/v1/analytics/exam/:examId`) computing class average, highest score, lowest score, and score distribution histograms
- Admin platform metrics (`/api/v1/analytics/admin/overview`) providing active user, course, and exam submission counts
- Interactive UI dashboard with score distribution charts (`InstructorAnalyticsPage.jsx`)
- Integration tests (`server/src/tests/analytics.test.js`)

## Remaining

- Granular question-level time-spent analytics (measuring average seconds spent per question)
- Cohort-level automated AI insights summary text card

## Verification Evidence

- Backend tests: PASS (`server/src/tests/analytics.test.js`)
- Frontend build: PASS (`npx vite build` succeeded cleanly)
- API verification: PASS (`/api/v1/analytics/student/:attemptId`, `/api/v1/analytics/exam/:examId`, `/api/v1/analytics/admin/overview`)
- Browser verification: PASS (Instructor exam average, score histograms, and student topic performance breakdown verified)
- Relevant files: `server/src/controllers/analytics.controller.js`, `client/src/pages/InstructorAnalyticsPage.jsx`, `client/src/pages/ResultPage.jsx`

## 1. Module Overview
The Analytics module delivers comprehensive data intelligence and performance visualizations across ExamForge. It provides multi-tiered insights: candidate-level reports detailing accuracy, topic mastery, and time usage for Students; aggregated performance distributions, question discrimination metrics, topic weakness identification, and AI insights for Instructors; and institutional compliance metrics for Administrators.

## 2. SRS Requirements Covered
- Section 5.8: Analytics
- Section 9: Grading & Analytics (Student Analytics & Instructor Analytics)
- Section 6.2: AI Features (Learning Gap Detection)

## 3. Module Scope

### In Scope
- Student Analytics: Overall score, percentage, correct/incorrect/unattempted counts, total time spent, topic-wise accuracy, exam history, and answer key review (if enabled)
- Instructor Exam Analytics: Class average, highest/lowest score, score distribution histograms, question correctness rates, average time spent per question, topic performance, and difficulty breakdown
- Learning Gap Detection: Automated identification of weak topics across candidates and cohorts
- AI-Generated Learning Insights: Generative summary of class performance trends and concept deficiencies
- Institution & System Analytics: Aggregate completion rates, active user metrics, and course exam statistics

### Out of Scope
- Direct generation of practice questions (handled by AI Learning Recommendations module)
- Live real-time candidate proctoring event streams (handled by Academic Integrity & Proctoring module)

## 4. User Roles
- **Student**: Views personal exam analytics, topic strength/weakness charts, accuracy breakdowns, and exam performance history.
- **Instructor**: Views comprehensive exam analytics, question item analysis, topic distributions, score histograms, and AI class insights.
- **Institution Admin**: Views institution-wide course analytics, department averages, and completion metrics.
- **Super Admin**: Views platform-wide system analytics, operational metrics, and user growth.

## 5. User Flow
Instructor selects completed Exam 
→ Opens Analytics Dashboard 
→ System computes aggregated score metrics (Average, Highest, Lowest, Standard Deviation) 
→ Displays interactive Score Distribution Histogram and Question Analysis table 
→ Displays Topic Performance Radar/Bar charts highlighting weak concept areas 
→ Generates AI Class Learning Insights summary 
→ Instructor reviews insights and exports summary report 
*(For Students: Student opens Result page → views personal score breakdown, topic performance bars, and time spent analysis).*

## 6. Core Features

### Student Performance Dashboard
- **Purpose**: Provide candidates with clear performance breakdown and learning gap visibility.
- **Expected behavior**: Display overall score, percentage, rank/percentile (if configured), time spent, correct/incorrect/unattempted counts, and topic mastery bars.
- **User interaction**: Student views Result screen, toggles between Overview, Topic Breakdown, and Answer Key tabs.
- **System behavior**: Aggregate attempt data, calculate percentage metrics, and render topic mastery breakdown.

### Instructor Exam Analytics & Item Analysis
- **Purpose**: Provide instructors with deep psychometric insights into exam performance and question quality.
- **Expected behavior**: Display class average, highest/lowest scores, score distribution chart, item-wise correctness percentage, and average time spent per question.
- **User interaction**: Instructor selects Exam, interacts with charts, filters by topic/difficulty, and inspects individual question statistics.
- **System behavior**: Process attempt collection data, aggregate metrics across all submissions, compute question correctness rates, and render performance charts.

### Learning Gap Detection & AI Insights
- **Purpose**: Identify specific conceptual weaknesses in candidates and cohorts automatically.
- **Expected behavior**: Highlight topics where candidate or class accuracy falls below threshold; generate AI commentary summarizing key learning gaps.
- **User interaction**: View "Identified Learning Gaps" section and AI Insights card on Analytics dashboard.
- **System behavior**: Analyze topic accuracy scores, flag topics below mastery threshold, feed performance data to AI service, and display generated commentary.

## 7. Business Rules
- Student analytics are accessible only after exam results are officially finalized and published by the instructor.
- Answer key breakdown visibility to students is governed by exam-level publication settings.
- Analytics calculations must dynamically exclude unsubmitted or in-progress attempts.
- Instructors can view analytics only for courses to which they are assigned.

## 8. Module Dependencies

### Depends On
- Authentication & Account Management
- RBAC & Authorization
- Institution & Course Management
- Exam Management
- Student Examination
- Grading

### Depends On This Module
- AI Learning Recommendations
- Notifications & Reporting

## 9. Important States
- Analytics Pending (No Submissions)
- Preliminary Analytics (Partial Submissions)
- Finalized Analytics (All Graded & Published)

## 10. Error & Edge Behavior

### Zero Submissions
- **Scenario**: Instructor opens analytics for a published exam with zero completed attempts.
- **Expected behavior**: Display empty state graphic ("No completed attempts submitted yet").

### Single Submission Outlier
- **Scenario**: Only one student has submitted the exam.
- **Expected behavior**: Display individual metrics cleanly; suppress distribution histograms and standard deviation metrics until minimum sample size is reached.

### All Students Incorrect on Question
- **Scenario**: 100% of students got Question X wrong.
- **Expected behavior**: Flag Question X with a high-priority "Question Flaw Warning" on the instructor item analysis view.

## 11. Security Considerations
- Student individual scores must remain strictly confidential and visible only to the candidate, assigned instructors, and authorized admins.

## 12. Implementation Phases
- **Phase 1 — Student Analytics View**: Individual score calculation, time tracking, and topic accuracy breakdown.
- **Phase 2 — Instructor Class Analytics**: Class averages, score distribution histograms, and question correctness analysis.
- **Phase 3 — Learning Gap Detection**: Automated topic mastery calculation and concept weakness flagging.
- **Phase 4 — AI Insights Generation**: Integration of generative AI insights for cohort summary reports.

## 13. Testing Scope
- Verifying score averages, percentages, and distribution calculations.
- Verifying question correctness rate calculations.
- Testing topic weakness identification logic when scores fall below threshold.
- Verifying student result access restrictions until published.
- Testing responsive chart rendering across devices.

## 14. Definition of Done
- Students can view detailed personal performance and topic accuracy reports upon result release.
- Instructors receive complete class performance metrics, score distributions, item analysis, and AI learning insights.
