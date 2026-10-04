# AI Learning Recommendations — Implementation Plan

## 1. Module Overview
The AI Learning Recommendations module closes the learning loop between examination assessment and student study. By analyzing student exam performance, topic accuracy rates, and identified conceptual gaps, the module generates personalized revision topic roadmaps and recommends targeted practice questions to help candidates improve weak areas.

## 2. SRS Requirements Covered
- Section 2: Product Vision and Goals (G6: Close the Learning Loop)
- Section 5.8: Analytics (AI-generated study/revision recommendations)
- Section 6.2: AI Features (Personalized Recommendations)
- Section 9.1: Student Analytics (Recommended revision topics and practice questions)

## 3. Module Scope

### In Scope
- Post-exam student topic mastery analysis
- Automated mapping of weak topics (accuracy below mastery threshold) to course curriculum concepts
- AI-generated personalized study recommendations summarizing key concepts to review
- Recommendation of targeted practice questions selected from the Question Bank for weak topics
- Student revision progress tracking

### Out of Scope
- Full LMS course delivery, video streaming, or textbook hosting (out of initial release scope)
- Automatic grade adjustments based on completed practice questions

## 4. User Roles
- **Student**: Views personalized revision recommendations, target review topics, and recommended practice questions after exam results are published.
- **Instructor**: Views aggregate class topic weakness summaries and recommended revision actions for the cohort.
- **Institution Admin**: Views overall student improvement metrics across departments.

## 5. User Flow
Student views published Exam Results 
→ Opens "Personalized Revision Plan" tab 
→ System identifies topics where accuracy fell below mastery threshold (e.g., <60%) 
→ AI engine generates personalized study summary highlighting key concepts needing review 
→ System presents a curated list of recommended practice questions for weak topics 
→ Student completes practice questions to test updated understanding 
→ System tracks revision activity and updates candidate topic mastery index.

## 6. Core Features

### Weak Topic Identification & Recommendation Engine
- **Purpose**: Pinpoint candidate conceptual weaknesses automatically following exam evaluation.
- **Expected behavior**: Calculate topic-wise score percentages; flag topics failing to meet mastery criteria.
- **User interaction**: Student views "Topics Needing Attention" cards on performance report.
- **System behavior**: Filter attempt answer scores by topic tag, compute percentage accuracy, and flag sub-threshold topics.

### Personalized AI Study Guidance
- **Purpose**: Provide clear, actionable revision advice tailored to individual performance.
- **Expected behavior**: Generate concise concept summaries explaining what the candidate should review and why.
- **User interaction**: Read "AI Study Guide" summary section on Student Analytics screen.
- **System behavior**: Pass weak topic metadata and question performance to AI service; retrieve structured study recommendations.

### Targeted Practice Question Recommendation
- **Purpose**: Offer candidates immediate practice opportunities on weak topics.
- **Expected behavior**: Select approved, unattempted practice questions from the Question Bank matching the candidate's weak topics.
- **User interaction**: Click "Practice Weak Topics", answer recommended practice items, receive immediate explanation feedback.
- **System behavior**: Query Question Bank for approved items matching weak topic IDs, exclude previously answered exam questions, and render practice runner.

## 7. Business Rules
- Learning recommendations are generated ONLY after exam results are finalized and published.
- Practice questions recommended to students must be marked as approved for practice and must not expose unreleased active exam items.
- AI study guidance must strictly adhere to the course syllabus and approved course material scope.

## 8. Module Dependencies

### Depends On
- Authentication & Account Management
- RBAC & Authorization
- Institution & Course Management
- Question Bank
- Exam Management
- Student Examination
- Grading
- Analytics

### Depends On This Module
- Notifications & Reporting

## 9. Important States
- Analysis Pending (Results Not Published)
- Revision Plan Generated
- Practice In Progress
- Topic Mastery Updated

## 10. Error & Edge Behavior

### High Performance Across All Topics
- **Scenario**: Student achieves 100% accuracy across all exam topics.
- **Expected behavior**: Display congratulations message ("Mastery Achieved!") and offer advanced enrichment topics or optional challenge practice questions.

### No Practice Questions Available for Weak Topic
- **Scenario**: Question Bank contains no additional practice items for an identified weak topic.
- **Expected behavior**: Provide text-based AI study guide and notify instructor of practice question deficit in that topic tag.

## 11. Security Considerations
- Recommended practice items must never include questions from upcoming or unpublished exams.

## 12. Implementation Phases
- **Phase 1 — Topic Weakness Calculation**: Calculation of topic accuracy thresholds post-exam.
- **Phase 2 — AI Guidance Generation**: AI prompt construction and personalized study text generation.
- **Phase 3 — Practice Selector**: Logic for selecting matching practice questions from the Question Bank.
- **Phase 4 — Student Practice Interface**: Candidate practice mode with immediate explanation feedback.

## 13. Testing Scope
- Accurate identification of weak topics based on configurable accuracy thresholds.
- Generation of relevant AI study recommendations matching student weak areas.
- Correct selection of practice questions tagged with weak topics.
- Exclusion of active exam questions from practice recommendations.

## 14. Definition of Done
- Students receive automated, personalized topic revision guidance after exam publishing.
- Targeted practice questions are recommended for weak topics without exposing live exam papers.
