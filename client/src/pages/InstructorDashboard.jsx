import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { instructorMockData } from '../mockData';
import { StatCard } from '../components/ui/StatCard';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { BookOpen, FolderKanban, FileText, Users, Sparkles, PlusCircle, BarChart3, Clock, ArrowRight, ShieldCheck, Eye } from 'lucide-react';

export const InstructorDashboard = () => {
  const navigate = useNavigate();
  const data = instructorMockData;

  return (
    <AppShell title="Instructor Dashboard">
      <div className="space-y-8 pb-12">
        {/* Welcome Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[var(--surface)] p-6 rounded-2xl border border-[var(--border)] shadow-xs">
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">
              Welcome back, {data.name}! 🎓
            </h1>
            <p className="text-xs text-[var(--text-secondary)] mt-1">
              Department of Computer Science | Active Term: Fall 2026
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

        {/* 4 Metrics Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Active Courses" value={data.stats.coursesCount} icon={BookOpen} />
          <StatCard title="Total Questions" value={data.stats.questionsCount} icon={FolderKanban} />
          <StatCard title="Exams Created" value={data.stats.examsCreatedCount} icon={FileText} />
          <StatCard title="Total Students" value={data.stats.studentsCount} icon={Users} />
        </div>

        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Column: Courses & Exam Analytics Preview */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Active Courses */}
            <Card title="Active Courses">
              <div className="space-y-3">
                <div className="p-4 bg-[var(--background)] rounded-xl border border-[var(--border-subtle)] flex items-center justify-between hover:border-[var(--primary)] transition-all">
                  <div>
                    <h4 className="text-sm font-bold text-[var(--text-primary)]">CS301 - Data Structures & Algorithms</h4>
                    <p className="text-xs text-[var(--text-secondary)] mt-0.5">142 Enrolled Students • 4 Active Exams</p>
                  </div>
                  <Badge variant="success">Active</Badge>
                </div>

                <div className="p-4 bg-[var(--background)] rounded-xl border border-[var(--border-subtle)] flex items-center justify-between hover:border-[var(--primary)] transition-all">
                  <div>
                    <h4 className="text-sm font-bold text-[var(--text-primary)]">CS402 - Database Systems</h4>
                    <p className="text-xs text-[var(--text-secondary)] mt-0.5">98 Enrolled Students • 2 Active Exams</p>
                  </div>
                  <Badge variant="success">Active</Badge>
                </div>
              </div>
            </Card>

            {/* Exam Statistics & Analytics Preview */}
            <Card 
              title="Recent Exam Analytics & Class Performance"
              action={
                <Button variant="ghost" size="sm" icon={ArrowRight} onClick={() => navigate('/instructor/analytics')}>
                  Full Analytics
                </Button>
              }
            >
              <div className="space-y-4">
                <div className="p-4 bg-[var(--surface-muted)] rounded-xl space-y-3">
                  <div className="flex justify-between items-center text-xs font-bold">
                    <span>CS301 Midterm Assessment</span>
                    <span className="text-[var(--primary)]">Class Avg: 76.4%</span>
                  </div>
                  <div className="w-full bg-[var(--border)] h-2 rounded-full overflow-hidden">
                    <div className="bg-[var(--primary)] h-full w-[76.4%]" />
                  </div>
                  <div className="flex justify-between text-[11px] text-[var(--text-secondary)]">
                    <span>Pass Rate: 89.2%</span>
                    <span>Proctoring Integrity: 99.4%</span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Recent Activity Timeline */}
            <Card title="Recent Activity">
              <div className="space-y-3">
                {data.recentActivity.map((act) => (
                  <div key={act.id} className="flex items-start gap-3 p-3 bg-[var(--background)] rounded-xl border border-[var(--border-subtle)]">
                    <div className="w-8 h-8 rounded-full bg-[var(--primary-light)] text-[var(--primary)] flex items-center justify-center shrink-0 mt-0.5">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold text-[var(--text-primary)]">{act.title}</h4>
                      <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">{act.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

          </div>

          {/* Right Column: Quick Actions & Question Bank Metrics */}
          <div className="lg:col-span-5 space-y-6">
            <h3 className="text-sm font-bold text-[var(--text-primary)]">Instructor Quick Actions</h3>

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
                  <p className="text-xs text-[var(--text-secondary)] mt-0.5">Upload syllabus & generate RAG question bank</p>
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
                  <p className="text-xs text-[var(--text-secondary)] mt-0.5">Configure blueprint, duration & proctoring</p>
                </div>
              </div>

              <div
                onClick={() => navigate('/instructor/proctoring')}
                className="p-4 bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-xs hover:shadow-md hover:border-[var(--primary-border)] cursor-pointer transition-all flex items-center gap-4 group"
              >
                <div className="w-10 h-10 rounded-xl bg-[var(--surface-muted)] text-[var(--text-primary)] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Eye className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-bold text-[var(--text-primary)] group-hover:text-[var(--primary)] transition-colors">
                    Live Proctoring Dashboard
                  </h4>
                  <p className="text-xs text-[var(--text-secondary)] mt-0.5">Monitor active student sessions in real time</p>
                </div>
              </div>

              <div
                onClick={() => navigate('/instructor/analytics')}
                className="p-4 bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-xs hover:shadow-md hover:border-[var(--primary-border)] cursor-pointer transition-all flex items-center gap-4 group"
              >
                <div className="w-10 h-10 rounded-xl bg-[var(--surface-muted)] text-[var(--text-primary)] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-bold text-[var(--text-primary)] group-hover:text-[var(--primary)] transition-colors">
                    View Course Analytics
                  </h4>
                  <p className="text-xs text-[var(--text-secondary)] mt-0.5">Check item difficulty & class distributions</p>
                </div>
              </div>
            </div>

            {/* Question Bank Summary */}
            <Card title="Question Bank Summary">
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1.5 border-b border-[var(--border-subtle)]">
                  <span className="text-[var(--text-secondary)]">Multiple Choice (MCQ)</span>
                  <span className="font-bold text-[var(--text-primary)]">420 Qs</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-[var(--border-subtle)]">
                  <span className="text-[var(--text-secondary)]">Short Answer / Essay</span>
                  <span className="font-bold text-[var(--text-primary)]">180 Qs</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-[var(--text-secondary)]">RAG Knowledge Vaults</span>
                  <span className="font-bold text-[var(--primary)]">3 Uploaded</span>
                </div>
              </div>
            </Card>

          </div>

        </div>
      </div>
    </AppShell>
  );
};
