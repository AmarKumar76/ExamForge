import React from 'react';

export const Badge = ({ children, variant = 'neutral', size = 'sm', className = '' }) => {
  const variants = {
    neutral: 'bg-[var(--surface-muted)] text-[var(--text-secondary)] border-[var(--border)]',
    primary: 'bg-[var(--primary-light)] text-[var(--primary)] border-[var(--primary-border)]',
    success: 'bg-[var(--success-light)] text-[var(--success)] border-[var(--success)]/20',
    warning: 'bg-[var(--warning-light)] text-[var(--warning)] border-[var(--warning)]/20',
    error: 'bg-[var(--error-light)] text-[var(--error)] border-[var(--error)]/20',
    accent: 'bg-[var(--accent-light)] text-[var(--accent)] border-[var(--accent)]/30',
    ai: 'bg-gradient-to-r from-[var(--primary-light)] to-[var(--surface-muted)] text-[var(--primary)] border-[var(--primary-border)] font-semibold',
  };

  const sizes = {
    sm: 'px-2.5 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
  };

  return (
    <span
      className={`inline-flex items-center gap-1 font-medium border rounded-[var(--radius-full)] ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {children}
    </span>
  );
};
