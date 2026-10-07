import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { StatCard } from '../components/ui/StatCard';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { examService } from '../services/examService';
import { useAuth } from '../context/AuthContext';
import {
  BookOpen,
  FolderKanban,
  FileText,
  Users,
  Sparkles,
  PlusCircle,
  BarChart3,
  Clock,
  ArrowRight,
  Eye,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';

export const InstructorDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [analytics, setAnalytics] = useState(null);
  const [assignedCourses, setAssignedCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await examService.getInstructorAnalytics();
      if (res.success) {
        setAnalytics(res.data.stats);
        setAssignedCourses(res.data.assignedCourses || []);
      }
    } catch (err) {
      setError(err.message || 'Failed to load instructor workspace analytics.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const stats = analytics || {};

  return (
    <AppShell title="Instructor Workspace">
      <div className="space-y-8 pb-12">
        {/* Welcome Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[var(--surface)] p-6 rounded-2xl border border-[var(--border)] shadow-xs">
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">
              Welcome back, {user?.name || 'Instructor'}! 🎓
            </h1>
            <p className="text-xs text-[var(--text-secondary)] mt-1">
              Faculty Workspace | Dedicated Subject Management & Question Generation Engine
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="primary" size="sm" icon={Sparkles} onClick={() => navigate('/instructor/ai-studio')}>
              AI Question Studio
            </Button>
            <Button variant="secondary" size="sm" icon={PlusCircle} onClick={() => navigate('/instructor/exams/create')}>
              Create Exam
            </Button>
          </div>
        </div>

        {error && (
          <div className="p-3.5 bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 rounded-xl text-xs font-semibold flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              <span>{error}</span>
            </div>
            <button onClick={fetchDashboardData} className="cursor-pointer">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* 4 Real Metrics Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Assigned Subjects" value={isLoading ? '...' : stats.coursesCount || 0} icon={BookOpen} />
          <StatCard title="Approved Questions" value={isLoading ? '...' : stats.approvedQuestionsCount || 0} icon={FolderKanban} />
          <StatCard title="Exams Created" value={isLoading ? '...' : stats.examsCreatedCount || 0} icon={FileText} />
          <StatCard title="Enrolled Students" value={isLoading ? '...' : stats.totalStudentsCount || 0} icon={Users} />
        </div>

        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Assigned Subjects */}
          <div className="lg:col-span-7 space-y-6">
            <Card title="Assigned Subjects & Enrolled Students">
              {isLoading ? (
                <div className="p-8 text-center text-xs text-[var(--text-secondary)]">Loading assigned subjects...</div>
              ) : assignedCourses.length === 0 ? (
                <div className="p-8 text-center text-xs text-[var(--text-secondary)]">
                  You are not currently assigned to any subjects by an Administrator.
                </div>
              ) : (
                <div className="space-y-3">
                  {assignedCourses.map((c) => (
                    <div
                      key={c.id}
                      className="p-4 bg-[var(--background)] rounded-xl border border-[var(--border-subtle)] flex items-center justify-between hover:border-[var(--primary)] transition-all"
                    >
                      <div>
                        <h4 className="text-sm font-bold text-[var(--text-primary)]">
                          {c.code} — {c.name}
                        </h4>
                        <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                          {c.department} Dept • {c.studentCount} Enrolled Students
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={ArrowRight}
                        onClick={() => navigate(`/courses/${c.id}`)}
                      >
                        Subject Hub
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Class Performance Metric */}
            <Card
              title="Class Exam Performance Summary"
              action={
                <Button variant="ghost" size="sm" icon={ArrowRight} onClick={() => navigate('/instructor/analytics')}>
                  Analytics
                </Button>
              }
            >
              <div className="p-4 bg-[var(--surface-muted)] rounded-xl space-y-3">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span>Overall Assigned Class Average Score</span>
                  <span className="text-[var(--primary)]">{stats.averageClassScore || 0}%</span>
                </div>
                <div className="w-full bg-[var(--border)] h-2 rounded-full overflow-hidden">
                  <div className="bg-[var(--primary)] h-full" style={{ width: `${Math.min(stats.averageClassScore || 0, 100)}%` }} />
                </div>
                <div className="flex justify-between text-[11px] text-[var(--text-secondary)]">
                  <span>Total Submitted Student Attempts: {stats.totalSubmittedAttempts || 0}</span>
                  <span>RAG Materials: {stats.materialsCount || 0} Vaults</span>
                </div>
              </div>
            </Card>
            
            <Card title="Result Publishing & Reviews" action={
                <Button variant="primary" size="sm" icon={ArrowRight} onClick={() => navigate('/instructor/results')}>
                  Review Results
                </Button>
            }>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                 <div className="text-center p-3 bg-[var(--surface-muted)] rounded-xl border">
                    <span className="block text-xl font-black text-amber-500">{stats.pendingReviewsCount || 0}</span>
                    <span className="text-[10px] text-[var(--text-secondary)] font-bold uppercase">Pending Reviews</span>
                 </div>
                 <div className="text-center p-3 bg-[var(--surface-muted)] rounded-xl border">
                    <span className="block text-xl font-black text-[var(--success)]">{stats.publishedResultsCount || 0}</span>
                    <span className="text-[10px] text-[var(--text-secondary)] font-bold uppercase">Published Results</span>
                 </div>
                 <div className="text-center p-3 bg-[var(--surface-muted)] rounded-xl border">
                    <span className="block text-xl font-black text-[var(--text-primary)]">{stats.totalSubmittedAttempts || 0}</span>
                    <span className="text-[10px] text-[var(--text-secondary)] font-bold uppercase">Students Attempted</span>
                 </div>
                 <div className="text-center p-3 bg-[var(--surface-muted)] rounded-xl border">
                    <span className="block text-xl font-black text-[var(--primary)]">{stats.averageClassScore || 0}%</span>
                    <span className="text-[10px] text-[var(--text-secondary)] font-bold uppercase">Average Score</span>
                 </div>
              </div>
            </Card>
          </div>

          {/* Right Column: Quick Action Cards */}
          <div className="lg:col-span-5 space-y-6">
            <h3 className="text-sm font-bold text-[var(--text-primary)]">Subject Actions</h3>

            <div className="space-y-3">
              <div
                onClick={() => navigate('/instructor/ai-studio')}
                className="p-4 bg-[var(--surface)] border border-[var(--primary-border)] rounded-xl shadow-xs hover:shadow-md cursor-pointer transition-all flex items-center gap-4 group"
              >
                <div className="w-10 h-10 rounded-xl bg-[var(--primary-light)] text-[var(--primary)] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-bold text-[var(--text-primary)] group-hover:text-[var(--primary)] transition-colors">
                    AI Question Studio
                  </h4>
                  <p className="text-xs text-[var(--text-secondary)] mt-0.5">Process notes & generate grounded RAG questions</p>
                </div>
              </div>

              <div
                onClick={() => navigate('/instructor/question-bank')}
                className="p-4 bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-xs hover:shadow-md hover:border-[var(--primary-border)] cursor-pointer transition-all flex items-center gap-4 group"
              >
                <div className="w-10 h-10 rounded-xl bg-[var(--surface-muted)] text-[var(--text-primary)] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <FolderKanban className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-bold text-[var(--text-primary)] group-hover:text-[var(--primary)] transition-colors">
                    Question Bank
                  </h4>
                  <p className="text-xs text-[var(--text-secondary)] mt-0.5">Review, edit, and approve questions</p>
                </div>
              </div>

              <div
                onClick={() => navigate('/instructor/exams/create')}
                className="p-4 bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-xs hover:shadow-md hover:border-[var(--primary-border)] cursor-pointer transition-all flex items-center gap-4 group"
              >
                <div className="w-10 h-10 rounded-xl bg-[var(--surface-muted)] text-[var(--text-primary)] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <PlusCircle className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-bold text-[var(--text-primary)] group-hover:text-[var(--primary)] transition-colors">
                    Create New Exam
                  </h4>
                  <p className="text-xs text-[var(--text-secondary)] mt-0.5">Build exams from approved questions & publish</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
};
