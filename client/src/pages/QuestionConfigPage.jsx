import React, { useState } from 'react';
import { AppShell } from '../components/layout/AppShell';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Sparkles, ArrowRight, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const QuestionConfigPage = () => {
  const navigate = useNavigate();

  const [subject, setSubject] = useState('Operating Systems');
  const [topic, setTopic] = useState('Process Scheduling');
  const [count, setCount] = useState(10);
  const [easyDist, setEasyDist] = useState(30);
  const [mediumDist, setMediumDist] = useState(50);
  const [hardDist, setHardDist] = useState(20);

  const steps = [
    { number: 1, label: 'Upload Material', active: false, completed: true },
    { number: 2, label: 'Configure', active: true, completed: false },
    { number: 3, label: 'Preview & Edit', active: false, completed: false },
    { number: 4, label: 'Save to Bank', active: false, completed: false },
  ];

  return (
    <AppShell title="Configure Generation">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Configure Generation</h1>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            Set your preferences for AI question generation
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
                      : s.completed
                      ? 'bg-[var(--success-light)] text-[var(--success)]'
                      : 'bg-[var(--surface-muted)] text-[var(--text-muted)]'
                  }`}
                >
                  {s.number}
                </div>
                <span
                  className={`text-xs font-semibold ${
                    s.active ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)]'
                  }`}
                >
                  {s.label}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div className="w-12 h-0.5 bg-[var(--border)] shrink-0 hidden sm:block" />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Configuration Form */}
        <Card className="max-w-3xl mx-auto">
          <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1.5">Subject</label>
                <select
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-[var(--surface-muted)] border border-[var(--border)] rounded-[var(--radius-md)] text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--primary)]"
                >
                  <option>Operating Systems</option>
                  <option>Database Management Systems</option>
                  <option>Computer Networks</option>
                  <option>Data Structures</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1.5">Topic</label>
                <select
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-[var(--surface-muted)] border border-[var(--border)] rounded-[var(--radius-md)] text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--primary)]"
                >
                  <option>Process Scheduling</option>
                  <option>Deadlocks</option>
                  <option>Memory Management</option>
                  <option>File Systems</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1.5">Number of Questions</label>
              <input
                type="number"
                value={count}
                onChange={(e) => setCount(Number(e.target.value))}
                className="w-full md:w-48 px-3.5 py-2 text-xs bg-[var(--surface-muted)] border border-[var(--border)] rounded-[var(--radius-md)] text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--primary)]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[var(--text-secondary)] mb-2">Question Types</label>
              <div className="flex flex-wrap gap-4 text-xs font-medium text-[var(--text-primary)]">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" defaultChecked className="accent-[var(--primary)]" />
                  <span>MCQ</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="accent-[var(--primary)]" />
                  <span>True/False</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="accent-[var(--primary)]" />
                  <span>Short Answer</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="accent-[var(--primary)]" />
                  <span>Descriptive</span>
                </label>
              </div>
            </div>

            {/* Difficulty Sliders */}
            <div className="space-y-4 pt-2">
              <h4 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Difficulty Distribution</h4>

              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span>Easy</span>
                    <span>{easyDist}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={easyDist}
                    onChange={(e) => setEasyDist(Number(e.target.value))}
                    className="w-full accent-[var(--primary)]"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span>Medium</span>
                    <span>{mediumDist}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={mediumDist}
                    onChange={(e) => setMediumDist(Number(e.target.value))}
                    className="w-full accent-[var(--primary)]"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span>Hard</span>
                    <span>{hardDist}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={hardDist}
                    onChange={(e) => setHardDist(Number(e.target.value))}
                    className="w-full accent-[var(--primary)]"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-[var(--border-subtle)]">
              <Button variant="secondary" size="md" icon={ArrowLeft} onClick={() => navigate('/instructor/ai-studio')}>
                Back
              </Button>
              <Button variant="primary" size="md" icon={Sparkles} onClick={() => navigate('/instructor/ai-studio/preview')}>
                Generate Questions →
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </AppShell>
  );
};
