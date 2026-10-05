import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Sparkles, Construction, ArrowLeft, Home, Layers } from 'lucide-react';

export const PlaceholderPage = ({ 
  title = "Module Under Development", 
  subtitle = "This section is configured and ready for implementation.", 
  role = "Student",
  moduleName = "Feature" 
}) => {
  const navigate = useNavigate();

  const dashboardRoute = {
    Student: '/student/dashboard',
    Instructor: '/instructor/dashboard',
    Admin: '/admin/dashboard',
  }[role] || '/student/dashboard';

  return (
    <AppShell title={title}>
      <div className="space-y-6 max-w-4xl mx-auto py-8">
        <Card className="p-8 md:p-12 text-center space-y-6 border-[var(--primary-border)] shadow-lg bg-[var(--surface)]">
          <div className="w-16 h-16 rounded-2xl bg-[var(--primary-light)] text-[var(--primary)] flex items-center justify-center mx-auto shadow-xs">
            <Construction className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--primary)] bg-[var(--primary-light)] px-3 py-1 rounded-full border border-[var(--primary-border)]">
              {role} Portal • {moduleName}
            </span>
            <h1 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)] tracking-tight">
              {title}
            </h1>
            <p className="text-xs text-[var(--text-secondary)] max-w-md mx-auto leading-relaxed">
              {subtitle}
            </p>
          </div>

          <div className="p-4 bg-[var(--background)] rounded-xl border border-[var(--border-subtle)] text-xs text-[var(--text-secondary)] max-w-md mx-auto space-y-1">
            <p className="font-semibold text-[var(--text-primary)] flex items-center justify-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[var(--primary)]" /> Status: UI Route Configured
            </p>
            <p className="text-[11px] text-[var(--text-muted)]">
              This module route is registered cleanly in the ExamForge routing system.
            </p>
          </div>

          <div className="flex items-center justify-center gap-3 pt-2">
            <Button variant="primary" size="md" icon={Home} onClick={() => navigate(dashboardRoute)}>
              Return to Dashboard
            </Button>
            <Button variant="outline" size="md" icon={ArrowLeft} onClick={() => navigate(-1)}>
              Go Back
            </Button>
          </div>
        </Card>
      </div>
    </AppShell>
  );
};
