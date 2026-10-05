# AI/RAG Question Generation — Implementation Plan

## 1. Module Overview
The AI/RAG Question Generation module provides intelligent, context-grounded assessment item drafting from instructor-approved course materials. Using Retrieval-Augmented Generation (RAG), the module extracts text, chunks content with metadata, indexes vectors, retrieves relevant material, and uses generative AI to draft questions while maintaining a strict "Human-in-the-Loop" approval workflow.

## 2. SRS Requirements Covered
- Section 1.2: Core Principle (AI-generated content is treated as a draft)
- Section 5.4: Question Bank (Import AI-generated drafts)
- Section 6: AI/RAG Requirements (RAG Pipeline, AI Features, AI Guardrails)

## 3. Module Scope

### In Scope
- Text extraction, normalization, metadata tagging, and chunking of approved course materials
- Embedding generation and vector index storage
- RAG retrieval of relevant material based on instructor topic and difficulty inputs
- AI question drafting (MCQs, Multi-Select, True/False, Short Answer, Descriptive, Numerical)
- Automated structural and consistency validation of generated draft questions
- Source reference attribution tracking (file, topic, page/chunk ID)
- Interactive AI Question Studio for instructor review, editing, approval, regeneration, and rejection

### Out of Scope
- Direct publication of AI-generated questions to live exams without instructor approval
- Autonomous grading of subjective answers without instructor override capability (handled by Grading module)
- Automatic student cheating verdicts from proctoring signals (handled by Academic Integrity module)

## 4. User Roles
- **Instructor**: Specifies generation parameters, triggers draft generation jobs, reviews generated drafts, edits content, approves items to Question Bank, or rejects unsuitable drafts.
- **Institution Admin**: Monitors AI token usage, job success rates, and generation activity within the institution.
- **Super Admin**: Monitors platform-wide AI pipeline performance, latency, and error metrics.

## 5. User Flow
Approved course material uploaded to secure storage 
→ System extracts text and normalizes content 
→ System chunks content with metadata (course, topic, page) 
→ System generates embeddings and indexes chunks in vector retrieval engine 
→ Instructor opens AI Question Studio for an assigned course 
→ Instructor specifies generation criteria (topic, count, question types, target difficulty) 
→ System retrieves relevant approved material chunks 
→ Gemini model generates draft questions with detailed source references 
→ System executes automated structural and answer-consistency validation 
→ Generated draft questions appear in Instructor Preview Studio 
→ Instructor reviews each item (Approve, Edit & Approve, Regenerate, or Reject) 
→ Approved questions enter the Question Bank as official assessment items

## 6. Core Features

### RAG Document Processing Pipeline
- **Purpose**: Transform uploaded course documents into searchable vector indexes.
- **Expected behavior**: Extract raw text cleanly, partition into semantically coherent chunks, append metadata tags, and generate vector embeddings.
- **User interaction**: Triggered automatically upon successful course material upload.
- **System behavior**: Parse file content, create chunk objects with page/source references, generate embeddings, and populate vector index.

### AI Question Generation Studio
- **Purpose**: Enable instructors to configure and trigger AI draft question generation.
- **Expected behavior**: Instructors configure topic scope, number of questions, question types, and target difficulty distribution.
- **User interaction**: Select options in AI Question Studio stepper UI, click Generate Drafts.
- **System behavior**: Retrieve relevant document chunks, format generation prompt with guardrails, query Gemini model, and receive draft items.

### Automated Quality & Structural Validation
- **Purpose**: Enforce structural correctness before presenting drafts to the instructor.
- **Expected behavior**: Verify that MCQs have valid options, an answer key is specified, text is non-empty, and difficulty aligns with target parameters.
- **User interaction**: System displays confidence and validation indicators on draft cards.
- **System behavior**: Run validation checks on draft JSON payload; flag structural errors or inconsistencies for instructor attention.

### Instructor Review & Approval Workflow
- **Purpose**: Ensure human-in-the-loop oversight before any AI question becomes an official assessment item.
- **Expected behavior**: Instructor can review source references, edit question text/answers, approve item to Question Bank, or reject item.
- **User interaction**: Click Accept, Edit, Regenerate, or Reject on individual draft cards.
- **System behavior**: Save approved/edited questions to Question Bank with `APPROVED` status; discard or archive rejected drafts.

## 7. Business Rules & AI Guardrails
- **Draft Status Mandatory**: AI-generated content is ALWAYS treated as a draft. Instructor approval is required before a question can enter the Question Bank or appear in an exam.
- **Source Attribution**: Every generated draft MUST retain source/context metadata (file name, page number, chunk ID).
- **Validation Requirement**: Generated questions must undergo automated validation checking structure, option completeness, and answer key consistency.
- **No Autonomous Rules**: AI must not invent official answers, course policies, or grading scales outside the provided source context.
- **Instructor Override**: High-impact evaluations and draft approvals strictly require human instructor authorization.

## 8. Module Dependencies

### Depends On
- Authentication & Account Management
- RBAC & Authorization
- Institution & Course Management
- Course Material Management

### Depends On This Module
- Question Bank
- Exam Management
- Grading
- AI Learning Recommendations

## 9. Important States
- Material Ingesting / Chunking
- Indexed / Ready for RAG
- Generation Job Queued
- Generating Drafts
- Drafts Ready for Review
- Draft Approved (Moved to Question Bank)
- Draft Rejected
- Generation Failed

## 10. Error & Edge Behavior

### Material Content Insufficient
- **Scenario**: Selected topic or document contains insufficient text to generate requested number of questions.
- **Expected behavior**: Generate maximum possible valid questions, notify instructor of content limitation, and suggest broader topic selection.

### AI API Timeout or Rate Limit
- **Scenario**: Generative AI service experiences rate limiting or connection timeout.
- **Expected behavior**: Retry request with exponential backoff; if persistent, set job state to `Generation Failed` and notify instructor without losing job configuration.

### Malformed AI Payload
- **Scenario**: AI model returns malformed output missing required option keys or answer fields.
- **Expected behavior**: Fail validation internally, filter out malformed draft, log failure for quality tracking, and display valid drafts to instructor.

## 11. Security Considerations
- Course material content sent to AI models must be transmitted over encrypted connections.
- Proprietary institution material must be protected against public model training leaks where applicable.

## 12. Implementation Phases
- **Phase 1 — Document Processing & Chunking**: Text extraction, chunking, and metadata tagging pipeline. [COMPLETE]
- **Phase 2 — Vector Indexing & Retrieval**: Embedding generation and vector retrieval pipeline. [COMPLETE]
- **Phase 3 — Gemini Prompting & Drafting**: Prompt construction, guardrail enforcement, and draft generation. [COMPLETE]
- **Phase 4 — Validation & Studio UI**: Automated validation rules, review studio, and approval workflow. [COMPLETE]

## 13. Testing Scope
- Accurate extraction and chunking of text from PDFs and DOCX files. [VERIFIED]
- Retrieval precision of relevant document chunks for given topic queries. [VERIFIED]
- Correct generation of various question types (MCQ, Short Answer, True/False). [VERIFIED]
- Retention of source attribution metadata across all generated items. [VERIFIED]
- Enforcing mandatory instructor approval state before Question Bank entry. [VERIFIED]

## 14. Definition of Done
- Instructors can configure and generate draft questions from uploaded course materials via AI Question Studio. [COMPLETE]
- Every generated draft retains source reference metadata and passes structural validation. [COMPLETE]
- AI questions remain in `DRAFT` status until explicitly approved by an instructor into the Question Bank. [COMPLETE]

