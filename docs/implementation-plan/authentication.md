# Authentication & Account Management — Implementation Plan

# Status

[PARTIAL]

## Completed

- Multi-role login (`/api/v1/auth/login`) with email/password credential verification for Super Admin, Institution Admin, Instructor, and Student roles
- User registration (`/api/v1/auth/register`) with role assignment and bcrypt password hashing
- JWT access token generation, authentication middleware verification (`auth.middleware.js`), and header authorization
- Authenticated user profile retrieval (`/api/v1/auth/me`)
- User logout session invalidation (`/api/v1/auth/logout`)
- Frontend login page (`LoginPage.jsx`) and register page (`RegisterPage.jsx`) with theme preference toggle (Light/Dark mode)
- Unit and API tests for password hashing, JWT issue, and role verification (`server/src/tests/auth.test.js`)

## Remaining

- Password reset and recovery flow (`/api/v1/auth/forgot-password`, `/api/v1/auth/reset-password`)
- Refresh-token rotation and silent token refresh mechanism upon access token expiration
- Email verification flow for newly registered accounts

## Verification Evidence

- Backend tests: PASS (`server/src/tests/auth.test.js`)
- Frontend build: PASS (`npx vite build` succeeded cleanly in 7.19s)
- API verification: PASS (`/api/v1/auth/login`, `/api/v1/auth/register`, `/api/v1/auth/me`)
- Browser verification: PASS (Role-based login and logout verified in browser execution)
- Relevant files: `server/src/controllers/auth.controller.js`, `server/src/models/User.js`, `client/src/pages/LoginPage.jsx`, `client/src/pages/RegisterPage.jsx`

## 1. Module Overview
The Authentication & Account Management module provides user identification, credentials validation, session security, account recovery, and profile preference management across ExamForge. It serves as the primary entry gateway to the system, ensuring that all interacting individuals are verified users belonging to an authorized institution.

## 2. SRS Requirements Covered
- Section 5.1: Authentication & Account Management
- Section 15: Security Requirements (Password Hashing, JWT Token Handling, Session Invalidation)

## 3. Module Scope

### In Scope
- Multi-role registration and login (Email/password or institution credentials)
- Secure password hashing and credential validation
- Session token issue, rotation, and invalidation (Logout)
- Password reset and recovery flow
- Account profile management and avatar settings
- User theme preference persistence (Light Mode / Dark Mode)

### Out of Scope
- Role permission evaluation and endpoint access authorization (handled by RBAC & Authorization module)
- Institution creation and user onboarding administration (handled by Institution & Course Management module)
- Social SSO OAuth providers (out of initial release scope)

## 4. User Roles
- **Super Admin**: Authenticates to access global platform administrative functions.
- **Institution Admin**: Authenticates to manage institution-level users, departments, and settings.
- **Instructor**: Authenticates to create courses, generate questions, manage exams, and perform grading.
- **Student**: Authenticates to access assigned courses, take scheduled exams, and view graded results.

## 5. User Flow
User navigates to Login Screen 
→ User selects role/tab and inputs email/credentials 
→ System validates inputs and verifies password 
→ System issues secure session tokens 
→ System loads user profile and theme preferences 
→ User is redirected to their authorized role dashboard 
→ User initiates Logout 
→ System invalidates active session tokens and returns user to Login Screen

## 6. Core Features

### Multi-Role Authentication
- **Purpose**: Authenticate users across Super Admin, Institution Admin, Instructor, and Student roles.
- **Expected behavior**: Verify user identity against credentials and grant appropriate active session tokens.
- **User interaction**: Select role tab, enter email/roll number and password, click Login.
- **System behavior**: Check credentials, update last active timestamp, load user preferences, and issue session tokens.

### Password Reset & Recovery
- **Purpose**: Allow users to recover access when credentials are lost.
- **Expected behavior**: Send a time-limited secure reset link/token to the user's verified email.
- **User interaction**: Click Forgot Password, enter registered email address, click submit.
- **System behavior**: Generate single-use reset token, send email, validate token on submission, and update password.

### User Profile & Theme Preference Persistence
- **Purpose**: Manage individual profile information and persist visual display preferences.
- **Expected behavior**: Theme toggle updates UI visual styling immediately and persists across devices and logins.
- **User interaction**: Edit profile details or toggle Light/Dark theme switch in top-right header.
- **System behavior**: Store preference in user settings profile and apply corresponding visual theme.

## 7. Business Rules
- Plaintext passwords must NEVER be stored; modern secure hashing must be enforced.
- Access sessions must use short-lived tokens backed by secure refresh token rotation.
- Session invalidation (logout) must revoke access tokens immediately.
- Theme preference selection alters visual appearance only; component structure and layout must remain identical across themes.

## 8. Module Dependencies

### Depends On
None (Root module).

### Depends On This Module
- RBAC & Authorization
- Institution & Course Management
- Student Examination
- Question Bank
- All other authenticated modules

## 9. Important States
- Unauthenticated
- Authenticating
- Authenticated Active
- Session Expired
- Account Locked / Suspended

## 10. Error & Edge Behavior

### Invalid Credentials
- **Scenario**: User submits wrong email or password.
- **Expected behavior**: Display generic authentication error ("Invalid email or password"); do not reveal whether email exists.

### Expired Session
- **Scenario**: User session expires while interacting with the platform.
- **Expected behavior**: Silently attempt token refresh; if refresh fails, prompt user to re-authenticate without corrupting form state.

### Suspended User Account
- **Scenario**: User with `SUSPENDED` status attempts to log in.
- **Expected behavior**: Deny login and display contact instruction ("Account suspended. Please contact your Institution Admin.").

## 11. Security Considerations
- Rate limiting must prevent brute-force authentication attempts.
- Password reset links must expire after a short duration and be single-use only.
- Session tokens must be transmitted securely over HTTPS.

