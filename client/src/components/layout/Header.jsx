import React, { useState, useEffect } from 'react';
import { Bell, Search } from 'lucide-react';
import { ThemeToggle } from '../ui/ThemeToggle';
import { UserProfileMenu } from '../ui/UserProfileMenu';
import { useNavigate } from 'react-router-dom';
import { examService } from '../../services/examService';
import { useAuth } from '../../context/AuthContext';

export const Header = ({ title = 'Dashboard' }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (user?.role === 'STUDENT') {
       examService.getNotifications().then(res => {
         if (res.success && res.data) {
           setUnreadCount(res.data.filter(n => !n.read).length);
         }
       }).catch(e => console.error(e));
    }
  }, [user]);
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
        <button 
          onClick={() => user?.role === 'STUDENT' ? navigate('/student/notifications') : null}
          className="p-2 rounded-[var(--radius-md)] text-[var(--text-secondary)] hover:bg-[var(--surface-muted)] hover:text-[var(--text-primary)] transition-all relative"
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[var(--accent)] text-[8px] font-bold text-white ring-2 ring-[var(--surface)]">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {/* Top Header User Profile Menu */}
        <div className="flex items-center">
          <UserProfileMenu placement="header" compact={true} />
        </div>
      </div>
    </header>
  );
};
