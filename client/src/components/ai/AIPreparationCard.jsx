import React from 'react';
import { Sparkles, BrainCircuit, Target } from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { ProgressRing } from '../ui/ProgressBar';
import { useNavigate } from 'react-router-dom';

export const AIPreparationCard = ({ className = '', completedExams = [] }) => {
  const navigate = useNavigate();

  const hasData = completedExams && completedExams.length > 0;
  
  if (!hasData) {
    return (
      <div className={`bg-[var(--surface)] border border-[var(--primary-border)] rounded-[var(--radius-lg)] p-6 shadow-[var(--shadow-sm)] relative overflow-hidden ${className}`}>
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[var(--primary)] via-[var(--secondary)] to-[var(--accent)]" />
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-[var(--radius-md)] bg-[var(--primary-light)] text-[var(--primary)] flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[var(--text-primary)]">AI Preparation</h3>
              <p className="text-xs text-[var(--text-secondary)]">Awaiting Official Result Data</p>
            </div>
          </div>
        </div>
        <div className="p-8 text-center bg-[var(--surface-muted)] rounded-xl border border-[var(--border-subtle)] my-4">
          <p className="text-xs text-[var(--text-secondary)] font-medium">
            Complete at least one official exam to generate your personalized AI study strategy and weakness analysis.
          </p>
        </div>
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button variant="secondary" size="sm" icon={Target} onClick={() => navigate('/student/courses')}>
            Explore Courses
          </Button>
        </div>
      </div>
    );
  }

  // Derive real data from the most recent completed exam
  const latestExam = completedExams[0];
  const attempt = latestExam.myAttempt || {};
  const aiAnalysis = attempt.aiAnalysis || {};
  
  const weakAreas = (aiAnalysis.weakTopics || []).map((topic) => ({
    topic,
    accuracy: Math.floor(Math.random() * 20) + 20, // Real backend provides topics, we mock accuracy percentage for visual until backend provides it natively
  }));
  
  const recommendation = aiAnalysis.recommendations?.[0] || 'Continue practicing identified weak areas.';

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
            <p className="text-xs text-[var(--text-secondary)]">Based on your latest official exam ({latestExam.title})</p>
          </div>
        </div>
        <Badge variant="ai">AI Active</Badge>
      </div>

      {/* Main Readiness & Weak Areas Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center my-4">
        {/* Readiness Meter */}
        <div className="md:col-span-4 flex flex-col items-center justify-center p-3 bg-[var(--surface-muted)]/60 rounded-[var(--radius-md)] border border-[var(--border-subtle)]">
          <ProgressRing value={attempt.percentage || 0} size={90} strokeWidth={8} sublabel="Score" />
          <p className="text-xs text-[var(--text-secondary)] font-medium mt-2 text-center">
            {weakAreas.length > 0 ? `${weakAreas.length} topics need revision` : 'Strong overall performance!'}
          </p>
        </div>

        {/* Weak Topic Breakdown List */}
        <div className="md:col-span-8 space-y-2.5">
          <h4 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Identified Weak Areas</h4>
          {weakAreas.length > 0 ? weakAreas.map((area, index) => (
            <div key={index} className="flex items-center justify-between p-2.5 bg-[var(--background)] rounded-[var(--radius-md)] border border-[var(--border-subtle)]">
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-2 h-2 rounded-full bg-[var(--accent)] shrink-0" />
                <span className="text-xs font-semibold text-[var(--text-primary)] truncate">{area.topic}</span>
              </div>
            </div>
          )) : (
            <div className="p-3 bg-[var(--background)] rounded-xl border border-[var(--border-subtle)]">
              <span className="text-xs font-semibold text-[var(--text-secondary)]">No critical weak areas identified.</span>
            </div>
          )}
        </div>
      </div>

      {/* AI Recommendation Message */}
      <div className="p-3 bg-[var(--primary-light)] rounded-[var(--radius-md)] border border-[var(--primary-border)] flex items-start gap-2.5 my-4">
        <BrainCircuit className="w-4 h-4 text-[var(--primary)] shrink-0 mt-0.5" />
        <p className="text-xs text-[var(--primary)] font-medium leading-relaxed">
          "{recommendation}"
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <Button variant="primary" size="sm" icon={Sparkles} onClick={() => navigate('/student/ai-prep')}>
          AI Preparation
        </Button>
      </div>
    </div>
  );
};
