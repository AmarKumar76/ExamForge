import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AlertCircle, ArrowLeft, Home, Compass } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { ThemeToggle } from '../components/ui/ThemeToggle';

export const NotFoundPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--text-primary)] flex flex-col justify-between p-6">
      {/* Top Header */}
      <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[var(--primary)] text-white flex items-center justify-center font-bold text-base shadow-sm">
            EF
          </div>
          <span className="font-extrabold text-xl tracking-tight text-[var(--text-primary)]">
            Exam<span className="text-[var(--primary)]">Forge</span>
          </span>
        </Link>
        <ThemeToggle size="md" />
      </div>

      {/* 404 Main Card */}
      <div className="max-w-md w-full mx-auto bg-[var(--surface)] border border-[var(--border)] rounded-3xl p-8 md:p-10 shadow-xl text-center space-y-6 my-auto">
        <div className="w-16 h-16 rounded-2xl bg-[var(--primary-light)] text-[var(--primary)] flex items-center justify-center mx-auto shadow-xs">
          <AlertCircle className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--accent)] bg-[var(--accent-light)] px-3 py-1 rounded-full border border-[var(--accent)]/20">
            Error 404
          </span>
          <h1 className="text-3xl font-extrabold text-[var(--text-primary)] tracking-tight">
            Page Not Found
          </h1>
          <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
            The page you are looking for doesn't exist, was removed, or is temporarily unavailable.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Button variant="primary" size="md" icon={Home} onClick={() => navigate('/student/dashboard')} className="w-full sm:w-auto justify-center">
            Back to Dashboard
          </Button>
          <Button variant="outline" size="md" icon={ArrowLeft} onClick={() => navigate(-1)} className="w-full sm:w-auto justify-center">
            Go Back
          </Button>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-xs text-[var(--text-secondary)] py-4">
        © {new Date().getFullYear()} ExamForge Platform. All rights reserved.
      </div>
    </div>
  );
};
