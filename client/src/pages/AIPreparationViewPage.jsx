import React, { useState } from 'react';
import { AppShell } from '../components/layout/AppShell';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { ProgressRing } from '../components/ui/ProgressBar';
import { Sparkles, BrainCircuit, ArrowRight, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const AIPreparationViewPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('Overview');

  const topics = [
    { name: "DBMS — Normalization", perf: 42, status: "Weak", action: "Practice" },
    { name: "Operating Systems — CPU Scheduling", perf: 48, status: "Needs Practice", action: "Practice" },
    { name: "Computer Networks — TCP/IP", perf: 55, status: "Needs Practice", action: "Practice" },
    { name: "Data Structures — Trees", perf: 82, status: "Strong", action: "Revise" },
  ];

  return (
    <AppShell title="AI Preparation">
      <div className="space-y-6 max-w-6xl mx-auto">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">AI Preparation</h1>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">Personalized preparation based on your exam performance.</p>
        </div>

        {/* Overview Navigation Tabs */}
        <div className="flex border-b border-[var(--border)] gap-6 text-xs font-semibold text-[var(--text-secondary)]">
          {['Overview', 'Learning Analysis', 'Study Plan', 'Practice', 'Progress'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-2.5 transition-all ${activeTab === tab ? 'border-b-2 border-[var(--primary)] text-[var(--primary)] font-bold' : 'hover:text-[var(--text-primary)]'}`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* 2-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Learning Overview */}
          <div className="lg:col-span-7 space-y-6">
            <Card title="Learning Overview">
              <div className="grid grid-cols-4 gap-2 text-center p-3 bg-[var(--surface-muted)] rounded-[var(--radius-lg)] mb-4">
                <div><span className="text-xl font-bold text-[var(--primary)]">72%</span><span className="text-[10px] text-[var(--text-secondary)] block">Readiness</span></div>
                <div><span className="text-xl font-bold text-[var(--error)]">3</span><span className="text-[10px] text-[var(--text-secondary)] block">Weak Areas</span></div>
                <div><span className="text-xl font-bold text-[var(--warning)]">2</span><span className="text-[10px] text-[var(--text-secondary)] block">Improving</span></div>
                <div><span className="text-xl font-bold text-[var(--success)]">4</span><span className="text-[10px] text-[var(--text-secondary)] block">Strong Areas</span></div>
              </div>

              <h4 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2">AI Learning Analysis</h4>
              <div className="space-y-2">
                {topics.map((t, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-[var(--background)] rounded-[var(--radius-md)] border border-[var(--border-subtle)]">
                    <div>
                      <h5 className="text-xs font-bold text-[var(--text-primary)]">{t.name}</h5>
                      <span className={`text-[11px] font-bold ${t.perf < 50 ? 'text-[var(--error)]' : 'text-[var(--success)]'}`}>{t.perf}% Performance</span>
                    </div>
                    <Badge variant={t.status === 'Strong' ? 'success' : t.status === 'Weak' ? 'error' : 'warning'}>
                      {t.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Right Column: Gemini Recommendation Card */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-[var(--primary-light)] border border-[var(--primary-border)] rounded-[var(--radius-lg)] p-6 space-y-4">
              <div className="flex items-center gap-2 text-[var(--primary)]">
                <Sparkles className="w-5 h-5" />
                <h3 className="text-sm font-bold">Gemini Recommendation</h3>
              </div>

              <p className="text-xs text-[var(--primary)] leading-relaxed">
                Your performance shows that Normalization and CPU Scheduling need more practice. I recommend revising:
              </p>

              <ul className="text-xs font-semibold text-[var(--primary)] space-y-1.5 pl-4 list-disc">
                <li>Functional Dependencies</li>
                <li>1NF, 2NF, 3NF, BCNF</li>
                <li>FCFS, SJF and Round Robin</li>
              </ul>

              <Button variant="primary" size="md" className="w-full" icon={ArrowRight} onClick={() => navigate('/student/practice/generate')}>
                Generate Practice Assessment →
              </Button>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
};
