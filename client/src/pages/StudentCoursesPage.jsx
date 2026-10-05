import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { courseService } from '../services/courseService';
import { BookOpen, Users, ArrowRight, CheckCircle2, Sparkles, AlertCircle, PlusCircle } from 'lucide-react';

export const StudentCoursesPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('enrolled'); // 'enrolled' | 'explore'
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [availableCourses, setAvailableCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [enrollingId, setEnrollingId] = useState(null);
  const [actionMessage, setActionMessage] = useState(null);

  const fetchCourses = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const enrolledRes = await courseService.getAll();
      if (enrolledRes.success && Array.isArray(enrolledRes.data?.courses)) {
        setEnrolledCourses(enrolledRes.data.courses);
      }

      const availableRes = await courseService.getAll({ available: 'true' });
      if (availableRes.success && Array.isArray(availableRes.data?.courses)) {
        setAvailableCourses(availableRes.data.courses);
      }
    } catch (err) {
      setError(err.message || 'Failed to load courses.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const handleEnroll = async (courseId) => {
    try {
      setEnrollingId(courseId);
      setActionMessage(null);
      const res = await courseService.selfEnroll(courseId);
      if (res.success) {
        setActionMessage({ type: 'success', text: 'Successfully enrolled in course!' });
        await fetchCourses();
      }
    } catch (err) {
      setActionMessage({ type: 'error', text: err.message || 'Failed to enroll in course.' });
    } finally {
      setEnrollingId(null);
    }
  };

  const displayedCourses = activeTab === 'enrolled' ? enrolledCourses : availableCourses;

  return (
    <AppShell title="Student Courses">
      <div className="space-y-6 pb-12">
        {/* Banner Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[var(--surface)] p-6 rounded-2xl border border-[var(--border)] shadow-xs">
          <div>
            <h1 className="text-xl font-bold text-[var(--text-primary)]">My Courses & Academic Catalog</h1>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              Access your enrolled subject modules or join new courses offered by your institution.
            </p>
          </div>

          {/* Tab Switcher */}
          <div className="flex p-1 bg-[var(--surface-muted)] rounded-xl border border-[var(--border-subtle)] self-start sm:self-auto">
            <button
              onClick={() => setActiveTab('enrolled')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'enrolled'
                  ? 'bg-[var(--surface)] text-[var(--primary)] shadow-xs'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              Enrolled ({enrolledCourses.length})
            </button>
            <button
              onClick={() => setActiveTab('explore')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'explore'
                  ? 'bg-[var(--surface)] text-[var(--primary)] shadow-xs'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              Explore Catalog ({availableCourses.length})
            </button>
          </div>
        </div>

        {actionMessage && (
          <div
            className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
              actionMessage.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-400'
                : 'bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400'
            }`}
          >
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{actionMessage.text}</span>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center min-h-[300px] space-y-4 bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-8">
            <div className="w-10 h-10 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs font-semibold text-[var(--text-secondary)]">Fetching your courses...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="p-6 text-center space-y-3 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-600 dark:text-red-400">
            <AlertCircle className="w-6 h-6 mx-auto" />
            <p className="text-xs font-bold">{error}</p>
            <Button variant="secondary" size="sm" onClick={fetchCourses}>
              Retry Loading
            </Button>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && displayedCourses.length === 0 && (
          <div className="p-12 text-center space-y-4 bg-[var(--surface)] rounded-2xl border border-[var(--border)] max-w-lg mx-auto">
            <div className="w-12 h-12 rounded-2xl bg-[var(--surface-muted)] text-[var(--text-muted)] flex items-center justify-center mx-auto">
              <BookOpen className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-[var(--text-primary)]">
              {activeTab === 'enrolled' ? 'No Enrolled Courses' : 'No Available Catalog Courses'}
            </h3>
            <p className="text-xs text-[var(--text-secondary)]">
              {activeTab === 'enrolled'
                ? 'You are not enrolled in any courses yet. Switch to the Explore Catalog tab to enroll.'
                : 'No additional courses available for self-enrollment in your institution.'}
            </p>
          </div>
        )}

        {/* Course Cards Grid */}
        {!isLoading && !error && displayedCourses.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayedCourses.map((c) => {
              const isEnrolled = enrolledCourses.some((e) => e.id === c.id || e._id === c._id);

              return (
                <div
                  key={c.id || c._id}
                  className="bg-[var(--surface)] p-5 rounded-2xl border border-[var(--border)] shadow-xs hover:shadow-md hover:border-[var(--primary-border)] transition-all flex flex-col justify-between space-y-4 group"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold uppercase tracking-wider text-[var(--primary)] px-2.5 py-1 rounded-md bg-[var(--primary-light)]">
                        {c.code}
                      </span>
                      {isEnrolled ? (
                        <Badge variant="success">Enrolled</Badge>
                      ) : (
                        <Badge variant="neutral">Available</Badge>
                      )}
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-[var(--text-primary)] group-hover:text-[var(--primary)] transition-colors">
                        {c.name}
                      </h3>
                      <p className="text-xs text-[var(--text-secondary)] mt-1 line-clamp-2">
                        {c.description || 'Academic course module.'}
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-[var(--border-subtle)] flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)] font-medium">
                      <Users className="w-4 h-4 text-[var(--primary)]" />
                      <span>{c.studentIds?.length || 0} Students</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {!isEnrolled ? (
                        <Button
                          variant="primary"
                          size="sm"
                          icon={PlusCircle}
                          onClick={() => handleEnroll(c.id || c._id)}
                          loading={enrollingId === (c.id || c._id)}
                        >
                          Enroll
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={ArrowRight}
                          onClick={() => navigate(`/courses/${c.id || c._id}`)}
                        >
                          View Details
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
};
