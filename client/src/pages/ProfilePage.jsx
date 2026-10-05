import React from 'react';
import { AppShell } from '../components/layout/AppShell';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { ThemeToggle } from '../components/ui/ThemeToggle';
import { useAuth } from '../context/AuthContext';
import { User, Mail, ShieldCheck, School, Calendar, CheckCircle2 } from 'lucide-react';

export const ProfilePage = () => {
  const { user } = useAuth();

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

  const displayName = user?.name || 'Amar Kumar';
  const displayEmail = user?.email || 'amar@example.com';
  const displayRoleLabel = formatRoleLabel(user?.role);
  const avatarUrl = user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=1b4332&color=fff`;

  return (
    <AppShell title="User Profile">
      <div className="max-w-4xl mx-auto space-y-6 pb-12">
        {/* Profile Header Banner */}
        <div className="bg-[var(--surface)] p-6 md:p-8 rounded-2xl border border-[var(--border)] shadow-xs flex flex-col md:flex-row items-center gap-6">
          <img
            src={avatarUrl}
            alt={displayName}
            className="w-24 h-24 rounded-full object-cover border-4 border-[var(--primary-light)] shadow-md"
          />
          <div className="text-center md:text-left space-y-2 flex-1">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
              <h1 className="text-2xl font-extrabold text-[var(--text-primary)]">{displayName}</h1>
              <Badge variant="success">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Active Account
              </Badge>
            </div>
            <p className="text-xs text-[var(--text-secondary)]">{displayEmail}</p>
            <div className="pt-1">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-[var(--primary-light)] text-[var(--primary)] border border-[var(--primary-border)]">
                <ShieldCheck className="w-4 h-4" />
                {displayRoleLabel} Workspace
              </span>
            </div>
          </div>
        </div>

        {/* Profile Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card title="Account Information">
            <div className="space-y-4 text-xs">
              <div className="flex items-center gap-3 p-3 bg-[var(--background)] rounded-xl border border-[var(--border-subtle)]">
                <User className="w-4 h-4 text-[var(--primary)] shrink-0" />
                <div>
                  <span className="text-[11px] text-[var(--text-secondary)] block">Full Name</span>
                  <span className="font-bold text-[var(--text-primary)]">{displayName}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-[var(--background)] rounded-xl border border-[var(--border-subtle)]">
                <Mail className="w-4 h-4 text-[var(--primary)] shrink-0" />
                <div>
                  <span className="text-[11px] text-[var(--text-secondary)] block">Email Address</span>
                  <span className="font-bold text-[var(--text-primary)]">{displayEmail}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-[var(--background)] rounded-xl border border-[var(--border-subtle)]">
                <ShieldCheck className="w-4 h-4 text-[var(--primary)] shrink-0" />
                <div>
                  <span className="text-[11px] text-[var(--text-secondary)] block">System Role</span>
                  <span className="font-bold text-[var(--text-primary)]">{displayRoleLabel}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-[var(--background)] rounded-xl border border-[var(--border-subtle)]">
                <School className="w-4 h-4 text-[var(--primary)] shrink-0" />
                <div>
                  <span className="text-[11px] text-[var(--text-secondary)] block">Institution / Organization</span>
                  <span className="font-bold text-[var(--text-primary)]">
                    {user?.institutionId ? 'Assigned University' : 'ExamForge Platform'}
                  </span>
                </div>
              </div>
            </div>
          </Card>

          <Card title="Preferences & Appearance">
            <div className="space-y-4 text-xs">
              <div className="flex items-center justify-between p-3.5 bg-[var(--background)] rounded-xl border border-[var(--border-subtle)]">
                <div>
                  <h4 className="font-bold text-[var(--text-primary)]">Global Visual Theme</h4>
                  <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">Toggle Light or Dark display mode</p>
                </div>
                <ThemeToggle size="md" />
              </div>

              <div className="flex items-center justify-between p-3.5 bg-[var(--background)] rounded-xl border border-[var(--border-subtle)]">
                <div>
                  <h4 className="font-bold text-[var(--text-primary)]">Member Since</h4>
                  <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                    {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'October 2026'}
                  </p>
                </div>
                <Calendar className="w-4 h-4 text-[var(--text-muted)]" />
              </div>
            </div>
          </Card>
        </div>
      </div>
    </AppShell>
  );
};
