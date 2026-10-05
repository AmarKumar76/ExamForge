import React from 'react';
import { AppShell } from '../components/layout/AppShell';
import { Card } from '../components/ui/Card';
import { StatCard } from '../components/ui/StatCard';
import { adminMockData } from '../mockData';
import { Users, Building2, FileText, AlertCircle, CheckCircle2 } from 'lucide-react';

export const AdminPanelPage = () => {
  const data = adminMockData;

  return (
    <AppShell title="Admin Panel">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">System Overview</h1>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">Manage platform users, institutions and monitor system health.</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard title="Total Users" value={data.stats.totalUsers} icon={Users} />
          <StatCard title="Institutions" value={data.stats.institutionsCount} icon={Building2} />
          <StatCard title="Active Exams" value={data.stats.activeExamsCount} icon={FileText} />
          <StatCard title="System Alerts" value={data.stats.systemAlertsCount} icon={AlertCircle} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          <div className="md:col-span-7">
            <Card title="Recent Users">
              <div className="space-y-3">
                {data.recentUsers.map((u, i) => (
                  <div key={i} className="p-3 bg-[var(--background)] rounded-[var(--radius-md)] border border-[var(--border-subtle)] flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-[var(--text-primary)]">{u.name}</h4>
                      <p className="text-[11px] text-[var(--text-secondary)]">{u.email} • {u.joined}</p>
                    </div>
                    <span className="text-xs font-bold text-[var(--primary)]">{u.role}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <div className="md:col-span-5">
            <Card title="System Health">
              <div className="space-y-3 text-xs">
                {Object.entries(data.systemHealth).map(([key, val]) => (
                  <div key={key} className="flex justify-between items-center p-2.5 bg-[var(--background)] rounded-[var(--radius-md)] border border-[var(--border-subtle)]">
                    <span className="font-semibold capitalize text-[var(--text-primary)]">{key}</span>
                    <span className={`font-bold flex items-center gap-1 ${val.includes('Warning') ? 'text-[var(--warning)]' : 'text-[var(--success)]'}`}>
                      <CheckCircle2 className="w-3.5 h-3.5" /> {val}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </AppShell>
  );
};
