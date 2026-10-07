import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './routes/ProtectedRoute';

// Public & Auth Pages
import { LandingPage } from './pages/LandingPage';
import { FeaturesPage } from './pages/FeaturesPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { PlaceholderPage } from './pages/PlaceholderPage';
import { ProfilePage } from './pages/ProfilePage';

// Student Portal Pages
import { StudentDashboard } from './pages/StudentDashboard';
import { StudentResultPage } from './pages/StudentResultPage';
import { AIPreparationViewPage } from './pages/AIPreparationViewPage';
import { StudentStudyPlanPage } from './pages/StudentStudyPlanPage';
import { PracticeHistoryPage } from './pages/PracticeHistoryPage';
import { GeneratePracticePage } from './pages/GeneratePracticePage';
import { PracticeResultPage } from './pages/PracticeResultPage';
import { LiveExamPage } from './pages/LiveExamPage';
import { SubmissionConfirmationPage } from './pages/SubmissionConfirmationPage';
import { StudentNotificationsPage } from './pages/StudentNotificationsPage';

// Instructor Portal Pages
import { InstructorDashboard } from './pages/InstructorDashboard';
import { AIQuestionStudio } from './pages/AIQuestionStudio';
import { QuestionBankPage } from './pages/QuestionBankPage';
import { QuestionConfigPage } from './pages/QuestionConfigPage';
import { QuestionsPreviewPage } from './pages/QuestionsPreviewPage';
import { CreateExamPage } from './pages/CreateExamPage';
import { BlueprintPage } from './pages/BlueprintPage';
import { InstructorExamAnalyticsPage } from './pages/InstructorExamAnalyticsPage';
import { InstructorResultsPage } from './pages/InstructorResultsPage';
import { InstructorStudentsPage } from './pages/InstructorStudentsPage';
import { InstructorReportsPage } from './pages/InstructorReportsPage';
import { InstructorSettingsPage } from './pages/InstructorSettingsPage';
import { ProctoringDashboardPage } from './pages/ProctoringDashboardPage';

// Course Management Pages
import { CourseDetailPage } from './pages/CourseDetailPage';
import { InstructorCoursesPage } from './pages/InstructorCoursesPage';
import { StudentCoursesPage } from './pages/StudentCoursesPage';

// Admin Portal Pages
import { AdminPanelPage } from './pages/AdminPanelPage';
import { AdminUserManagementPage } from './pages/AdminUserManagementPage';
import { AdminInstitutionPage } from './pages/AdminInstitutionPage';
import { AdminInstitutionDetailPage } from './pages/AdminInstitutionDetailPage';
import { AdminCourseManagementPage } from './pages/AdminCourseManagementPage';
import { AdminAnalyticsPage } from './pages/AdminAnalyticsPage';
import { AdminLogsPage } from './pages/AdminLogsPage';
import { AdminSettingsPage } from './pages/AdminSettingsPage';

import { ErrorBoundary } from './components/ui/ErrorBoundary';

export const App = () => {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
            {/* Public & Auth Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/features" element={<FeaturesPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route 
              path="/profile" 
              element={
                <ProtectedRoute allowedRoles={['STUDENT', 'INSTRUCTOR', 'SUPER_ADMIN', 'INSTITUTION_ADMIN']}>
                  <ProfilePage />
                </ProtectedRoute>
              } 
            />

            {/* Course Detail Route (All authenticated roles) */}
            <Route 
              path="/courses/:id" 
              element={
                <ProtectedRoute allowedRoles={['STUDENT', 'INSTRUCTOR', 'SUPER_ADMIN', 'INSTITUTION_ADMIN']}>
                  <CourseDetailPage />
                </ProtectedRoute>
              } 
            />

            {/* Student Routes (Protected) */}
            <Route 
              path="/student/dashboard" 
              element={
                <ProtectedRoute allowedRoles={['STUDENT', 'INSTRUCTOR', 'SUPER_ADMIN', 'INSTITUTION_ADMIN']}>
                  <StudentDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/student/courses" 
              element={
                <ProtectedRoute allowedRoles={['STUDENT', 'INSTRUCTOR', 'SUPER_ADMIN', 'INSTITUTION_ADMIN']}>
                  <StudentCoursesPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/student/exams" 
              element={
                <ProtectedRoute allowedRoles={['STUDENT', 'INSTRUCTOR', 'SUPER_ADMIN', 'INSTITUTION_ADMIN']}>
                  <StudentDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/student/results" 
              element={
                <ProtectedRoute allowedRoles={['STUDENT', 'INSTRUCTOR', 'SUPER_ADMIN', 'INSTITUTION_ADMIN']}>
                  <StudentResultPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/student/ai-preparation" 
              element={
                <ProtectedRoute allowedRoles={['STUDENT', 'INSTRUCTOR', 'SUPER_ADMIN', 'INSTITUTION_ADMIN']}>
                  <AIPreparationViewPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/student/ai-prep" 
              element={
                <ProtectedRoute allowedRoles={['STUDENT', 'INSTRUCTOR', 'SUPER_ADMIN', 'INSTITUTION_ADMIN']}>
                  <AIPreparationViewPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/student/practice" 
              element={
                <ProtectedRoute allowedRoles={['STUDENT', 'INSTRUCTOR', 'SUPER_ADMIN', 'INSTITUTION_ADMIN']}>
                  <PracticeHistoryPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/student/study-plan" 
              element={
                <ProtectedRoute allowedRoles={['STUDENT', 'INSTRUCTOR', 'SUPER_ADMIN', 'INSTITUTION_ADMIN']}>
                  <StudentStudyPlanPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/student/notifications" 
              element={
                <ProtectedRoute allowedRoles={['STUDENT', 'INSTRUCTOR', 'SUPER_ADMIN', 'INSTITUTION_ADMIN']}>
                  <StudentNotificationsPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/student/practice/generate" 
              element={
                <ProtectedRoute allowedRoles={['STUDENT', 'INSTRUCTOR', 'SUPER_ADMIN', 'INSTITUTION_ADMIN']}>
                  <GeneratePracticePage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/student/practice/result" 
              element={
                <ProtectedRoute allowedRoles={['STUDENT', 'INSTRUCTOR', 'SUPER_ADMIN', 'INSTITUTION_ADMIN']}>
                  <PracticeResultPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/student/exam/live" 
              element={
                <ProtectedRoute allowedRoles={['STUDENT', 'INSTRUCTOR', 'SUPER_ADMIN', 'INSTITUTION_ADMIN']}>
                  <LiveExamPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/student/exam/submitted" 
              element={
                <ProtectedRoute allowedRoles={['STUDENT', 'INSTRUCTOR', 'SUPER_ADMIN', 'INSTITUTION_ADMIN']}>
                  <SubmissionConfirmationPage />
                </ProtectedRoute>
              } 
            />

            {/* Instructor Routes (Protected) */}
            <Route 
              path="/instructor/dashboard" 
              element={
                <ProtectedRoute allowedRoles={['INSTRUCTOR']}>
                  <InstructorDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/instructor/courses" 
              element={
                <ProtectedRoute allowedRoles={['INSTRUCTOR']}>
                  <InstructorCoursesPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/instructor/question-bank" 
              element={
                <ProtectedRoute allowedRoles={['INSTRUCTOR']}>
                  <QuestionBankPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/instructor/ai-question-studio" 
              element={
                <ProtectedRoute allowedRoles={['INSTRUCTOR']}>
                  <AIQuestionStudio />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/instructor/ai-studio" 
              element={
                <ProtectedRoute allowedRoles={['INSTRUCTOR']}>
                  <AIQuestionStudio />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/instructor/ai-question-studio/config" 
              element={
                <ProtectedRoute allowedRoles={['INSTRUCTOR']}>
                  <QuestionConfigPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/instructor/ai-studio/config" 
              element={
                <ProtectedRoute allowedRoles={['INSTRUCTOR']}>
                  <QuestionConfigPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/instructor/ai-question-studio/preview" 
              element={
                <ProtectedRoute allowedRoles={['INSTRUCTOR']}>
                  <QuestionsPreviewPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/instructor/ai-studio/preview" 
              element={
                <ProtectedRoute allowedRoles={['INSTRUCTOR']}>
                  <QuestionsPreviewPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/instructor/exams" 
              element={
                <ProtectedRoute allowedRoles={['INSTRUCTOR']}>
                  <CreateExamPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/instructor/exams/create" 
              element={
                <ProtectedRoute allowedRoles={['INSTRUCTOR']}>
                  <CreateExamPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/instructor/exams/blueprint" 
              element={
                <ProtectedRoute allowedRoles={['INSTRUCTOR']}>
                  <BlueprintPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/instructor/results" 
              element={
                <ProtectedRoute allowedRoles={['INSTRUCTOR']}>
                  <InstructorResultsPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/instructor/analytics" 
              element={
                <ProtectedRoute allowedRoles={['INSTRUCTOR']}>
                  <InstructorExamAnalyticsPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/instructor/students" 
              element={
                <ProtectedRoute allowedRoles={['INSTRUCTOR']}>
                  <InstructorStudentsPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/instructor/reports" 
              element={
                <ProtectedRoute allowedRoles={['INSTRUCTOR']}>
                  <InstructorReportsPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/instructor/settings" 
              element={
                <ProtectedRoute allowedRoles={['INSTRUCTOR']}>
                  <InstructorSettingsPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/instructor/proctoring" 
              element={
                <ProtectedRoute allowedRoles={['INSTRUCTOR']}>
                  <ProctoringDashboardPage />
                </ProtectedRoute>
              } 
            />

            {/* Admin Routes (Protected) */}
            <Route 
              path="/admin/dashboard" 
              element={
                <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'INSTITUTION_ADMIN']}>
                  <AdminPanelPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/users" 
              element={
                <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'INSTITUTION_ADMIN']}>
                  <AdminUserManagementPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/institutions" 
              element={
                <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'INSTITUTION_ADMIN']}>
                  <AdminInstitutionPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/institutions/:institutionId" 
              element={
                <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'INSTITUTION_ADMIN']}>
                  <AdminInstitutionDetailPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/courses" 
              element={
                <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'INSTITUTION_ADMIN']}>
                  <AdminCourseManagementPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/analytics" 
              element={
                <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'INSTITUTION_ADMIN']}>
                  <AdminAnalyticsPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/logs" 
              element={
                <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'INSTITUTION_ADMIN']}>
                  <AdminLogsPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/settings" 
              element={
                <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'INSTITUTION_ADMIN']}>
                  <AdminSettingsPage />
                </ProtectedRoute>
              } 
            />

            {/* Reusable 404 Route */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  </ErrorBoundary>
  );
};

export default App;
