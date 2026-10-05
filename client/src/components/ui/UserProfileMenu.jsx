import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Settings, LogOut, ChevronUp, ChevronDown, ShieldCheck, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const UserProfileMenu = ({ placement = 'bottom', compact = false }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  // Close menu on click outside and Escape key
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleLogout = () => {
    setIsOpen(false);
    logout();
    navigate('/login');
  };

  // Human-readable role formatter
  const formatRoleLabel = (role) => {
    if (!role) return 'Student';
    const roleMap = {
      STUDENT: 'Student',
      INSTRUCTOR: 'Instructor',
      INSTITUTION_ADMIN: 'Institution Admin',
      SUPER_ADMIN: 'Super Admin',
    };
    return roleMap[role] || role;
  };

  const displayName = user?.name || user?.fullName || 'User';
  const displayEmail = user?.email || 'user@examforge.com';
  const displayRoleLabel = formatRoleLabel(user?.role);
  const avatarUrl = user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=1b4332&color=fff`;

  // Determine settings path based on role
  const settingsPath = {
    INSTRUCTOR: '/instructor/settings',
    SUPER_ADMIN: '/admin/settings',
    INSTITUTION_ADMIN: '/admin/settings',
  }[user?.role] || '/profile';

  return (
    <div className="relative inline-block text-left w-full" ref={menuRef}>
      {/* Clickable Trigger Bar */}
      {compact ? (
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          aria-expanded={isOpen}
          aria-label="User profile menu"
          className="p-1 rounded-full border border-[var(--border)] bg-[var(--surface-muted)]/60 hover:bg-[var(--surface-muted)] hover:border-[var(--primary)] transition-all cursor-pointer flex items-center justify-center group"
        >
          <img
            src={avatarUrl}
            alt={displayName}
            className="w-8 h-8 rounded-full object-cover shrink-0"
          />
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          aria-expanded={isOpen}
          aria-label="User profile menu"
          className="w-full flex items-center justify-between p-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface-muted)]/60 hover:bg-[var(--surface-muted)] transition-all cursor-pointer group text-left"
        >
          <div className="flex items-center gap-3 min-w-0">
            <img
              src={avatarUrl}
              alt={displayName}
              className="w-9 h-9 rounded-full object-cover border border-[var(--border)] shrink-0"
            />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-[var(--text-primary)] truncate group-hover:text-[var(--primary)] transition-colors">
                {displayName}
              </p>
              <p className="text-[11px] text-[var(--text-secondary)] truncate">
                {displayRoleLabel}
              </p>
            </div>
          </div>
          {placement === 'bottom' ? (
            <ChevronUp className="w-4 h-4 text-[var(--text-muted)] group-hover:text-[var(--text-primary)] shrink-0" />
          ) : (
            <ChevronDown className="w-4 h-4 text-[var(--text-muted)] group-hover:text-[var(--text-primary)] shrink-0" />
          )}
        </button>
      )}

      {/* Popover / Dropdown Menu */}
      {isOpen && (
        <div
          className={`absolute z-50 w-64 bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-2xl py-2 space-y-1 backdrop-blur-md animate-fadeIn ${
            placement === 'bottom'
              ? 'bottom-full mb-2 left-0'
              : 'top-full mt-2 right-0'
          }`}
        >
          {/* Menu Header Box */}
          <div className="px-4 py-3 border-b border-[var(--border-subtle)] space-y-1">
            <p className="text-xs font-bold text-[var(--text-primary)] truncate">{displayName}</p>
            <p className="text-[11px] text-[var(--text-secondary)] truncate">{displayEmail}</p>
            <div className="pt-1">
              <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[var(--primary-light)] text-[var(--primary)] border border-[var(--primary-border)]">
                <ShieldCheck className="w-3 h-3" />
                {displayRoleLabel}
              </span>
            </div>
          </div>

          {/* Navigation Options */}
          <div className="py-1">
            <Link
              to="/profile"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--surface-muted)] hover:text-[var(--primary)] transition-colors"
            >
              <User className="w-4 h-4 text-[var(--text-secondary)]" />
              <span>Profile</span>
            </Link>

            <Link
              to={settingsPath}
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--surface-muted)] hover:text-[var(--primary)] transition-colors"
            >
              <Settings className="w-4 h-4 text-[var(--text-secondary)]" />
              <span>Settings</span>
            </Link>
          </div>

          {/* Logout Action */}
          <div className="pt-1 border-t border-[var(--border-subtle)]">
            <button
              type="button"
              onClick={handleLogout}
              className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-500/10 transition-colors text-left cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
