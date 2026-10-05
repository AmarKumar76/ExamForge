import React from 'react';
import { AppShell } from '../components/layout/AppShell';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { ProgressRing } from '../components/ui/ProgressBar';
import { CheckCircle2, TrendingUp, Sparkles, ArrowRight, RotateCcw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const PracticeResultPage = () => {
  const navigate = useNavigate();

  const concepts = [
    { name: "Functional Dependencies", score: 80 },
    { name: "Candidate Keys", score: 70 },
    { name: "2NF", score: 90 },
    { name: "3NF", score: 60 },
    { name: "BCNF", score: 55 },
  ];

  return (
    <AppShell title="Practice Result">
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* Banner */}
        <div className="p-4 bg-[var(--success-light)] border border-green-200 rounded-[var(--radius-lg)] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 text-[var(--success)] shrink-0" />
            <div>
              <h2 className="text-base font-bold text-[var(--text-primary)]">Practice Complete!</h2>
              <p className="text-xs text-[var(--text-secondary)]">DBMS — Normalization</p>
            </div>
          </div>
          <Badge variant="success">Practice Assessment</Badge>
        </div>

        {/* Score & Improvement Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          {/* Score & Improvement Ring */}
          <div className="md:col-span-5 bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-lg)] p-6 text-center space-y-4">
            <ProgressRing value={72} size={110} strokeWidth={10} sublabel="Practice Score" />

            <div className="p-3 bg-[var(--primary-light)] rounded-[var(--radius-md)] border border-[var(--primary-border)] inline-flex items-center gap-2 text-xs">
              <TrendingUp className="w-4 h-4 text-[var(--success)]" />
              <span className="font-bold text-[var(--success)]">+30% Improvement</span>
              <span className="text-[var(--text-secondary)]">(42% → 72%)</span>
            </div>
          </div>

          {/* Topic Breakdown & AI Analysis */}
          <div className="md:col-span-7 space-y-4">
            <Card title="Topic Performance">
              <div className="space-y-2.5">
                {concepts.map((c, i) => (
                  <div key={i} className="space-y-1 text-xs">
                    <div className="flex justify-between font-semibold">
                      <span className="text-[var(--text-primary)]">{c.name}</span>
                      <span className="text-[var(--text-secondary)]">{c.score}%</span>
                    </div>
                    <div className="w-full h-2 bg-[var(--surface-muted)] rounded-full overflow-hidden">
                      <div className="h-full bg-[var(--primary)] rounded-full" style={{ width: `${c.score}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <div className="p-4 bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-lg)] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[var(--primary)]" />
                  <h4 className="text-xs font-bold text-[var(--text-primary)]">AI Performance Analysis</h4>
                </div>
                <Badge variant="success">Improving</Badge>
              </div>

              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                Great improvement! Your understanding of normalization has improved significantly. Practice 5 more questions focused on BCNF.
              </p>

              <div className="flex gap-2 pt-1">
                <Button variant="primary" size="sm" icon={RotateCcw} onClick={() => navigate('/student/practice/generate')}>
                  Practice Again
                </Button>
                <Button variant="secondary" size="sm" icon={ArrowRight} onClick={() => navigate('/student/ai-prep')}>
                  Continue Preparation
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
};
