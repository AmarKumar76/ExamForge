import React from 'react';
import { AppShell } from '../components/layout/AppShell';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { ProgressRing, ProgressBar } from '../components/ui/ProgressBar';
import { Sparkles, ArrowRight, Award } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const StudentResultPage = () => {
  const navigate = useNavigate();

  const topics = [
    { name: "Process Management", score: 80, color: "#1b4332" },
    { name: "CPU Scheduling", score: 42, color: "#e07a5f" },
    { name: "Memory Management", score: 76, color: "#2d6a4f" },
    { name: "Deadlocks", score: 60, color: "#d97706" },
    { name: "Synchronization", score: 70, color: "#2d6a4f" },
  ];

  return (
    <AppShell title="My Results">
      <div className="space-y-6 max-w-5xl mx-auto">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">My Results</h1>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            View your exam results and performance analysis.
          </p>
        </div>

        <Card title="Operating Systems Midterm" subtitle="CSE300 • Oct 10, 2026">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            {/* Score Ring */}
            <div className="md:col-span-4 flex flex-col items-center justify-center p-4 bg-[var(--surface-muted)] rounded-[var(--radius-lg)] border border-[var(--border-subtle)]">
              <ProgressRing value={78} size={110} strokeWidth={10} sublabel="Good Performance" />
              <div className="text-center mt-3">
                <span className="text-xl font-extrabold text-[var(--text-primary)]">16 / 20</span>
                <p className="text-xs text-[var(--text-secondary)] font-medium">Marks Obtained</p>
              </div>
            </div>

            {/* Topic Performance Bars */}
            <div className="md:col-span-8 space-y-3">
              <h4 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Topic-wise Performance</h4>
              {topics.map((t, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-[var(--text-primary)]">{t.name}</span>
                    <span className="text-[var(--text-secondary)]">{t.score}%</span>
                  </div>
                  <div className="w-full h-2 bg-[var(--surface-muted)] rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${t.score}%`, backgroundColor: t.color }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recommended Preparation Banner */}
          <div className="mt-6 p-5 bg-[var(--primary-light)] rounded-[var(--radius-lg)] border border-[var(--primary-border)] flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-[var(--radius-md)] bg-[var(--primary)] text-white flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-[var(--primary)]">Recommended Preparation</h4>
                <p className="text-xs text-[var(--primary)] opacity-90 mt-0.5">CPU Scheduling (42%) and Deadlocks (60%) need more practice.</p>
              </div>
            </div>
            <Button variant="primary" size="md" icon={ArrowRight} onClick={() => navigate('/student/ai-prep')}>
              Start AI Preparation
            </Button>
          </div>
        </Card>
      </div>
    </AppShell>
  );
};
