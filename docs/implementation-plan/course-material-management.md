# Course Material Management — Implementation Plan

## 1. Module Overview
The Course Material Management module enables instructors to upload, organize, version, and manage approved learning content (PDFs, DOCX files, presentations) for their courses. It serves as the primary data ingestion source for the AI/RAG question generation pipeline, ensuring that all AI-generated questions are strictly grounded in instructor-approved curriculum content.

## 2. SRS Requirements Covered
- Section 5.3: Course Material Management
- Section 6.1: RAG Pipeline (Material Ingestion & Storage)
- Section 15: Security Requirements (Private Cloud Storage, Presigned Access URLs)

## 3. Module Scope

### In Scope
- Uploading approved course materials (PDF, DOCX, PPTX formats)
- Storage of files in private object storage with secure access management
- Tracking file processing status (Uploaded, Processing, Embedded/Indexed, Failed)
- Association of course material with specific courses, topics, and subtopics
- Material version tracking and file deletion/archiving
- Presigned URL generation for secure material viewing by authorized instructors

### Out of Scope
- Text extraction, chunking, vector embedding, and RAG retrieval processing (handled by AI/RAG Question Generation module)
- Student study material distribution (out of scope for initial assessment release)

## 4. User Roles
- **Instructor**: Uploads, views, categorizes, versions, and deletes approved course materials for assigned courses.
- **Institution Admin**: Views uploaded material lists and storage statistics across institution courses.
- **Super Admin**: Monitors global material storage usage and health.

## 5. User Flow
Instructor selects assigned Course 
→ Navigates to Course Material section 
→ Clicks Upload Material 
→ Selects document file (PDF/DOCX) and inputs topic metadata 
→ System uploads file to secure private cloud storage 
→ System initiates text extraction and processing job 
→ System updates material status to Processing 
→ Upon completion, material status changes to Ready / Indexed 
→ Material is available for AI Question Studio generation

## 6. Core Features

### Material Upload & Storage Registration
- **Purpose**: Upload and register instructor-approved learning materials securely.
- **Expected behavior**: Files are stored in private cloud object storage; metadata and version details are saved in the system.
- **User interaction**: Drag and drop file or select file, assign topic/version label, click Upload.
- **System behavior**: Validate file type/size, store file in private storage bucket, record material metadata.

### Processing Status & Metadata Tracking
- **Purpose**: Provide visibility into the processing and indexing status of uploaded content.
- **Expected behavior**: Display real-time status indicators (Uploaded → Processing → Ready for AI Generation / Processing Failed).
- **User interaction**: View Course Material table and status badges.
- **System behavior**: Track asynchronous background processing events and update status record accordingly.

### Material Versioning & Management
- **Purpose**: Maintain historical trace of updated or superseded course documents.
- **Expected behavior**: Allow instructors to upload updated versions of materials while preserving references for existing generated questions.
- **User interaction**: Click Upload New Version on existing material item.
- **System behavior**: Increment version counter, maintain link to previous version, update active document reference.

## 7. Business Rules
- Only approved file formats (PDF, DOCX, PPTX) up to configured size limits may be uploaded.
- Materials uploaded to a course are private to that course and its assigned instructors.
- Raw document files must NEVER be stored in public web-accessible locations; access must require presigned URL authorization.
- Deleting a course material item must soft-delete or flag the document, preserving source metadata references for existing approved questions.

## 8. Module Dependencies

### Depends On
- Authentication & Account Management
- RBAC & Authorization
- Institution & Course Management

### Depends On This Module
- AI/RAG Question Generation
- Question Bank

## 9. Important States
- Uploading
- Uploaded / Pending Processing
- Processing / Extracting Text
- Ready / Indexed for RAG
- Processing Failed
- Archived / Soft Deleted

## 10. Error & Edge Behavior

### Unsupported File Format
- **Scenario**: User attempts to upload an unsupported format (e.g., executable, MP4, raw TXT).
- **Expected behavior**: Reject file before upload and display error ("Unsupported file format. Please upload PDF, DOCX, or PPTX documents.").

### File Size Exceeded
- **Scenario**: File exceeds maximum allowed upload size limit.
- **Expected behavior**: Block upload immediately and notify user of file size boundary.

### Corrupted or Password-Protected Document
- **Scenario**: Uploaded PDF is password-protected or unreadable by text extractors.
- **Expected behavior**: Set status to `Processing Failed`, notify instructor, and display message ("Unable to extract text. Please ensure the document is not password-protected.").

## 11. Security Considerations
- Direct file downloads must use short-lived presigned access URLs.
- Upload endpoints must scan and validate file headers to prevent malicious file uploads.

## 12. Implementation Phases
- **Phase 1 — Secure Storage & Metadata**: Upload registration and private storage integration.
- **Phase 2 — Document Management UI**: File lists, topic categorizations, and presigned viewing.
- **Phase 3 — Versioning & Archiving**: Version management and soft-delete logic.
- **Phase 4 — RAG Integration Hook**: Status tracking hooks for AI processing pipelines.

## 13. Testing Scope
- Validating file upload formats (PDF, DOCX, PPTX).
- Rejection of invalid file types and oversized files.
- Presigned URL access verification and expiration.
- Processing status tracking across lifecycle states.
- Handling of corrupted or locked files.

## 14. Definition of Done
- [x] COMPLETE: Instructors can upload, view, version, publish, archive, and manage course materials seamlessly.
- [x] COMPLETE: Files are stored securely in local storage with abstraction ready for AWS S3.
- [x] COMPLETE: Processing status (READY, PROCESSING, FAILED, ARCHIVED) and visibility (DRAFT, PUBLISHED) are tracked accurately.
- [x] COMPLETE: File type validation (PDF, DOCX, PPTX) and size limit (25MB) enforced with clear error messages.
- [x] COMPLETE: Strict RBAC permissions enforced (Instructors upload/manage assigned courses, Students view/download published materials only, Super Admin global access).
- [x] COMPLETE: Complete unit and integration test suite passing cleanly for all user roles.
- [ ] PENDING: Full RAG text extraction, vector chunking, and embedding pipeline (reserved for Module 5: AI/RAG Question Generation).
