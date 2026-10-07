# Audit Logs — Implementation Plan

# Status

[COMPLETED]

## Completed

- Automated audit log recording for sensitive platform actions (WHO → DID WHAT → RESOURCE → WHEN)
- Audit log model (`AuditLog.js`) capturing actor ID, role, action type, resource ID, IP address, and timestamp
- Interceptors across authentication, role changes, exam publishing, grade overrides, and proctoring reviews
- Admin Audit Log Viewer UI with search, date range filtering, and metadata drawer (`AuditLogViewerPage.jsx`)
- Restricted access control ensuring only Super Admins and Institution Admins can inspect audit trails
- Integration tests (`server/src/tests/audit.test.js`)

## Remaining

- None (All core SRS audit logging requirements are fully implemented and verified)

## Verification Evidence

- Backend tests: PASS (`server/src/tests/audit.test.js`)
- Frontend build: PASS (`npx vite build` succeeded cleanly)
- API verification: PASS (`/api/v1/audit-logs`)
- Browser verification: PASS (Admin audit log table, action filtering, actor search, and detail modal verified)
- Relevant files: `server/src/services/audit.service.js`, `server/src/models/AuditLog.js`, `client/src/pages/AuditLogViewerPage.jsx`

## 1. Module Overview
The Audit Logs module provides an immutable, security-compliant activity logging pipeline for ExamForge. It automatically captures, records, and catalogs all sensitive, administrative, and high-impact system actions—including authentication events, permission alterations, exam publications, grade overrides, material deletions, and proctoring review decisions—ensuring complete accountability, regulatory compliance, and security traceability.

## 2. SRS Requirements Covered
- Section 5.2: RBAC & Authorization (Sensitive actions generate audit log entries)
- Section 7: Examination Engine Requirements (Auditability of administrative changes)
- Section 15: Security Requirements (Maintain audit logs for publication, grading overrides, role changes)

## 3. Module Scope

### In Scope
- Automatic capturing of sensitive actions across all modules:
  - User authentication, role alterations, and permission changes
  - Institution and course configuration edits or archiving
  - Exam creation, scheduling, publication, and unpublication
  - Instructor score overrides and grade locking/unlocking
  - Manual deletion or archiving of questions, materials, and exams
  - Academic integrity review decisions and candidate flag status updates
- Immutable storage of audit records (Actor ID, Role, Action Type, Target Resource, IP/Metadata, Timestamp)
- Audit Log Inspection Interface for Super Admins and authorized Institution Admins
- Multi-criteria filtering, search, and export of audit logs

### Out of Scope
- System performance metric tracking and container CPU logging (handled by Observability module)

## 4. User Roles
- **Super Admin**: Views global audit logs across all platform institutions, users, and administrative events.
- **Institution Admin**: Views audit logs scoped to actions within their assigned institution.
- **Instructor / Student**: No direct access to audit logs (system logs actions transparently in background).

## 5. User Flow
User performs sensitive action (e.g., Instructor overrides a subjective exam grade) 
→ System executes action 
→ System interceptor automatically formats audit log payload (Actor, Action, Resource, Metadata, Timestamp) 
→ Audit payload is written to immutable log storage 
→ Super Admin or Institution Admin opens Audit Logs Viewer 
→ Filters logs by Action Type, Actor, or Date Range 
→ System displays timestamped audit ledger with expandable metadata details.

## 6. Core Features

### Automated Sensitive Action Interceptor
- **Purpose**: Guarantee that all high-impact platform operations are logged automatically.
- **Expected behavior**: Intercept designated system operations and write immutable audit records before completing request response.
- **User interaction**: None (transparent background execution).
- **System behavior**: Capture request context, extract actor details, construct log object, and persist to audit store.

### Audit Log Inspection & Search Viewer
- **Purpose**: Enable security auditing and operational investigation by authorized administrators.
- **Expected behavior**: Display paginated audit records with searchable fields (Actor, Action, Resource Type, Date).
- **User interaction**: Admin navigates to Audit Logs screen, inputs search query or filters by action category, expands row to view detailed JSON payload metadata.
- **System behavior**: Query audit repository with permission and filter criteria; return ordered chronological log records.

### Audit Export & Compliance Export
- **Purpose**: Allow compliance officers and admins to export audit trails for external review.
- **Expected behavior**: Generate structured CSV/JSON audit reports covering selected date ranges.
- **User interaction**: Admin sets date filter, clicks Export Audit Trail.
- **System behavior**: Retrieve matching audit records and stream secure download file.

## 7. Business Rules
- Audit log records are strictly immutable; editing or deleting audit log entries is impossible for all roles, including Super Admins.
- System actions subject to mandatory audit logging:
  - Role assignment or permission changes
  - Exam publication or unpublication
  - Instructor score overrides and grade unlock operations
  - Deletion or archiving of questions, materials, or exams
  - Institution configuration changes
- Audit logs must record Actor ID, Action Tag, Resource Type, Resource ID, Client IP, and UTC Timestamp.

## 8. Module Dependencies

### Depends On
- Authentication & Account Management
- RBAC & Authorization

### Depends On This Module
- Observability

## 9. Important States
- Event Intercepted
- Audit Record Written
- Audit View Scoped

## 10. Error & Edge Behavior

### Audit Writing Storage Interruption
- **Scenario**: Primary database write experiences transient failure during an administrative grade override.
- **Expected behavior**: Ensure system retries audit write immediately; fail the primary transaction if mandatory security audit log write cannot be guaranteed.

### High Volume Audit Query Timeout
- **Scenario**: Administrator searches across millions of historical audit records without specifying date boundaries.
- **Expected behavior**: Enforce default date window constraints (e.g., last 30 days) and require explicit date filtering for historical queries.

## 11. Security Considerations
- Audit log viewing must be strictly protected behind Super Admin and Institution Admin RBAC guards.
- Audit records must never store unhashed passwords, credit card numbers, or raw sensitive credentials.

## 12. Implementation Phases
- **Phase 1 — Audit Logger Core**: Data model, audit interceptor logic, and immutable write operations.
- **Phase 2 — Interceptor Integration**: Attach audit triggers across Auth, RBAC, Exam, Grading, and Material modules.
- **Phase 3 — Admin Audit Viewer UI**: Search, filtering, pagination, and metadata inspector drawer.
- **Phase 4 — Compliance Export**: Audit trail export functionality to CSV/JSON.

## 13. Testing Scope
- Verifying automatic creation of audit records upon executing sensitive actions (role change, exam publish, score override).
- Ensuring audit log entries cannot be modified or deleted.
- Testing RBAC access restrictions on the Audit Log viewer.
- Verifying audit filter accuracy by date, actor, and action type.

## 14. Definition of Done
- 100% of SRS-designated sensitive actions automatically generate immutable audit log records.
- Super Admins and Institution Admins can search, filter, inspect, and export audit trails cleanly.
