import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowRight, AlertCircle, CheckCircle2, KeyRound } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { ThemeToggle } from '../components/ui/ThemeToggle';
import { authService } from '../services/authService';

export const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setIsSubmitting(true);

    try {
      const res = await authService.forgotPassword(email.trim());
      setSuccessMessage(
        res?.message || 'If an account exists with this email, password reset instructions have been sent.'
      );
    } catch (err) {
      // Security rule: Always display generic message regardless of error details
      setSuccessMessage('If an account exists with this email, password reset instructions have been sent.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--text-primary)] flex flex-col justify-between py-8 px-4 sm:px-6">
      {/* Brand Header */}
      <div className="max-w-md w-full mx-auto flex items-center justify-between mb-6">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[var(--primary)] text-white flex items-center justify-center font-bold text-base shadow-sm">
            EF
          </div>
          <span className="font-extrabold text-xl tracking-tight text-[var(--text-primary)]">
            Exam<span className="text-[var(--primary)]">Forge</span>
          </span>
        </Link>
        <div className="flex items-center gap-3">
          <ThemeToggle size="sm" />
          <Link to="/" className="text-xs font-semibold text-[var(--primary)] hover:underline cursor-pointer">
            Back to Home
          </Link>
        </div>
      </div>

      {/* Main Card */}
      <div className="max-w-md w-full mx-auto bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-8 shadow-xl space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-[var(--primary-light)] text-[var(--primary)] mx-auto flex items-center justify-center mb-3">
            <KeyRound className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
            Forgot Password
          </h1>
          <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
            Enter your registered email address and we will send instructions to reset your password.
          </p>
        </div>

        {/* Success Alert Box */}
        {successMessage && (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-start gap-2.5 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Error Alert Box */}
        {error && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs font-medium flex items-start gap-2.5 animate-fadeIn">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {!successMessage ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[var(--text-secondary)] flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5" /> Email Address
              </label>
              <input
                type="email"
                required
                disabled={isSubmitting}
                placeholder="name@university.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[var(--border)] bg-[var(--background)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] disabled:opacity-50"
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              disabled={isSubmitting}
              className="w-full justify-center mt-2"
              icon={ArrowRight}
            >
              {isSubmitting ? 'Sending Request...' : 'Send Reset Link'}
            </Button>
          </form>
        ) : (
          <div className="pt-2 text-center">
            <Link to="/login">
              <Button variant="outline" size="md" className="w-full justify-center">
                Return to Sign In
              </Button>
            </Link>
          </div>
        )}

        <div className="pt-4 border-t border-[var(--border-subtle)] text-center text-xs text-[var(--text-secondary)]">
          Remember your password?{' '}
          <Link to="/login" className="font-extrabold text-[var(--primary)] hover:underline">
            Sign In
          </Link>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-xs text-[var(--text-secondary)] mt-6">
        © {new Date().getFullYear()} ExamForge. All rights reserved.
      </div>
    </div>
  );
};
