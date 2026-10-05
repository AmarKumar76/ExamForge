import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { studentMockData, practiceHistoryMock } from '../mockData';
import { StatCard } from '../components/ui/StatCard';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { AIPreparationCard } from '../components/ai/AIPreparationCard';
import { Calendar, FileText, Award, Target, ArrowRight, Clock, CheckCircle2, TrendingUp, History, Sparkles } from 'lucide-react';

export const StudentDashboard = () => {
  const navigate = useNavigate();
  const data = studentMockData;

  return (
    <AppShell title="Student Dashboard">
      <div className="space-y-8 pb-12">
        {/* Top Greeting Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[var(--surface)] p-6 rounded-2xl border border-[var(--border)] shadow-xs">
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">
              Good Evening, {data.name}! 👋
            </h1>
            <p className="text-xs text-[var(--text-secondary)] mt-1">
              {data.program} • Semester {data.semester} | Roll No: {data.rollNumber}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="primary" size="sm" icon={Sparkles} onClick={() => navigate('/student/ai-prep')}>
              Adaptive Prep
            </Button>
            <div className="text-xs font-semibold text-[var(--text-secondary)] bg-[var(--surface-muted)] px-3 py-2 rounded-xl border border-[var(--border-subtle)]">
              {data.date}
            </div>
          </div>
        </div>

        {/* 4 Metric Cards Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Upcoming Exams" value={data.stats.upcomingExamsCount} icon={Calendar} />
          <StatCard title="Completed Exams" value={data.stats.completedExamsCount} icon={FileText} />
          <StatCard title="Average Score" value={`${data.stats.averageScore}%`} icon={Award} />
          <StatCard title="Practice Tests" value={data.stats.practiceTestsCount} icon={Target} />
        </div>

        {/* Main Content Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Column: Upcoming Exams & Performance Breakdown */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Upcoming Exams */}
            <Card
              title="Upcoming Exams"
              action={
                <Button variant="ghost" size="sm" icon={ArrowRight} onClick={() => navigate('/student/exams')}>
                  View All
                </Button>
              }
            >
              <div className="space-y-3">
                {data.upcomingExams.map((exam) => (
                  <div
                    key={exam.id}
                    className="p-4 bg-[var(--background)] rounded-xl border border-[var(--border-subtle)] flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-[var(--primary)] transition-all group"
                  >
                    <div>
                      <h4 className="text-sm font-bold text-[var(--text-primary)] group-hover:text-[var(--primary)] transition-colors">
                        {exam.title}
                      </h4>
                      <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                        {exam.courseCode} • {exam.duration} • {exam.totalMarks} Marks
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-left sm:text-right shrink-0">
                        <div className="text-xs font-semibold text-[var(--primary)] flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{exam.date}</span>
                        </div>
                        <span className="text-[11px] text-[var(--text-muted)]">{exam.time}</span>
                      </div>
                      <Button variant="secondary" size="sm" onClick={() => navigate('/student/exam/live')}>
                        Start
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Subject Performance Breakdown */}
            <Card title="Subject Performance & Topic Mastery">
              <div className="space-y-4">
                {data.subjectPerformance.map((subj, i) => (
                  <div key={i} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-[var(--text-primary)]">{subj.subject}</span>
                      <span className="text-[var(--text-primary)] font-bold">{subj.score}%</span>
                    </div>
                    <div className="w-full h-2.5 bg-[var(--surface-muted)] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${subj.score}%`, backgroundColor: subj.color }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Practice History */}
            <Card 
              title="Recent Practice History"
              action={
                <Button variant="ghost" size="sm" icon={ArrowRight} onClick={() => navigate('/student/practice')}>
                  Full History
                </Button>
              }
            >
              <div className="space-y-3">
                {practiceHistoryMock.slice(0, 3).map((item) => (
                  <div key={item.id} className="p-3 bg-[var(--background)] rounded-xl border border-[var(--border-subtle)] flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-[var(--text-primary)]">{item.topic}</h4>
                      <p className="text-[11px] text-[var(--text-secondary)]">{item.subject} • {item.questionsCount} Qs • {item.date}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold text-[var(--primary)]">{item.score}%</span>
                      <Badge variant={item.score >= 80 ? 'success' : 'warning'} className="block mt-0.5">
                        {item.score >= 80 ? 'Passed' : 'Review'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

          </div>

          {/* Right Column: AI Preparation Card & Recent Activity */}
          <div className="lg:col-span-5 space-y-6">
            <AIPreparationCard />

            {/* Recent Activity Log */}
            <Card title="Recent Activity & Feed">
              <div className="space-y-3">
                <div className="flex items-start gap-3 text-xs">
                  <div className="w-7 h-7 rounded-full bg-[var(--primary-light)] text-[var(--primary)] flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="font-bold text-[var(--text-primary)]">Submitted Midterm Exam</h5>
                    <p className="text-[11px] text-[var(--text-secondary)]">CS301 Data Structures • Score: 78/100</p>
                    <span className="text-[10px] text-[var(--text-muted)]">2 hours ago</span>
                  </div>
                </div>

                <div className="flex items-start gap-3 text-xs pt-2 border-t border-[var(--border-subtle)]">
                  <div className="w-7 h-7 rounded-full bg-[var(--primary-light)] text-[var(--primary)] flex items-center justify-center shrink-0 mt-0.5">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="font-bold text-[var(--text-primary)]">Generated AI Practice Set</h5>
                    <p className="text-[11px] text-[var(--text-secondary)]">15 questions on Dynamic Memory Allocation</p>
                    <span className="text-[10px] text-[var(--text-muted)]">Yesterday at 4:30 PM</span>
                  </div>
                </div>
              </div>
            </Card>

          </div>

        </div>
      </div>
    </AppShell>
  );
};
