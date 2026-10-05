import React from 'react';

export const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  icon: Icon,
  className = '',
  disabled = false,
  onClick,
  type = 'button',
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

  const variants = {
    primary: 'bg-[var(--primary)] text-[var(--text-on-primary)] hover:bg-[var(--primary-hover)] focus:ring-[var(--primary)] shadow-sm',
    secondary: 'bg-[var(--surface-muted)] text-[var(--text-primary)] hover:bg-[var(--surface-hover)] border border-[var(--border)] focus:ring-[var(--primary)]',
    outline: 'border border-[var(--primary)] text-[var(--primary)] hover:bg-[var(--primary-light)] focus:ring-[var(--primary)]',
    ghost: 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-muted)]',
    danger: 'bg-[var(--error)] text-white hover:opacity-90 focus:ring-[var(--error)]',
    ai: 'bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-white hover:opacity-95 shadow-md border border-[var(--primary-border)]',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs rounded-[var(--radius-sm)] gap-1.5',
    md: 'px-4 py-2 text-sm rounded-[var(--radius-md)] gap-2',
    lg: 'px-5 py-2.5 text-base rounded-[var(--radius-lg)] gap-2.5',
  };

  return (
    <button
      type={type}
      className={`${baseStyles} ${variants[variant] || variants.primary} ${sizes[size] || sizes.md} ${className}`}
      disabled={disabled}
      onClick={onClick}
      {...props}
    >
      {Icon && <Icon className="w-4 h-4 shrink-0" />}
      <span>{children}</span>
    </button>
  );
};
