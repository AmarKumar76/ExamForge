import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  Award,
  Sparkles,
  BookOpen,
  Calendar,
  Bell,
  FolderKanban,
  GraduationCap,
  BarChart3,
  Users,
  Settings,
  ShieldCheck,
  Building2,
  FileSpreadsheet,
  Layers,
  ChevronRight
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { studentMockData, instructorMockData, adminMockData } from '../../mockData';

export const Sidebar = () => {
  const location = useLocation();
  const { activeRole } = useTheme();

  const roleNavMap = {
    student: [
      { label: 'Dashboard', icon: LayoutDashboard, path: '/student/dashboard' },
      { label: 'My Exams', icon: FileText, path: '/student/exams' },
      { label: 'Results', icon: Award, path: '/student/results' },
      { label: 'AI Preparation', icon: Sparkles, path: '/student/ai-prep', badge: 'AI' },
      { label: 'Practice', icon: Calendar, path: '/student/practice' },
      { label: 'Study Plan', icon: BookOpen, path: '/student/study-plan' },
      { label: 'Notifications', icon: Bell, path: '/student/notifications' },
    ],
    instructor: [
      { label: 'Dashboard', icon: LayoutDashboard, path: '/instructor/dashboard' },
      { label: 'Courses', icon: BookOpen, path: '/instructor/courses' },
      { label: 'Question Bank', icon: FolderKanban, path: '/instructor/question-bank' },
      { label: 'AI Question Studio', icon: Sparkles, path: '/instructor/ai-studio', badge: 'Studio' },
      { label: 'Exams', icon: FileText, path: '/instructor/exams' },
      { label: 'Results', icon: Award, path: '/instructor/results' },
      { label: 'Analytics', icon: BarChart3, path: '/instructor/analytics' },
      { label: 'Students', icon: Users, path: '/instructor/students' },
      { label: 'Reports', icon: FileSpreadsheet, path: '/instructor/reports' },
      { label: 'Settings', icon: Settings, path: '/instructor/settings' },
    ],
    admin: [
      { label: 'Dashboard', icon: LayoutDashboard, path: '/admin/dashboard' },
      { label: 'User Management', icon: Users, path: '/admin/users' },
      { label: 'Institutions', icon: Building2, path: '/admin/institutions' },
      { label: 'Courses', icon: BookOpen, path: '/admin/courses' },
      { label: 'Analytics', icon: BarChart3, path: '/admin/analytics' },
      { label: 'System Logs', icon: Layers, path: '/admin/logs' },
      { label: 'Settings', icon: Settings, path: '/admin/settings' },
    ],
  };

  const navItems = roleNavMap[activeRole] || roleNavMap.student;

  const currentUserData = {
    student: studentMockData,
    instructor: instructorMockData,
    admin: adminMockData,
  }[activeRole] || studentMockData;

  return (
    <aside className="w-64 bg-[var(--surface)] border-r border-[var(--border)] flex flex-col h-screen sticky top-0 z-30 select-none">
      {/* Brand Logo Header */}
      <div className="p-5 border-b border-[var(--border-subtle)] flex items-center gap-3">
        <div className="w-9 h-9 rounded-[var(--radius-md)] bg-[var(--primary)] text-white flex items-center justify-center font-bold text-lg shadow-sm">
          EF
        </div>
        <div>
          <h1 className="font-bold text-lg text-[var(--text-primary)] leading-none tracking-tight">
            Exam<span className="text-[var(--primary)]">Forge</span>
          </h1>
          <span className="text-[11px] text-[var(--text-secondary)] font-medium capitalize mt-0.5 block">
            {activeRole} Workspace
          </span>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));

          return (
            <Link
              key={item.label}
              to={item.path}
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-[var(--radius-md)] text-sm font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-[var(--primary)] text-[var(--text-on-primary)] shadow-sm'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--surface-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-[var(--text-secondary)]'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    isActive ? 'bg-white/20 text-white' : 'bg-[var(--primary-light)] text-[var(--primary)]'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User Profile Footer */}
      <div className="p-3 border-t border-[var(--border-subtle)] bg-[var(--surface-muted)]/50 m-3 rounded-[var(--radius-md)] flex items-center gap-3">
        <img
          src={currentUserData.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150'}
          alt={currentUserData.name}
          className="w-9 h-9 rounded-full object-cover border border-[var(--border)]"
        />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-[var(--text-primary)] truncate">{currentUserData.name}</p>
          <p className="text-[11px] text-[var(--text-secondary)] capitalize truncate">{activeRole}</p>
        </div>
      </div>
    </aside>
  );
};
