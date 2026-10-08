import React from 'react';
import { CheckCircle2, ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useNavigate, useLocation } from 'react-router-dom';
import { formatExamDateTime } from '../utils/dateUtils';

export const SubmissionConfirmationPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const attempt = location.state?.attempt;
  const exam = location.state?.exam;

  return (
    <div className="min-h-screen bg-[var(--background)] flex items-center justify-center p-4">
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-xl)] p-8 max-w-md w-full text-center space-y-6 shadow-[var(--shadow-lg)]">
        <div className="w-16 h-16 rounded-full bg-[var(--success-light)] text-[var(--success)] flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-10 h-10" />
        </div>

        <div>
          <h2 className="text-2xl font-bold text-[var(--text-primary)]">Exam Submitted Successfully!</h2>
          <p className="text-sm font-semibold text-amber-500 mt-2">Result: Awaiting instructor release</p>
        </div>

        <div className="p-4 bg-[var(--background)] rounded-[var(--radius-md)] border border-[var(--border-subtle)] space-y-2 text-xs text-left">
          <div className="flex justify-between"><span className="text-[var(--text-secondary)]">Exam:</span> <span className="font-bold text-[var(--text-primary)]">{exam?.title || 'Unknown Exam'}</span></div>
          {exam?.courseId && <div className="flex justify-between"><span className="text-[var(--text-secondary)]">Course:</span> <span className="font-bold text-[var(--text-primary)]">{exam?.courseId?.code || exam.courseId}</span></div>}
          <div className="flex justify-between"><span className="text-[var(--text-secondary)]">Submission Time:</span> <span className="font-bold">{formatExamDateTime(attempt?.submittedAt || new Date())}</span></div>
        </div>

        <Button variant="primary" size="md" className="w-full" icon={ArrowLeft} onClick={() => navigate('/student/dashboard')}>
          Back to Dashboard
        </Button>
      </div>
    </div>
  );
};
