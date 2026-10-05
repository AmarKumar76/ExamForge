import React from 'react';
import { Sparkles, ArrowRight, BrainCircuit, Target, AlertCircle } from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { ProgressRing } from '../ui/ProgressBar';
import { studentMockData } from '../../mockData';
import { useNavigate } from 'react-router-dom';

export const AIPreparationCard = ({ className = '' }) => {
  const navigate = useNavigate();
  const prep = studentMockData.aiPreparation;

  return (
    <div className={`bg-[var(--surface)] border border-[var(--primary-border)] rounded-[var(--radius-lg)] p-6 shadow-[var(--shadow-sm)] relative overflow-hidden ${className}`}>
      {/* Decorative Forest Accent Line */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[var(--primary)] via-[var(--secondary)] to-[var(--accent)]" />

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-[var(--radius-md)] bg-[var(--primary-light)] text-[var(--primary)] flex items-center justify-center">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[var(--text-primary)]">AI Preparation</h3>
            <p className="text-xs text-[var(--text-secondary)]">Based on your latest official exam ({prep.lastExamTitle})</p>
          </div>
        </div>
        <Badge variant="ai">AI Active</Badge>
      </div>

      {/* Main Readiness & Weak Areas Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center my-4">
        {/* Readiness Meter */}
        <div className="md:col-span-4 flex flex-col items-center justify-center p-3 bg-[var(--surface-muted)]/60 rounded-[var(--radius-md)] border border-[var(--border-subtle)]">
          <ProgressRing value={prep.overallReadiness} size={90} strokeWidth={8} sublabel="Readiness" />
          <p className="text-xs text-[var(--text-secondary)] font-medium mt-2 text-center">
            {prep.areasNeedingAttentionCount} areas need attention
          </p>
        </div>

        {/* Weak Topic Breakdown List */}
        <div className="md:col-span-8 space-y-2.5">
          <h4 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Identified Weak Areas</h4>
          {prep.weakAreas.map((area, index) => (
            <div key={index} className="flex items-center justify-between p-2.5 bg-[var(--background)] rounded-[var(--radius-md)] border border-[var(--border-subtle)]">
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-2 h-2 rounded-full bg-[var(--accent)] shrink-0" />
                <span className="text-xs font-semibold text-[var(--text-primary)] truncate">{area.topic}</span>
              </div>
              <span className={`text-xs font-bold ${area.accuracy < 45 ? 'text-[var(--error)]' : 'text-[var(--warning)]'}`}>
                {area.accuracy}%
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* AI Recommendation Message */}
      <div className="p-3 bg-[var(--primary-light)] rounded-[var(--radius-md)] border border-[var(--primary-border)] flex items-start gap-2.5 my-4">
        <BrainCircuit className="w-4 h-4 text-[var(--primary)] shrink-0 mt-0.5" />
        <p className="text-xs text-[var(--primary)] font-medium leading-relaxed">
          "{prep.recommendationSummary}"
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <Button variant="primary" size="sm" icon={Sparkles} onClick={() => navigate('/student/ai-prep')}>
          Start Preparation
        </Button>
        <Button variant="secondary" size="sm" icon={Target} onClick={() => navigate('/student/practice')}>
          Practice Now
        </Button>
      </div>
    </div>
  );
};
