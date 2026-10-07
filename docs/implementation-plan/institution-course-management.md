# Institution & Course Management — Implementation Plan

# Status

[COMPLETED]

## Completed

- Super Admin institution CRUD operations (`/api/v1/institutions`)
- Department management and course creation (`/api/v1/courses`)
- Instructor assignment to courses and student course enrollment
- Unique course code constraint per institution
- Active vs Archived status toggles for institutions and courses
- Role dashboard integration showing assigned courses for instructors and enrolled courses for students
- Integration tests (`server/src/tests/course.test.js`)

## Remaining

- None (All core SRS institution and course management requirements are fully implemented and verified)

## Verification Evidence

- Backend tests: PASS (`server/src/tests/course.test.js`)
- Frontend build: PASS (`npx vite build` succeeded cleanly)
- API verification: PASS (`/api/v1/institutions`, `/api/v1/courses`)
- Browser verification: PASS (Course creation and instructor/student course rosters verified in UI)
- Relevant files: `server/src/controllers/course.controller.js`, `server/src/models/Course.js`, `server/src/models/Institution.js`, `client/src/pages/CoursesPage.jsx`

## 1. Module Overview
The Institution & Course Management module handles the structural organization of ExamForge. It manages institutions, academic departments, courses, instructor assignments, and student enrollments, establishing the academic framework required for question generation, examination delivery, and performance analytics.

## 2. SRS Requirements Covered
- Section 4: User Roles (Super Admin, Institution Admin, Instructor, Student)
- Section 5.3: Institution & Course Management

## 3. Module Scope

### In Scope
- Creation, editing, and archiving of institutions
- Department structure definition within institutions
- Course creation, configuration, and status tracking (Active/Archived)
- Instructor assignment to specific courses
- Student enrollment and roster management (Individual or batch enrollment)
- Institution-level user directory administration

### Out of Scope
- Uploading and managing course learning materials (handled by Course Material Management module)
- Creating examination blueprints or scheduling exams (handled by Exam Management module)

## 4. User Roles
- **Super Admin**: Creates, edits, and archives institutions; provisions Institution Admins.
- **Institution Admin**: Manages departments, creates courses, assigns instructors, and manages student rosters.
- **Instructor**: Views assigned courses and student rosters for their courses.
- **Student**: Views enrolled courses and course details.

## 5. User Flow
Institution Admin opens Management Panel 
→ Selects or creates a Department 
→ Defines new Course details (Name, Code, Syllabus parameters) 
→ Assigns authorized Instructors to the Course 
→ Enrolls Students into Course roster 
→ System saves course configuration and updates role dashboards 
→ Instructors and Students see updated course in their active course list

## 6. Core Features

### Institution Administration
- **Purpose**: Provision and manage enterprise educational institutions on the platform.
- **Expected behavior**: Super Admin can add institutions, assign unique codes, configure institution settings, and activate/archive access.
- **User interaction**: Super Admin navigates to Institution Panel, inputs details, and clicks Save.
- **System behavior**: Create institution record, initialize default settings, and enable admin onboarding.

### Course & Department Creation
- **Purpose**: Organize academic offerings into structured departments and courses.
- **Expected behavior**: Institution Admin can define department branches and create courses linked to specific departments.
- **User interaction**: Admin selects department, clicks Create Course, fills course code/title, and submits.
- **System behavior**: Validate unique course code within institution and store active course record.

### Instructor Assignment & Student Roster Management
- **Purpose**: Link academic staff and candidates to specific courses.
- **Expected behavior**: Assign one or more instructors to a course; enroll or unenroll students individually or via batch upload.
- **User interaction**: Admin opens Course Roster tab, selects users from institution directory, and clicks Assign/Enroll.
- **System behavior**: Update course assignment mappings and grant course-scoped access permissions.

## 7. Business Rules
- Course codes must be unique within an institution.
- An instructor can only manage course material, questions, and exams for courses they are explicitly assigned to.
- Students can only view exams and results for courses in which they are actively enrolled.
- Archiving an institution or course preserves historical exam data, attempts, and audit logs while preventing new actions.

## 8. Module Dependencies

### Depends On
- Authentication & Account Management
- RBAC & Authorization

### Depends On This Module
- Course Material Management
- Question Bank
- Exam Management
- Student Examination
- Analytics

## 9. Important States
- Active Institution / Archived Institution
- Draft Course / Active Course / Archived Course
- Enrolled Student / Withdrawn Student

## 10. Error & Edge Behavior

### Duplicate Course Code
- **Scenario**: Admin attempts to create a course with a code that already exists in the institution.
- **Expected behavior**: Reject creation with message "Course code already exists within this institution."

### Unassigned Instructor Access
- **Scenario**: Instructor attempts to access a course they are not assigned to.
- **Expected behavior**: Block access via RBAC and display "You are not assigned to this course."

### Student Batch Roster Error
- **Scenario**: Batch roster enrollment file contains invalid email formats or missing student IDs.
- **Expected behavior**: Reject invalid rows, process valid entries, and display detailed line-by-line validation summary.

## 11. Security Considerations
- Institution Admins cannot view or modify courses belonging to another institution.
- Roster modification actions must generate audit log entries.

