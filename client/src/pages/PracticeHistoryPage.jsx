import React from 'react';
import { AppShell } from '../components/layout/AppShell';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { practiceHistoryMockData } from '../mockData';
import { TrendingUp, Calendar, Target } from 'lucide-react';

export const PracticeHistoryPage = () => {
  const history = practiceHistoryMockData;

  return (
    <AppShell title="Practice History">
      <div className="space-y-6 max-w-5xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">Practice History</h1>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">Your practice assessments and improvement over time.</p>
          </div>
          <select className="px-3 py-1.5 text-xs bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-md)] text-[var(--text-primary)] font-semibold">
            <option>All Topics</option>
            <option>DBMS — Normalization</option>
            <option>OS — CPU Scheduling</option>
          </select>
        </div>

        {/* Progress Trend Visual Chart Box */}
        <Card title="Progress Trend — Normalization">
          <div className="h-32 flex items-end justify-between px-6 pt-4 border-b border-[var(--border-subtle)] pb-6 relative">
            <div className="flex-1 flex flex-col items-center gap-1">
              <span className="text-xs font-bold text-[var(--error)]">42%</span>
              <div className="w-8 bg-red-200 rounded-t h-12" />
              <span className="text-[10px] text-[var(--text-secondary)] font-semibold">Official Exam</span>
            </div>
            <div className="flex-1 flex flex-col items-center gap-1">
              <span className="text-xs font-bold text-[var(--warning)]">56%</span>
              <div className="w-8 bg-amber-200 rounded-t h-16" />
              <span className="text-[10px] text-[var(--text-secondary)] font-semibold">Practice 1</span>
            </div>
            <div className="flex-1 flex flex-col items-center gap-1">
              <span className="text-xs font-bold text-[var(--success)]">72%</span>
              <div className="w-8 bg-[var(--primary)] rounded-t h-24" />
              <span className="text-[10px] text-[var(--text-secondary)] font-semibold">Practice 2</span>
            </div>
          </div>
        </Card>

        {/* History Table */}
        <Card title="Past Practice Attempts">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[var(--border-subtle)] text-[var(--text-secondary)]">
                  <th className="py-3 px-4">Assessment</th>
                  <th className="py-3 px-4">Topic</th>
                  <th className="py-3 px-4">Score</th>
                  <th className="py-3 px-4">Improvement</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)]">
                {history.map((item) => (
                  <tr key={item.id} className="hover:bg-[var(--background)]">
                    <td className="py-3 px-4 font-bold text-[var(--text-primary)]">{item.title}</td>
                    <td className="py-3 px-4 text-[var(--text-secondary)]">{item.topic}</td>
                    <td className="py-3 px-4 font-bold text-[var(--text-primary)]">{item.score}%</td>
                    <td className={`py-3 px-4 font-bold ${item.improvement.startsWith('+') ? 'text-[var(--success)]' : 'text-[var(--error)]'}`}>
                      {item.improvement}
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={item.status === 'Strong' ? 'success' : item.status === 'Improving' ? 'primary' : 'warning'}>
                        {item.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-right text-[var(--text-secondary)]">{item.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </AppShell>
  );
};
