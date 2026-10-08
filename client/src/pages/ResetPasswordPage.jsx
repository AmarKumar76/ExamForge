import React, { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Lock, Eye, EyeOff, AlertCircle, CheckCircle2, ShieldCheck, RefreshCw } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { ThemeToggle } from '../components/ui/ThemeToggle';
import { authService } from '../services/authService';

export const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // If token is missing right from entry
  const isTokenMissing = !token || token.trim().length === 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (isTokenMissing) {
      setError('Password reset link is invalid or has expired.');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Confirm password does not match.');
      return;
    }

    setIsSubmitting(true);

    try {
      await authService.resetPassword({
        token: token.trim(),
        password: newPassword,
      });
      setIsSuccess(true);
    } catch (err) {
      setError(err.message || 'Password reset link is invalid or has expired.');
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
        <ThemeToggle size="sm" />
      </div>

      {/* Main Card */}
      <div className="max-w-md w-full mx-auto bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-8 shadow-xl space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-[var(--primary-light)] text-[var(--primary)] mx-auto flex items-center justify-center mb-3">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
            Reset Password
          </h1>
          <p className="text-xs text-[var(--text-secondary)]">
            Create a new secure password for your ExamForge account.
          </p>
        </div>

        {/* Missing Token Alert */}
        {isTokenMissing && !isSuccess && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs font-semibold flex items-start gap-2.5 animate-fadeIn">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>Password reset link is invalid or has expired.</span>
            </div>
            <Link to="/forgot-password" className="block">
              <Button variant="primary" size="lg" className="w-full justify-center">
                Request New Reset Link
              </Button>
            </Link>
          </div>
        )}

        {/* Error Alert Box (when valid token form fails submission) */}
        {error && !isTokenMissing && !isSuccess && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs font-semibold flex items-start gap-2.5 animate-fadeIn">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Success State */}
        {isSuccess ? (
          <div className="space-y-4 text-center">
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center justify-center gap-2.5 animate-fadeIn">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <span>Password reset successfully.</span>
            </div>
            <Button
              variant="primary"
              size="lg"
              className="w-full justify-center"
              onClick={() => navigate('/login', { state: { successMessage: 'Password reset successfully. Please sign in.' } })}
            >
              Go to Login
            </Button>
          </div>
        ) : (
          !isTokenMissing && (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* New Password Field */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[var(--text-secondary)] flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5" /> New Password
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    disabled={isSubmitting}
                    placeholder="••••••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full pl-3.5 pr-10 py-2.5 text-sm rounded-xl border border-[var(--border)] bg-[var(--background)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] disabled:opacity-50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-3 top-3 text-[var(--text-muted)] hover:text-[var(--text-primary)] focus:outline-none focus:text-[var(--primary)]"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password Field */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[var(--text-secondary)] flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5" /> Confirm Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    disabled={isSubmitting}
                    placeholder="••••••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-3.5 pr-10 py-2.5 text-sm rounded-xl border border-[var(--border)] bg-[var(--background)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] disabled:opacity-50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-3 top-3 text-[var(--text-muted)] hover:text-[var(--text-primary)] focus:outline-none focus:text-[var(--primary)]"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                variant="primary"
                size="lg"
                disabled={isSubmitting}
                className="w-full justify-center mt-2"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin" /> Resetting...
                  </span>
                ) : (
                  'Reset Password'
                )}
              </Button>
            </form>
          )
        )}

        <div className="pt-4 border-t border-[var(--border-subtle)] text-center text-xs text-[var(--text-secondary)]">
          Back to{' '}
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
