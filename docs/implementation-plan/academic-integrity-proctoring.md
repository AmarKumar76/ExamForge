# Academic Integrity & Proctoring — Implementation Plan

## 1. Module Overview
The Academic Integrity & Proctoring module provides a signal-based evidence monitoring engine for online examinations. It collects permissible client environment events (tab focus switches, fullscreen exits, copy/paste attempts, unusual timing, semantic answer similarity, connection anomalies), compiles them into a structured integrity dashboard, and surfaces objective evidence to instructors. The module operates on a strict non-punitive principle: proctoring signals serve as objective review evidence for human instructor evaluation and NEVER trigger automatic cheating convictions.

## 2. SRS Requirements Covered
- Section 3.2: Out of Scope (Fully autonomous AI proctoring that declares a student guilty is out of scope)
- Section 6.2: AI Features (Integrity Assistance & Answer Similarity)
- Section 8: Academic Integrity & Proctoring (Signal Types & Integrity Dashboard)
- Section 15: Security Requirements (Proctoring Data Retention & Privacy)

## 3. Module Scope

### In Scope
- Monitored Browser Event Signals: Browser tab/window focus changes, Fullscreen exits, Observable copy/paste attempts, Connection anomalies
- Analytical Signals: Unusual answer submission timing, Semantic answer text similarity between student submissions
- Optional Advanced Signals: Face presence signal, Multiple person signal (where configured)
- Integrity Dashboard: Real-time candidate monitoring, risk indicator flags (Low, Medium, High), timeline event logs, frequency counts, and review actions
- Semantic Similarity Engine: Cross-submission text comparison for subjective responses
- Instructor Review & Event Verification Workflow

### Out of Scope
- Automatic cheating verdicts or automatic attempt cancellations without human instructor intervention
- Audio recording or keystroke logging beyond permitted browser events
- Native desktop lock-down software dependencies

## 4. User Roles
- **Instructor**: Views live and post-exam Integrity Dashboard, inspects event timelines, compares flagged similar answers, and records human review determinations.
- **Student**: Receives clear pre-exam disclosure regarding monitored signals; views active proctoring status indicator during test taking.
- **Institution Admin / Super Admin**: Views institution-level integrity signal trends and compliance logs.

## 5. User Flow
Student starts exam attempt and acknowledges proctoring disclosure 
→ During exam, system monitors permitted browser visibility and interaction events 
→ System streams integrity events (e.g., tab switch, fullscreen exit) asynchronously to server 
→ Server logs timestamped events under attempt record and computes cumulative risk score 
→ Post-exam, Semantic Similarity Engine compares subjective answers across submissions 
→ Instructor opens Integrity Dashboard for the exam 
→ Instructor filters by Risk Level (High / Medium / Low), inspects timeline of events, and reviews flagged similar answers 
→ Instructor records manual review note (e.g., "Cleared", "Needs Follow-up", "Invalidated") 
→ System records review decision in audit log.

## 6. Core Features

### Signal Collection & Event Streaming
- **Purpose**: Log objective candidate interaction events during test execution.
- **Expected behavior**: Capture browser visibility changes, window blur, copy/paste, and disconnects accurately with server timestamps.
- **User interaction**: Transparent to student during test taking; visual banner indicates active integrity monitoring.
- **System behavior**: Listen to client browser visibility and window events, append metadata (timestamp, duration), and transmit via real-time WebSocket or REST payload.

### Semantic Answer Similarity Analysis
- **Purpose**: Detect potential collusion or copied responses in subjective text questions.
- **Expected behavior**: Analyze semantic similarity across all student submissions for descriptive questions post-exam; highlight pairs exceeding similarity threshold.
- **User interaction**: Instructor views "Similarity Analysis" tab, selects flagged candidate pair, and views side-by-side text comparison.
- **System behavior**: Compute embedding vectors for text responses, calculate cosine similarity scores, flag pairs >80% similarity, and render comparison diff view.

### Instructor Integrity Dashboard
- **Purpose**: Provide authorized instructors with a unified evidence review panel.
- **Expected behavior**: Display student list, overall risk category, event breakdown count, chronological timeline, and review decision controls.
- **User interaction**: Click candidate row, view detailed event timeline, select action (Clear, Request Explanation, Flag for Committee).
- **System behavior**: Aggregate integrity events per candidate attempt, compute objective risk category indicator, save instructor decision and comments.

## 7. Business Rules & Non-Punitive Guardrails
- **Non-Punitive Principle**: System signals are evidence items ONLY. The system must NEVER automatically terminate an exam or issue a cheating verdict without instructor review.
- **Transparent Disclosure**: Candidates must be clearly informed of all monitored signals before beginning an exam.
- **Privacy & Data Minimization**: Integrity event data must be retained only for the minimum period required for academic review and deleted per privacy policies.
- **Instructor Control**: Only assigned course instructors or authorized institution admins can access integrity dashboards.

## 8. Module Dependencies

### Depends On
- Authentication & Account Management
- RBAC & Authorization
- Institution & Course Management
- Exam Management
- Student Examination

### Depends On This Module
- Analytics
- Audit Logs

## 9. Important States
- Monitoring Active
- Signals Logged
- Similarity Analysis Processing
- Pending Instructor Review
- Instructor Reviewed — Cleared
- Instructor Reviewed — Flagged

## 10. Error & Edge Behavior

### False Positive Tab Switch (System Popup)
- **Scenario**: Operating system update popup causes browser focus loss for 2 seconds.
- **Expected behavior**: Log event with exact duration (2s); present event neutrally on timeline for instructor contextual evaluation.

### Brief Network Interruption Misclassified as Disconnect
- **Scenario**: Transient packet loss causes 3-second connection drop.
- **Expected behavior**: Categorize event as `Connection Anomaly` rather than suspicious behavior; auto-resume session cleanly.

### Short Generic Response Triggering False Similarity
- **Scenario**: Two students write short 3-word identical answers (e.g., "Photosynthesis converts light").
- **Expected behavior**: Ignore short responses under minimum word count threshold during semantic similarity scanning.

## 11. Security Considerations
- Integrity event streams must be cryptographically bound to the active student attempt session to prevent signal spoofing.
- Access to camera presence signals or similarity reports must require instructor-level RBAC authentication.

## 12. Implementation Phases
- **Phase 1 — Event Signal Collector**: Client browser event listeners (tab switch, fullscreen exit, copy/paste) and server log storage.
- **Phase 2 — Semantic Similarity Engine**: Post-exam NLP text similarity scanner for descriptive responses.
- **Phase 3 — Integrity Dashboard UI**: Candidate list, risk level indicators, event timeline modal, and side-by-side similarity view.
- **Phase 4 — Instructor Decision Workflow**: Decision logging, comment attachment, and audit log integration.

## 13. Testing Scope
- Accurate logging of tab switch and fullscreen exit events with exact timestamps.
- Verifying that zero automated cheating convictions occur.
- Semantic similarity scanner detection on identical and paraphrased descriptive answers.
- Display of side-by-side answer comparisons in the Integrity Dashboard.
- Instructor review decision logging.

## 14. Definition of Done
- Instructors receive clear, timestamped integrity signal timelines and side-by-side semantic similarity comparisons.
- No automated cheating verdicts or automatic cancellations are performed by the system.
- Instructors can record manual review decisions and notes cleanly.
