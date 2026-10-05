import React from 'react';
import { CheckCircle2, ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useNavigate } from 'react-router-dom';

export const SubmissionConfirmationPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[var(--background)] flex items-center justify-center p-4">
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-xl)] p-8 max-w-md w-full text-center space-y-6 shadow-[var(--shadow-lg)]">
        <div className="w-16 h-16 rounded-full bg-[var(--success-light)] text-[var(--success)] flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-10 h-10" />
        </div>

        <div>
          <h2 className="text-2xl font-bold text-[var(--text-primary)]">Exam Submitted Successfully!</h2>
          <p className="text-xs text-[var(--text-secondary)] mt-1">Your answers have been saved and submitted.</p>
        </div>

        <div className="p-4 bg-[var(--background)] rounded-[var(--radius-md)] border border-[var(--border-subtle)] space-y-2 text-xs text-left">
          <div className="flex justify-between"><span className="text-[var(--text-secondary)]">Exam:</span> <span className="font-bold text-[var(--text-primary)]">Operating Systems Midterm</span></div>
          <div className="flex justify-between"><span className="text-[var(--text-secondary)]">Total Questions:</span> <span className="font-bold">20</span></div>
          <div className="flex justify-between"><span className="text-[var(--text-secondary)]">Time Taken:</span> <span className="font-bold">47m 23s</span></div>
          <div className="flex justify-between"><span className="text-[var(--text-secondary)]">Submission Time:</span> <span className="font-bold">Oct 10, 2026, 10:47 AM</span></div>
        </div>

        <Button variant="primary" size="md" className="w-full" icon={ArrowLeft} onClick={() => navigate('/student/dashboard')}>
          Back to Dashboard
        </Button>
      </div>
    </div>
  );
};
