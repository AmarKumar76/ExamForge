import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { courseService } from '../services/courseService';
import { BookOpen, Users, ArrowRight, FolderKanban, Sparkles, AlertCircle } from 'lucide-react';

export const InstructorCoursesPage = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAssignedCourses = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await courseService.getAll();
      if (res.success && Array.isArray(res.data?.courses)) {
        setCourses(res.data.courses);
      }
    } catch (err) {
      setError(err.message || 'Failed to load assigned courses.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignedCourses();
  }, []);

  return (
    <AppShell title="Course Management">
      <div className="space-y-6 pb-12">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[var(--surface)] p-6 rounded-2xl border border-[var(--border)] shadow-xs">
          <div>
            <h1 className="text-xl font-bold text-[var(--text-primary)]">My Assigned Courses</h1>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              Manage syllabus, question banks, and student rosters for your active academic courses.
            </p>
          </div>
          <Button variant="primary" size="sm" icon={Sparkles} onClick={() => navigate('/instructor/ai-studio')}>
            AI Question Studio
          </Button>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center min-h-[300px] space-y-4 bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-8">
            <div className="w-10 h-10 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs font-semibold text-[var(--text-secondary)]">Fetching your assigned courses...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="p-6 text-center space-y-3 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-600 dark:text-red-400">
            <AlertCircle className="w-6 h-6 mx-auto" />
            <p className="text-xs font-bold">{error}</p>
            <Button variant="secondary" size="sm" onClick={fetchAssignedCourses}>
              Retry Loading
            </Button>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && courses.length === 0 && (
          <div className="p-12 text-center space-y-4 bg-[var(--surface)] rounded-2xl border border-[var(--border)] max-w-lg mx-auto">
            <div className="w-12 h-12 rounded-2xl bg-[var(--surface-muted)] text-[var(--text-muted)] flex items-center justify-center mx-auto">
              <BookOpen className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-[var(--text-primary)]">No Courses Assigned</h3>
            <p className="text-xs text-[var(--text-secondary)]">
              You are not assigned as an instructor to any active courses yet. Contact your Institution Administrator to assign courses to your account.
            </p>
          </div>
        )}

        {/* Course Cards Grid */}
        {!isLoading && !error && courses.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((c) => (
              <div
                key={c.id || c._id}
                className="bg-[var(--surface)] p-5 rounded-2xl border border-[var(--border)] shadow-xs hover:shadow-md hover:border-[var(--primary-border)] transition-all flex flex-col justify-between space-y-4 group"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-[var(--primary)] px-2.5 py-1 rounded-md bg-[var(--primary-light)]">
                      {c.code}
                    </span>
                    <Badge variant={c.status === 'ACTIVE' ? 'success' : 'neutral'}>
                      {c.status}
                    </Badge>
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[var(--text-primary)] group-hover:text-[var(--primary)] transition-colors">
                      {c.name}
                    </h3>
                    <p className="text-xs text-[var(--text-secondary)] mt-1 line-clamp-2">
                      {c.description || 'Core academic course module.'}
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t border-[var(--border-subtle)] flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)] font-medium">
                    <Users className="w-4 h-4 text-[var(--primary)]" />
                    <span>{c.studentIds?.length || 0} Students</span>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    icon={ArrowRight}
                    onClick={() => navigate(`/courses/${c.id || c._id}`)}
                  >
                    Manage Course
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
};
