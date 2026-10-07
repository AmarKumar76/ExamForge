# Question Bank — Implementation Plan

# Status

[PARTIAL]

## Completed

- Question CRUD APIs (`/api/v1/questions`) supporting 6 question types (MCQ, Multi-Select, True/False, Short Answer, Descriptive, Numerical)
- Question categorization by topic, subtopic, difficulty (Easy, Medium, Hard), and allocated marks
- Question status lifecycle management (`DRAFT`, `APPROVED`, `REJECTED`, `ARCHIVED`)
- Search, multi-criteria filtering, and pagination
- Question folders and topic organization
- Import workflow from AI Question Studio into Question Bank
- Unit and integration tests (`server/src/tests/question.test.js`)

## Remaining

- Semantic duplicate and similarity detection scanner against existing question items
- Comprehensive parent-child question versioning chain (`v1.0` -> `v1.1`) when modifying questions used in past exams

## Verification Evidence

- Backend tests: PASS (`server/src/tests/question.test.js`)
- Frontend build: PASS (`npx vite build` succeeded cleanly)
- API verification: PASS (`/api/v1/questions`, `/api/v1/questions/approve`)
- Browser verification: PASS (Question creation, type switching, filtering, and approval workflow verified)
- Relevant files: `server/src/controllers/question.controller.js`, `server/src/models/Question.js`, `client/src/pages/QuestionBankPage.jsx`

## 1. Module Overview
The Question Bank module serves as the central repository for all approved assessment questions within ExamForge. It supports manual question creation, import of approved AI-generated drafts, categorization by topic/difficulty, duplicate detection, question versioning, and reusability across multiple examinations.

## 2. SRS Requirements Covered
- Section 5.4: Question Bank
- Section 6.2: AI Features (Duplicate Detection)

## 3. Module Scope

### In Scope
- Manual creation and editing of assessment questions
- Import and storage of approved AI-generated draft questions
- Support for multiple question types: Multiple Choice (MCQ), Multiple-Select, True/False, Short Answer, Descriptive, Numerical
- Question metadata management: Topic, subtopic, target difficulty (Easy, Medium, Hard), allocated marks, answer keys, explanations, source material references
- Search, filter, sort, and pagination of question repository
- Semantic duplicate and similarity detection across existing questions
- Question versioning and change history tracking
- Question status lifecycle management (Draft, Approved, Rejected, Archived)

### Out of Scope
- AI draft generation prior to approval (handled by AI/RAG Question Generation module)
- Assembling questions into published examinations (handled by Exam Management module)

## 4. User Roles
- **Instructor**: Creates, edits, searches, categorizes, versions, approves, archives, and reuses questions for assigned courses.
- **Institution Admin**: Views question bank statistics and usage across courses.
- **Super Admin**: Monitors global question repository volume and storage.

## 5. User Flow
Instructor selects assigned Course 
→ Opens Question Bank module 
→ Chooses Create Manual Question or Views Approved AI Questions 
→ Fills text, options, answer key, marks, topic, and difficulty 
→ System runs similarity check against existing questions 
→ If unique, system saves question with version history 
→ Question is cataloged into the Question Bank 
→ Question becomes available for selection in Exam Management

## 6. Core Features

### Manual & Imported Question Cataloging
- **Purpose**: Store and categorize assessment questions across multiple types.
- **Expected behavior**: Support rich question fields (text, options, correct answer, explanation, metadata).
- **User interaction**: Complete form fields in Question Studio, select question type, click Save.
- **System behavior**: Store question record with initial version `v1.0`, link to course ID, assign status `APPROVED`.

### Search, Filtering & Organization
- **Purpose**: Enable rapid location and selection of questions.
- **Expected behavior**: Filter questions by topic, subtopic, difficulty, type, status, or keyword search.
- **User interaction**: Select filter dropdowns or type in search bar.
- **System behavior**: Query repository with filter criteria and return paginated result set.

### Semantic Duplicate & Similarity Detection
- **Purpose**: Prevent creation of duplicate or conceptually identical questions.
- **Expected behavior**: Analyze semantic similarity when a question is saved or edited; flag potential duplicates.
- **User interaction**: View similarity warning if a conceptually similar question exists.
- **System behavior**: Compute similarity index against existing course questions; display warning if similarity threshold is exceeded.

### Question Versioning & Lifecycle Management
- **Purpose**: Preserve historical integrity of questions used in past exams when edits occur.
- **Expected behavior**: Editing a question used in a published exam creates a new version (`v1.1`, `v2.0`), keeping past exam references intact.
- **User interaction**: Edit existing question, save changes.
- **System behavior**: Create new version record if question was previously included in a published exam attempt; maintain parent-child version chain.

## 7. Business Rules
- Questions must be assigned to a specific course and topic.
- A question cannot be permanently deleted if it is referenced by a published or completed exam attempt (must be archived instead).
- Question status transitions: `DRAFT` → `APPROVED` / `REJECTED` → `ARCHIVED`.
- Only approved questions can be included in published examinations.

## 8. Module Dependencies

### Depends On
- Authentication & Account Management
- RBAC & Authorization
- Institution & Course Management
- Course Material Management
- AI/RAG Question Generation

### Depends On This Module
- Exam Management
- Student Examination
- Analytics

## 9. Important States
- Draft
- Approved
- Rejected
- Archived
- Superseded (New version available)

## 10. Error & Edge Behavior

### Attempting Hard Delete of Referenced Question
- **Scenario**: Instructor attempts to delete a question used in a historical exam.
- **Expected behavior**: Prevent hard deletion, display message ("Question is used in existing exams and cannot be deleted"), and offer Archive option.

### High Duplicate Similarity Flag
- **Scenario**: Instructor submits a question nearly identical to an existing item.
- **Expected behavior**: Display duplicate alert showing the existing question; allow instructor to view existing item or proceed with saving as distinct question.

### Missing Answer Key for MCQ
- **Scenario**: Instructor attempts to save an MCQ without selecting a correct answer.
- **Expected behavior**: Reject save operation and highlight missing correct answer selection.

## 11. Security Considerations
- Question bank items, especially answer keys, must be protected against unauthorized access or student endpoint exposure.
