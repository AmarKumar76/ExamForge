import React from 'react';
import { AppShell } from '../components/layout/AppShell';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const CreateExamPage = () => {
  const navigate = useNavigate();

  const steps = [
    { number: 1, label: 'Basic Details', active: true, completed: false },
    { number: 2, label: 'Select Questions', active: false, completed: false },
    { number: 3, label: 'Settings', active: false, completed: false },
    { number: 4, label: 'Review', active: false, completed: false },
  ];

  return (
    <AppShell title="Create New Exam">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Create New Exam</h1>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            Set up your exam with questions, timing and settings.
          </p>
        </div>

        {/* Stepper Bar */}
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-lg)] p-4 flex items-center justify-between overflow-x-auto">
          {steps.map((s, index) => (
            <React.Fragment key={s.number}>
              <div className="flex items-center gap-2 shrink-0">
                <div
                  className={`w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center ${
                    s.active
                      ? 'bg-[var(--primary)] text-white shadow-sm'
                      : 'bg-[var(--surface-muted)] text-[var(--text-muted)]'
                  }`}
                >
                  {s.number}
                </div>
                <span className={`text-xs font-semibold ${s.active ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)]'}`}>
                  {s.label}
                </span>
              </div>
              {index < steps.length - 1 && <div className="w-12 h-0.5 bg-[var(--border)] shrink-0 hidden sm:block" />}
            </React.Fragment>
          ))}
        </div>

        <Card className="max-w-3xl mx-auto">
          <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">Exam Title</label>
                <input
                  type="text"
                  defaultValue="Operating Systems Midterm"
                  className="w-full px-3.5 py-2 text-xs bg-[var(--surface-muted)] border border-[var(--border)] rounded-[var(--radius-md)] text-[var(--text-primary)]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">Duration</label>
                <select className="w-full px-3.5 py-2 text-xs bg-[var(--surface-muted)] border border-[var(--border)] rounded-[var(--radius-md)] text-[var(--text-primary)]">
                  <option>60 minutes</option>
                  <option>45 minutes</option>
                  <option>90 minutes</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">Course</label>
                <select className="w-full px-3.5 py-2 text-xs bg-[var(--surface-muted)] border border-[var(--border)] rounded-[var(--radius-md)] text-[var(--text-primary)]">
                  <option>Operating Systems (CSE300)</option>
                  <option>Database Systems (CSE204)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">Total Marks</label>
                <input
                  type="number"
                  defaultValue={50}
                  className="w-full px-3.5 py-2 text-xs bg-[var(--surface-muted)] border border-[var(--border)] rounded-[var(--radius-md)] text-[var(--text-primary)]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">Description</label>
              <textarea
                rows={3}
                defaultValue="Midterm exam covering process management, scheduling, and deadlocks."
                className="w-full px-3.5 py-2 text-xs bg-[var(--surface-muted)] border border-[var(--border)] rounded-[var(--radius-md)] text-[var(--text-primary)]"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">Start Date & Time</label>
                <input
                  type="text"
                  defaultValue="Oct 10, 2026 10:00 AM"
                  className="w-full px-3.5 py-2 text-xs bg-[var(--surface-muted)] border border-[var(--border)] rounded-[var(--radius-md)] text-[var(--text-primary)]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">End Date & Time</label>
                <input
                  type="text"
                  defaultValue="Oct 10, 2026 11:00 AM"
                  className="w-full px-3.5 py-2 text-xs bg-[var(--surface-muted)] border border-[var(--border)] rounded-[var(--radius-md)] text-[var(--text-primary)]"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-[var(--border-subtle)] flex justify-end">
              <Button variant="primary" size="md" icon={ArrowRight} onClick={() => navigate('/instructor/exams/blueprint')}>
                Next: Select Questions
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </AppShell>
  );
};
