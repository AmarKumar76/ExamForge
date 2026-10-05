import React, { useState, useEffect } from 'react';
import { AppShell } from '../components/layout/AppShell';
import { StatCard } from '../components/ui/StatCard';
import { Badge } from '../components/ui/Badge';
import { adminService } from '../services/adminService';
import {
  BarChart3,
  Users,
  Building2,
  BookOpen,
  GraduationCap,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';

export const AdminAnalyticsPage = () => {
  const [analytics, setAnalytics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAnalytics = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await adminService.getAnalytics();
      if (res.success) {
        setAnalytics(res.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to compute real database analytics.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const stats = analytics?.stats || {};
  const courseBreakdown = analytics?.courseBreakdown || [];

  return (
    <AppShell title="System Analytics">
      <div className="space-y-6 pb-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[var(--surface)] p-6 rounded-2xl border border-[var(--border)] shadow-xs">
          <div>
            <h1 className="text-xl font-bold text-[var(--text-primary)]">System Analytics & Enrollment Metrics</h1>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              Live database analytics on institutional capacity, faculty distribution, and student course enrollments.
            </p>
          </div>
          <button
            onClick={fetchAnalytics}
            className="px-3.5 py-1.5 bg-[var(--surface-muted)] hover:bg-[var(--border-subtle)] text-[var(--text-primary)] rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 self-start md:self-auto"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh Metrics
          </button>
        </div>

        {error && (
          <div className="p-3.5 bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 rounded-xl text-xs font-semibold flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Real Stat Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <StatCard title="Institutions" value={isLoading ? '...' : stats.totalInstitutions || 0} icon={Building2} />
          <StatCard title="Total Courses" value={isLoading ? '...' : stats.totalCourses || 0} icon={BookOpen} />
          <StatCard title="Active Courses" value={isLoading ? '...' : stats.activeCourses || 0} icon={CheckCircle2} />
          <StatCard title="Total Users" value={isLoading ? '...' : stats.totalUsers || 0} icon={Users} />
          <StatCard title="Instructors" value={isLoading ? '...' : stats.totalInstructors || 0} icon={BarChart3} />
          <StatCard title="Students" value={isLoading ? '...' : stats.totalStudents || 0} icon={GraduationCap} />
        </div>

        {/* Course Enrollment Breakdown Table */}
        <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] overflow-hidden shadow-xs space-y-4 p-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-[var(--text-primary)]">Course Enrollment Overview</h2>
              <span className="text-xs text-[var(--text-secondary)]">Database-driven student counts per academic subject</span>
            </div>
          </div>

          {isLoading ? (
            <div className="p-8 text-center text-xs text-[var(--text-secondary)]">Computing enrollment breakdown...</div>
          ) : courseBreakdown.length === 0 ? (
            <div className="p-8 text-center text-xs text-[var(--text-secondary)]">No courses registered in system.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[var(--surface-muted)] text-[var(--text-secondary)] font-semibold border-b border-[var(--border-subtle)] uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Course Code</th>
                    <th className="py-3 px-4">Course Name</th>
                    <th className="py-3 px-4">Department</th>
                    <th className="py-3 px-4">Enrolled Students</th>
                    <th className="py-3 px-4">Assigned Faculty</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-subtle)] text-[var(--text-primary)]">
                  {courseBreakdown.map((item) => (
                    <tr key={item.id} className="hover:bg-[var(--surface-muted)]/50 transition-colors">
                      <td className="py-3 px-4 font-bold text-[var(--primary)]">{item.code}</td>
                      <td className="py-3 px-4 font-bold">{item.name}</td>
                      <td className="py-3 px-4 text-[var(--text-secondary)]">{item.department}</td>
                      <td className="py-3 px-4">
                        <span className="font-bold text-xs">{item.studentCount} Students</span>
                      </td>
                      <td className="py-3 px-4 text-[var(--text-secondary)]">{item.instructors}</td>
                      <td className="py-3 px-4">
                        <Badge variant={item.status === 'ACTIVE' ? 'success' : 'neutral'}>{item.status}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
};
