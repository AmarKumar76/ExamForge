import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export const ThemeToggle = ({ className = '', size = 'md' }) => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  const buttonSizes = {
    sm: 'p-1.5 text-xs',
    md: 'p-2 text-xs',
    lg: 'p-2.5 text-sm',
  };

  return (
    <button
      type="button"
      onClick={toggleTheme}
      title={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
      aria-label={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
      className={`inline-flex items-center justify-center rounded-xl transition-all duration-200 border border-[var(--border)] bg-[var(--surface-muted)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30 ${buttonSizes[size] || buttonSizes.md} ${className}`}
    >
      {isDark ? (
        <Sun className={`${iconSizes[size] || iconSizes.md} text-amber-400 animate-spin-once`} />
      ) : (
        <Moon className={`${iconSizes[size] || iconSizes.md} text-[var(--primary)]`} />
      )}
    </button>
  );
};
