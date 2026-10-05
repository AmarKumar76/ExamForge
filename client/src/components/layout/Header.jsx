import React from 'react';
import { Bell, Search } from 'lucide-react';
import { ThemeToggle } from '../ui/ThemeToggle';
import { UserProfileMenu } from '../ui/UserProfileMenu';

export const Header = ({ title = 'Dashboard' }) => {
  return (
    <header className="h-16 bg-[var(--surface)] border-b border-[var(--border)] px-4 sm:px-6 flex items-center justify-between sticky top-0 z-20 transition-colors">
      {/* Page Title / Search */}
      <div className="flex items-center gap-6">
        <h2 className="text-base sm:text-lg font-bold text-[var(--text-primary)] tracking-tight truncate max-w-[200px] sm:max-w-none">
          {title}
        </h2>
        
        <div className="relative hidden md:flex items-center">
          <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3" />
          <input
            type="text"
            placeholder="Search courses, exams, questions..."
            className="pl-9 pr-4 py-1.5 text-xs bg-[var(--surface-muted)] border border-[var(--border)] rounded-[var(--radius-md)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] w-64 transition-all"
          />
        </div>
      </div>

      {/* Action Controls, Theme Toggle & User Profile */}
      <div className="flex items-center gap-3">
        {/* Global Theme Toggle Button */}
        <ThemeToggle size="md" />

        {/* Notification Bell */}
        <button className="p-2 rounded-[var(--radius-md)] text-[var(--text-secondary)] hover:bg-[var(--surface-muted)] hover:text-[var(--text-primary)] transition-all relative">
          <Bell className="w-5 h-5" />
          <span className="w-2 h-2 rounded-full bg-[var(--accent)] absolute top-2 right-2 ring-2 ring-[var(--surface)]"></span>
        </button>

        {/* Top Header User Profile Menu */}
        <div className="flex items-center">
          <UserProfileMenu placement="header" compact={true} />
        </div>
      </div>
    </header>
  );
};
