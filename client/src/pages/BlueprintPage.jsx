import React from 'react';
import { AppShell } from '../components/layout/AppShell';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Sparkles, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const BlueprintPage = () => {
  const navigate = useNavigate();

  return (
    <AppShell title="Question Selection">
      <div className="space-y-6 max-w-4xl mx-auto">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Question Selection</h1>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            Choose questions manually or use smart blueprint
          </p>
        </div>

        {/* Blueprint Mode Picker */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-lg)] cursor-pointer hover:border-[var(--primary)] transition-all">
            <h4 className="text-sm font-bold text-[var(--text-primary)]">Manual Selection</h4>
            <p className="text-xs text-[var(--text-secondary)] mt-1">Choose specific questions from question bank</p>
          </div>
          <div className="p-4 bg-[var(--primary-light)] border border-[var(--primary-border)] rounded-[var(--radius-lg)] cursor-pointer">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[var(--primary)]" />
              <h4 className="text-sm font-bold text-[var(--primary)]">Smart Blueprint</h4>
            </div>
            <p className="text-xs text-[var(--primary)] mt-1">Auto-generate questions based on criteria</p>
          </div>
        </div>

        <Card title="Blueprint Parameters">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-3">Difficulty Distribution</h4>
              <div className="space-y-3 text-xs">
                <div>
                  <div className="flex justify-between font-semibold mb-1"><span>Easy</span><span>30%</span></div>
                  <input type="range" defaultValue={30} className="w-full accent-[var(--primary)]" />
                </div>
                <div>
                  <div className="flex justify-between font-semibold mb-1"><span>Medium</span><span>50%</span></div>
                  <input type="range" defaultValue={50} className="w-full accent-[var(--primary)]" />
                </div>
                <div>
                  <div className="flex justify-between font-semibold mb-1"><span>Hard</span><span>20%</span></div>
                  <input type="range" defaultValue={20} className="w-full accent-[var(--primary)]" />
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-3">Topic Distribution</h4>
              <div className="space-y-3 text-xs">
                <div className="flex justify-between font-semibold"><span>Processes</span><span>30%</span></div>
                <div className="flex justify-between font-semibold"><span>Scheduling</span><span>25%</span></div>
                <div className="flex justify-between font-semibold"><span>Memory Management</span><span>25%</span></div>
                <div className="flex justify-between font-semibold"><span>File Systems</span><span>20%</span></div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-[var(--border-subtle)] flex items-center justify-between">
            <span className="text-xs font-bold text-[var(--text-primary)]">Total Questions: 20</span>
            <Button variant="primary" size="md" icon={ArrowRight} onClick={() => navigate('/instructor/exams')}>
              Generate Question Set →
            </Button>
          </div>
        </Card>
      </div>
    </AppShell>
  );
};
