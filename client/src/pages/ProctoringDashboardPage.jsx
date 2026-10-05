import React from 'react';
import { AppShell } from '../components/layout/AppShell';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { proctoringMockData } from '../mockData';
import { ShieldAlert, Eye, AlertTriangle } from 'lucide-react';

export const ProctoringDashboardPage = () => {
  const data = proctoringMockData;

  return (
    <AppShell title="Proctoring & Integrity Dashboard">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">Proctoring Monitor</h1>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">Live monitoring and integrity signals</p>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[var(--text-secondary)] bg-[var(--surface)] px-3 py-1.5 rounded-[var(--radius-md)] border border-[var(--border)]">
            <span>Active Students:</span>
            <span className="text-[var(--primary)] font-bold">{data.activeStudents}/{data.totalEnrolled}</span>
          </div>
        </div>

        <Card title="Live Exam Monitoring Session">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[var(--border-subtle)] text-[var(--text-secondary)]">
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Progress</th>
                  <th className="py-3 px-4">Time Elapsed</th>
                  <th className="py-3 px-4">Risk Level</th>
                  <th className="py-3 px-4">Events</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)]">
                {data.students.map((st) => (
                  <tr key={st.id} className="hover:bg-[var(--background)]">
                    <td className="py-3 px-4 font-bold text-[var(--text-primary)]">
                      {st.name} <span className="text-[10px] text-[var(--text-muted)]">#{st.id}</span>
                    </td>
                    <td className="py-3 px-4 text-[var(--text-secondary)] font-medium">{st.progress}</td>
                    <td className="py-3 px-4 text-[var(--text-secondary)]">{st.timeElapsed}</td>
                    <td className="py-3 px-4">
                      <Badge variant={st.riskLevel === 'High' ? 'error' : st.riskLevel === 'Medium' ? 'warning' : 'success'}>
                        {st.riskLevel}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 font-bold text-[var(--text-primary)]">{st.events}</td>
                    <td className="py-3 px-4 text-right">
                      <Button variant="ghost" size="sm" icon={Eye}>View Logs</Button>
                    </td>
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
