import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';

// Public & Auth Pages
import { LandingPage } from './pages/LandingPage';
import { FeaturesPage } from './pages/FeaturesPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { PlaceholderPage } from './pages/PlaceholderPage';

// Student Portal Pages
import { StudentDashboard } from './pages/StudentDashboard';
import { StudentResultPage } from './pages/StudentResultPage';
import { AIPreparationViewPage } from './pages/AIPreparationViewPage';
import { PracticeHistoryPage } from './pages/PracticeHistoryPage';
import { GeneratePracticePage } from './pages/GeneratePracticePage';
import { PracticeResultPage } from './pages/PracticeResultPage';
import { LiveExamPage } from './pages/LiveExamPage';
import { SubmissionConfirmationPage } from './pages/SubmissionConfirmationPage';

// Instructor Portal Pages
import { InstructorDashboard } from './pages/InstructorDashboard';
import { AIQuestionStudio } from './pages/AIQuestionStudio';
import { QuestionConfigPage } from './pages/QuestionConfigPage';
import { QuestionsPreviewPage } from './pages/QuestionsPreviewPage';
import { CreateExamPage } from './pages/CreateExamPage';
import { BlueprintPage } from './pages/BlueprintPage';
import { InstructorExamAnalyticsPage } from './pages/InstructorExamAnalyticsPage';
import { ProctoringDashboardPage } from './pages/ProctoringDashboardPage';

// Admin Portal Pages
import { AdminPanelPage } from './pages/AdminPanelPage';

export const App = () => {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          {/* Public & Auth Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/features" element={<FeaturesPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Student Routes */}
          <Route path="/student/dashboard" element={<StudentDashboard />} />
          <Route path="/student/exams" element={<StudentDashboard />} />
          <Route path="/student/results" element={<StudentResultPage />} />
          <Route path="/student/ai-preparation" element={<AIPreparationViewPage />} />
          <Route path="/student/ai-prep" element={<AIPreparationViewPage />} />
          <Route path="/student/practice" element={<PracticeHistoryPage />} />
          <Route path="/student/study-plan" element={<AIPreparationViewPage />} />
          <Route 
            path="/student/notifications" 
            element={<PlaceholderPage title="Student Notifications" role="Student" moduleName="Notifications" />} 
          />
          <Route path="/student/practice/generate" element={<GeneratePracticePage />} />
          <Route path="/student/practice/result" element={<PracticeResultPage />} />
          <Route path="/student/exam/live" element={<LiveExamPage />} />
          <Route path="/student/exam/submitted" element={<SubmissionConfirmationPage />} />

          {/* Instructor Routes */}
          <Route path="/instructor/dashboard" element={<InstructorDashboard />} />
          <Route 
            path="/instructor/courses" 
            element={<PlaceholderPage title="Course Management" role="Instructor" moduleName="Courses" />} 
          />
          <Route path="/instructor/question-bank" element={<AIQuestionStudio />} />
          <Route path="/instructor/ai-question-studio" element={<AIQuestionStudio />} />
          <Route path="/instructor/ai-studio" element={<AIQuestionStudio />} />
          <Route path="/instructor/ai-question-studio/config" element={<QuestionConfigPage />} />
          <Route path="/instructor/ai-studio/config" element={<QuestionConfigPage />} />
          <Route path="/instructor/ai-question-studio/preview" element={<QuestionsPreviewPage />} />
          <Route path="/instructor/ai-studio/preview" element={<QuestionsPreviewPage />} />
          <Route path="/instructor/exams" element={<CreateExamPage />} />
          <Route path="/instructor/exams/create" element={<CreateExamPage />} />
          <Route path="/instructor/exams/blueprint" element={<BlueprintPage />} />
          <Route path="/instructor/results" element={<InstructorExamAnalyticsPage />} />
          <Route path="/instructor/analytics" element={<InstructorExamAnalyticsPage />} />
          <Route 
            path="/instructor/students" 
            element={<PlaceholderPage title="Enrolled Students" role="Instructor" moduleName="Students" />} 
          />
          <Route 
            path="/instructor/reports" 
            element={<PlaceholderPage title="Exam Reports" role="Instructor" moduleName="Reports" />} 
          />
          <Route 
            path="/instructor/settings" 
            element={<PlaceholderPage title="Instructor Settings" role="Instructor" moduleName="Settings" />} 
          />
          <Route path="/instructor/proctoring" element={<ProctoringDashboardPage />} />

          {/* Admin Routes */}
          <Route path="/admin/dashboard" element={<AdminPanelPage />} />
          <Route 
            path="/admin/users" 
            element={<PlaceholderPage title="User Management" role="Admin" moduleName="Users" />} 
          />
          <Route 
            path="/admin/institutions" 
            element={<PlaceholderPage title="Institution Management" role="Admin" moduleName="Institutions" />} 
          />
          <Route 
            path="/admin/courses" 
            element={<PlaceholderPage title="Global Course Directory" role="Admin" moduleName="Courses" />} 
          />
          <Route 
            path="/admin/analytics" 
            element={<PlaceholderPage title="System Analytics" role="Admin" moduleName="Analytics" />} 
          />
          <Route 
            path="/admin/logs" 
            element={<PlaceholderPage title="System Audit Logs" role="Admin" moduleName="System Logs" />} 
          />
          <Route 
            path="/admin/settings" 
            element={<PlaceholderPage title="Platform Settings" role="Admin" moduleName="Settings" />} 
          />

          {/* Reusable 404 Route */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
};

export default App;
