import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { StatCard } from '../components/ui/StatCard';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { AIPreparationCard } from '../components/ai/AIPreparationCard';
import { examService } from '../services/examService';
import { formatExamDateTime, formatExamDate } from '../utils/dateUtils';
import { useAuth } from '../context/AuthContext';
import {
  Calendar,
  FileText,
  Award,
  Target,
  ArrowRight,
  Clock,
  CheckCircle2,
  Sparkles,
  AlertCircle,
  RefreshCw,
  Play,
} from 'lucide-react';

export const StudentDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [studentExams, setStudentExams] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [enrolledSubjectsCount, setEnrolledSubjectsCount] = useState(0);

  const fetchStudentDashboard = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await examService.getStudentExams();
      if (res.success && Array.isArray(res.data?.exams)) {
        setStudentExams(res.data.exams);
        setEnrolledSubjectsCount(res.data.enrolledSubjectsCount || 0);
      }
    } catch (err) {
      setError(err.message || 'Failed to load enrolled student exams.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStudentDashboard();
  }, []);

  const handleStartExam = async (examId) => {
    try {
      setError(null);
      const res = await examService.startAttempt(examId);
      if (res.success && res.data?.attempt) {
        navigate(`/student/exam/live?examId=${examId}`, { state: { attempt: res.data.attempt, exam: res.data.exam } });
      }
    } catch (err) {
      setError(err.message || 'Unable to start exam session.');
    }
  };

  const activeExams = studentExams.filter((e) => (!e.myAttempt || e.myAttempt.status === 'IN_PROGRESS') && e.computedStatus === 'ACTIVE');
  const upcomingExams = studentExams.filter((e) => (!e.myAttempt) && e.computedStatus === 'SCHEDULED');
  const completedExams = studentExams.filter((e) => e.myAttempt && (e.myAttempt.status === 'SUBMITTED' || e.myAttempt.status === 'GRADED' || e.myAttempt.status === 'PUBLISHED'));
  
  const publishedExams = completedExams.filter((e) => e.myAttempt?.status === 'PUBLISHED');

  const scoreSum = publishedExams.reduce((acc, curr) => acc + (curr.myAttempt?.percentage || 0), 0);
  const averagePercentage = publishedExams.length > 0 ? Math.round(scoreSum / publishedExams.length) : 0;

  return (
    <AppShell title="Student Portal">
      <div className="space-y-8 pb-12">
        {/* Top Greeting Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[var(--surface)] p-6 rounded-2xl border border-[var(--border)] shadow-xs">
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">
              Welcome, {user?.name || 'Student'}! 👋
            </h1>
            <p className="text-xs text-[var(--text-secondary)] mt-1">
              Enrolled Course Examinations & Personalized AI Assessment Workspace
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="primary" size="sm" icon={Sparkles} onClick={() => navigate('/student/ai-prep')}>
              Adaptive Prep
            </Button>
          </div>
        </div>

        {error && (
          <div className="p-3.5 bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 rounded-xl text-xs font-semibold flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              <span>{error}</span>
            </div>
            <button onClick={fetchStudentDashboard} className="cursor-pointer">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* 4 Metric Cards Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Active Exams" value={isLoading ? '...' : activeExams.length} icon={Calendar} />
          <StatCard title="Completed Exams" value={isLoading ? '...' : completedExams.length} icon={FileText} />
          <StatCard title="Average Score" value={isLoading ? '...' : `${averagePercentage}%`} icon={Award} />
          <StatCard title="Enrolled Subjects" value={isLoading ? '...' : enrolledSubjectsCount} icon={Target} />
        </div>

        {/* Main Content Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Exams */}
          <div className="lg:col-span-7 space-y-6">
            {/* Upcoming Exams */}
            {upcomingExams.length > 0 && (
              <Card title="Upcoming Subject Exams">
                <div className="space-y-3">
                  {upcomingExams.map((exam) => {
                    const eId = exam.id || exam._id;
                    return (
                      <div
                        key={eId}
                        className="p-4 bg-[var(--background)] rounded-xl border border-[var(--border-subtle)] flex flex-col sm:flex-row sm:items-center justify-between gap-3 opacity-80"
                      >
                        <div>
                          <h4 className="text-sm font-bold text-[var(--text-primary)]">
                            {exam.title}
                          </h4>
                          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                            {exam.courseId?.code} — {exam.courseId?.name} • {exam.duration} Mins
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant="warning">Starts: {formatExamDateTime(exam.startTime)}</Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            )}

            <Card title="Active & Enrolled Subject Exams">
              {isLoading ? (
                <div className="p-8 text-center text-xs text-[var(--text-secondary)]">Checking available exams...</div>
              ) : activeExams.length === 0 ? (
                <div className="p-8 text-center text-xs text-[var(--text-secondary)]">
                  No active exams for your enrolled subjects right now.
                </div>
              ) : (
                <div className="space-y-3">
                  {activeExams.map((exam) => {
                    const eId = exam.id || exam._id;
                    return (
                      <div
                        key={eId}
                        className="p-4 bg-[var(--background)] rounded-xl border border-[var(--border-subtle)] flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-[var(--primary)] transition-all group"
                      >
                        <div>
                          <h4 className="text-sm font-bold text-[var(--text-primary)] group-hover:text-[var(--primary)] transition-colors">
                            {exam.title}
                          </h4>
                          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                            {exam.courseId?.code} — {exam.courseId?.name} • {exam.duration} Mins • {exam.totalMarks} Marks
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <Button variant="primary" size="sm" icon={Play} onClick={() => handleStartExam(eId)}>
                            {exam.myAttempt?.status === 'IN_PROGRESS' ? 'Resume Exam' : 'Take Exam'}
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>

            {/* Completed Exams & AI Results */}
            <Card title="Completed Exam Results">
              {completedExams.length === 0 ? (
                <div className="p-8 text-center text-xs text-[var(--text-secondary)]">No completed exam submissions yet.</div>
              ) : (
                <div className="space-y-3">
                  {completedExams.map((exam) => {
                    const eId = exam.id || exam._id;
                    const attempt = exam.myAttempt;
                    return (
                      <div key={eId} className="p-4 bg-[var(--background)] rounded-xl border border-[var(--border-subtle)] flex items-center justify-between">
                        <div>
                          <h4 className="text-sm font-bold text-[var(--text-primary)]">{exam.title}</h4>
                          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                            {exam.courseId?.code} • Submitted: {formatExamDate(attempt.submittedAt)}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            {attempt.status === 'PUBLISHED' ? (
                              <>
                                <span className="text-sm font-bold text-[var(--primary)] block">{attempt.percentage}%</span>
                                <Badge variant={attempt.passed ? 'success' : 'danger'}>
                                  {attempt.passed ? 'Passed' : 'Needs Practice'}
                                </Badge>
                              </>
                            ) : (
                              <Badge variant="warning">Under Review</Badge>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            icon={ArrowRight}
                            onClick={() => navigate('/student/results', { state: { attempt, exam } })}
                          >
                            Result Details
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          </div>

          {/* Right Column: AI Preparation Card */}
          <div className="lg:col-span-5 space-y-6">
            <AIPreparationCard completedExams={publishedExams} />
          </div>
        </div>
      </div>
    </AppShell>
  );
};
