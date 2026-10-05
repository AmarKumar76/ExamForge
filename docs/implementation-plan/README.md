# ExamForge Module Implementation Plan Framework

## 1. Purpose
This directory contains product-level and system-level **Module Implementation Plans** for ExamForge. Each document defines the functional scope, user flows, business rules, edge behavior, user role interactions, dependencies, testing scope, and Definition of Done (DoD) for a major module identified from the Software Requirements Specification (SRS).

These implementation plans are **product and system specifications**. They define **WHAT** the system should do and **HOW** features behave from a product standpoint. They intentionally **DO NOT** contain code-level architecture, database schemas, API routes, React components, class definitions, or programming instructions.

## 2. Source of Truth
The primary source of truth for all requirements, workflows, and guardrails in these plans is:
- [`docs/SRS.md`](file:///c:/Users/amar7/Desktop/ExamForge/docs/SRS.md) — ExamForge Software Requirements Specification

All module plans derive their specifications directly from `docs/SRS.md` and MUST NOT invent features, change business rules, or deviate from SRS guardrails.

## 3. List of Module Implementation Plans

1. [`authentication.md`](file:///c:/Users/amar7/Desktop/ExamForge/docs/implementation-plan/authentication.md) — Authentication & Account Management
2. [`rbac-authorization.md`](file:///c:/Users/amar7/Desktop/ExamForge/docs/implementation-plan/rbac-authorization.md) — RBAC & Authorization
3. [`institution-course-management.md`](file:///c:/Users/amar7/Desktop/ExamForge/docs/implementation-plan/institution-course-management.md) — Institution & Course Management
4. [`course-material-management.md`](file:///c:/Users/amar7/Desktop/ExamForge/docs/implementation-plan/course-material-management.md) — Course Material Management
5. [`ai-rag-question-generation.md`](file:///c:/Users/amar7/Desktop/ExamForge/docs/implementation-plan/ai-rag-question-generation.md) — AI/RAG Question Generation Studio
6. [`question-bank.md`](file:///c:/Users/amar7/Desktop/ExamForge/docs/implementation-plan/question-bank.md) — Question Bank Management
7. [`exam-management.md`](file:///c:/Users/amar7/Desktop/ExamForge/docs/implementation-plan/exam-management.md) — Exam Management & Blueprints
8. [`student-examination.md`](file:///c:/Users/amar7/Desktop/ExamForge/docs/implementation-plan/student-examination.md) — Student Examination Runner
9. [`grading.md`](file:///c:/Users/amar7/Desktop/ExamForge/docs/implementation-plan/grading.md) — Grading & Evaluation Engine
10. [`analytics.md`](file:///c:/Users/amar7/Desktop/ExamForge/docs/implementation-plan/analytics.md) — Student & Instructor Analytics
11. [`academic-integrity-proctoring.md`](file:///c:/Users/amar7/Desktop/ExamForge/docs/implementation-plan/academic-integrity-proctoring.md) — Academic Integrity & Proctoring
12. [`ai-learning-recommendations.md`](file:///c:/Users/amar7/Desktop/ExamForge/docs/implementation-plan/ai-learning-recommendations.md) — AI Learning Recommendations
13. [`notifications-reporting.md`](file:///c:/Users/amar7/Desktop/ExamForge/docs/implementation-plan/notifications-reporting.md) — Notifications & Data Exports
14. [`audit-logs.md`](file:///c:/Users/amar7/Desktop/ExamForge/docs/implementation-plan/audit-logs.md) — Audit Logs & Compliance
15. [`observability.md`](file:///c:/Users/amar7/Desktop/ExamForge/docs/implementation-plan/observability.md) — Observability & System Health
16. [`ai-adaptive-exam-preparation.md`](file:///c:/Users/amar7/Desktop/ExamForge/docs/implementation-plan/ai-adaptive-exam-preparation.md) — AI-Powered Adaptive Exam Preparation & Practice

## 4. Recommended Implementation Order

Based on the prerequisite dependencies established in `docs/SRS.md`, module implementation should proceed in the following order:

```
[01. Authentication] → [02. RBAC & Authorization]
                              ↓
                [03. Institution & Course Management]
                              ↓
                [04. Course Material Management]
                              ↓
                [05. AI/RAG Question Generation]
                              ↓
                [06. Question Bank Management]
                              ↓
                [07. Exam Management & Blueprints]
                              ↓
                [08. Student Examination Runner]
                              ↓
                [09. Grading & Evaluation Engine]
               /              |              \
 [10. Analytics]  [11. Integrity/Proctoring]  [12. AI Recommendations]
       |                                              |
       +----------------------+-----------------------+
                              ↓
      [16. AI-Powered Adaptive Exam Prep & Practice Engine]
                              ↓
        [13. Notifications] ↔ [14. Audit Logs] ↔ [15. Observability]
```

## 5. Module Dependency Overview

- **Core Foundation Layer**: `Authentication` and `RBAC & Authorization` provide identity verification and role permission enforcement for all higher modules.
- **Academic Context Layer**: `Institution & Course Management` establishes the institutional hierarchy, courses, instructor assignments, and student rosters required by all operational features.
- **Content Creation Layer**: `Course Material Management` ingests curriculum documents, feeding into `AI/RAG Question Generation`, which populates the `Question Bank`.
- **Assessment Delivery Layer**: `Exam Management` picks questions from the `Question Bank` to construct exams; `Student Examination` executes active timed attempts.
- **Evaluation & Intelligence Layer**: `Grading` scores attempts, feeding results to `Analytics`, `Academic Integrity & Proctoring`, `AI Learning Recommendations`, and `AI-Powered Adaptive Exam Preparation & Practice`.
- **Adaptive Preparation Layer**: `AI-Powered Adaptive Exam Preparation & Practice` consumes gap analysis from Analytics, leverages Gemini and RAG for study guidance, generates candidate practice papers, and executes self-assessment attempts using the core exam runner.
- **Cross-Cutting Service Layer**: `Notifications & Reporting`, `Audit Logs`, and `Observability` track events, send alerts, record security ledgers, and monitor health across all modules.

## 6. Relationship Between Modules

```
      +------------------------+
      |  Course Material Upload |
      +-----------+------------+
                  | (Ingestion)
                  v
      +------------------------+      (Approve)      +------------------------+
      |  AI/RAG Question Studio | -----------------> |     Question Bank      |
      +------------------------+                     +-----------+------------+
                                                                 | (Assemble)
                                                                 v
                                                     +------------------------+
                                                     |    Exam Management     |
                                                     +-----------+------------+
                                                                 | (Publish)
                                                                 v
                                                     +------------------------+
                                                     |  Student Examination   |
                                                     +-----------+------------+
                                                                 | (Submit)
                                                                 v
                                                     +------------------------+
                                                     |   Grading & Evaluation |
                                                     +-----------+------------+
                                                                 | (Finalize)
                                         +-----------------------+-----------------------+
                                         |                       |                       |
                                         v                       v                       v
                              +--------------------+  +--------------------+  +--------------------+
                              | Student/Instructor |  | Academic Integrity |  | AI Learning        |
                              | Analytics          |  | Signals            |  | Recommendations    |
                              +---------+----------+  +--------------------+  +----------+---------+
                                        |                                                |
                                        +-----------------------+------------------------+
                                                                | (Gap Analysis & RAG)
                                                                v
                                                     +------------------------+
                                                     |  AI Adaptive Prep &    |
                                                     |  Practice Engine       |
                                                     +------------------------+
```

## 7. Implementation Rules

1. **Strict Product & System Level Scoping**: These files define product functionality, business logic, user interaction flows, and system behavior. They MUST NOT be turned into coding instructions, database schemas, API specs, or code file templates.
2. **Human-in-the-Loop AI**: AI outputs (question generation, grading suggestions) are ALWAYS draft content requiring human instructor authorization.
3. **Non-Punitive Integrity Signals**: Proctoring signals present objective timestamped evidence for human review; automatic cheating convictions are forbidden.
4. **Server-Authoritative Exam Timing**: Exam timers, duration calculations, and deadline enforcement are strictly controlled by server clocks.
5. **Traceability & Auditability**: Sensitive administrative actions (role changes, exam publications, grade overrides) must automatically generate immutable audit entries.
6. **Official vs. Practice Separation**: Candidate practice assessments operate exclusively with `assessmentType: PRACTICE` for self-preparation and can NEVER be converted into official published exams or alter instructor workflows.
7. **Definition of Done Enforcement**: A module is complete only when it satisfies all conditions listed in its respective implementation plan document.
