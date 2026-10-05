import React from 'react';
import { AppShell } from '../components/layout/AppShell';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Target, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const PracticeHistoryPage = () => {
  const navigate = useNavigate();

  return (
    <AppShell title="Practice History">
      <div className="space-y-6 max-w-5xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">Practice History</h1>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">Your practice assessments and improvement over time.</p>
          </div>
        </div>

        <div className="p-16 text-center bg-[var(--surface)] border border-[var(--border)] rounded-2xl">
          <Target className="w-12 h-12 text-[var(--primary)] mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2">No Practice History</h3>
          <p className="text-xs text-[var(--text-secondary)] mb-6 max-w-md mx-auto">
            You haven't generated any AI practice assessments yet. Practice helps reinforce concepts identified as weak in your official exams.
          </p>
          <Button variant="primary" onClick={() => navigate('/student/dashboard')}>
            View Dashboard
          </Button>
        </div>
      </div>
    </AppShell>
  );
};
