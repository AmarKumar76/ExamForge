import React from 'react';
import { Bell, Search } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { ThemeToggle } from '../ui/ThemeToggle';

export const Header = ({ title = 'Dashboard' }) => {
  const { activeRole, setActiveRole } = useTheme();

  return (
    <header className="h-16 bg-[var(--surface)] border-b border-[var(--border)] px-4 sm:px-6 flex items-center justify-between sticky top-0 z-20 transition-colors">
      {/* Page Title / Search */}
      <div className="flex items-center gap-6">
        <h2 className="text-base sm:text-lg font-bold text-[var(--text-primary)] tracking-tight truncate max-w-[180px] sm:max-w-none">{title}</h2>
        
        <div className="relative hidden md:flex items-center">
          <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3" />
          <input
            type="text"
            placeholder="Search courses, exams, questions..."
            className="pl-9 pr-4 py-1.5 text-xs bg-[var(--surface-muted)] border border-[var(--border)] rounded-[var(--radius-md)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] w-64 transition-all"
          />
        </div>
      </div>

      {/* Action Controls & Role Switcher */}
      <div className="flex items-center gap-3">
        {/* Role Switcher (For Demo Navigation) */}
        <div className="hidden sm:flex items-center bg-[var(--surface-muted)] border border-[var(--border)] rounded-[var(--radius-md)] p-1">
          {['student', 'instructor', 'admin'].map((role) => (
            <button
              key={role}
              onClick={() => setActiveRole(role)}
              className={`px-2.5 py-1 text-xs font-semibold capitalize rounded-[var(--radius-sm)] transition-all ${
                activeRole === role
                  ? 'bg-[var(--primary)] text-white shadow-sm'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              {role}
            </button>
          ))}
        </div>

        {/* Global Theme Toggle Button */}
        <ThemeToggle size="md" />

        {/* Notification Bell */}
        <button className="p-2 rounded-[var(--radius-md)] text-[var(--text-secondary)] hover:bg-[var(--surface-muted)] hover:text-[var(--text-primary)] transition-all relative">
          <Bell className="w-5 h-5" />
          <span className="w-2 h-2 rounded-full bg-[var(--accent)] absolute top-2 right-2 ring-2 ring-[var(--surface)]"></span>
        </button>
      </div>
    </header>
  );
};
