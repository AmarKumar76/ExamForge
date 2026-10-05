import React from 'react';
import { AppShell } from '../components/layout/AppShell';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { StatCard } from '../components/ui/StatCard';
import { examAnalyticsMockData } from '../mockData';
import { Download, Users, CheckCircle2, Award, TrendingUp, BarChart3 } from 'lucide-react';

export const InstructorExamAnalyticsPage = () => {
  const data = examAnalyticsMockData;

  return (
    <AppShell title="Exam Analytics">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">Exam Analytics</h1>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              Operating Systems Midterm • CSE300 • Oct 10, 2026
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" icon={Download}>Export Report</Button>
            <Button variant="primary" size="sm">View Answers</Button>
          </div>
        </div>

        {/* 5 Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <StatCard title="Total Students" value={data.totalStudents} icon={Users} />
          <StatCard title="Submitted" value={data.submittedCount} icon={CheckCircle2} />
          <StatCard title="Average Score" value={`${data.averageScore}%`} icon={Award} />
          <StatCard title="Highest Score" value={`${data.highestScore}%`} icon={TrendingUp} />
          <StatCard title="Lowest Score" value={`${data.lowestScore}%`} icon={BarChart3} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Score Distribution Histogram */}
          <div className="lg:col-span-5">
            <Card title="Score Distribution">
              <div className="h-48 flex items-end justify-between gap-2 pt-6 px-2">
                {[
                  { range: "0-10", height: "10%" },
                  { range: "10-20", height: "25%" },
                  { range: "20-30", height: "45%" },
                  { range: "30-40", height: "80%" },
                  { range: "40-50", height: "100%" },
                ].map((bar, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-2">
                    <div className="w-full bg-[var(--primary)] rounded-t-[var(--radius-sm)] transition-all" style={{ height: bar.height }} />
                    <span className="text-[10px] font-medium text-[var(--text-secondary)]">{bar.range}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Question Analysis Table */}
          <div className="lg:col-span-7">
            <Card title="Question Analysis">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[var(--border-subtle)] text-[var(--text-secondary)]">
                      <th className="py-2.5 px-3">Question</th>
                      <th className="py-2.5 px-3">Type</th>
                      <th className="py-2.5 px-3">Correct %</th>
                      <th className="py-2.5 px-3">Avg Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-subtle)]">
                    {data.questionAnalysis.map((q) => (
                      <tr key={q.id}>
                        <td className="py-2.5 px-3 font-semibold text-[var(--text-primary)]">Question {q.id}</td>
                        <td className="py-2.5 px-3 text-[var(--text-secondary)]">{q.type}</td>
                        <td className={`py-2.5 px-3 font-bold ${q.correctPct < 50 ? 'text-[var(--error)]' : 'text-[var(--success)]'}`}>
                          {q.correctPct}%
                        </td>
                        <td className="py-2.5 px-3 text-[var(--text-secondary)]">{q.avgTime}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </AppShell>
  );
};
