import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { Card } from '../components/ui/Card';
import { StatCard } from '../components/ui/StatCard';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { adminMockData } from '../mockData';
import { institutionService } from '../services/institutionService';
import { courseService } from '../services/courseService';
import { useAuth } from '../context/AuthContext';
import {
  Users,
  Building2,
  FileText,
  AlertCircle,
  CheckCircle2,
  PlusCircle,
  BookOpen,
  FolderKanban,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  X,
} from 'lucide-react';

export const AdminPanelPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'institutions' | 'courses'

  // Real Data States
  const [institutions, setInstitutions] = useState([]);
  const [courses, setCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);

  // Modal States
  const [showInstModal, setShowInstModal] = useState(false);
  const [instForm, setInstForm] = useState({ name: '', code: '', departments: 'Computer Science, Electrical Engineering' });

  const [showCourseModal, setShowCourseModal] = useState(false);
  const [courseForm, setCourseForm] = useState({
    institutionId: user?.institutionId || '',
    department: 'Computer Science',
    name: '',
    code: '',
    description: '',
  });

  const [showDeptModal, setShowDeptModal] = useState(false);
  const [targetInstId, setTargetInstId] = useState(null);
  const [deptInput, setDeptInput] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadAdminData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [instRes, courseRes] = await Promise.all([
        institutionService.getAll().catch(() => ({ success: false, data: { institutions: [] } })),
        courseService.getAll().catch(() => ({ success: false, data: { courses: [] } })),
      ]);

      if (instRes.success && Array.isArray(instRes.data?.institutions)) {
        setInstitutions(instRes.data.institutions);
        if (!courseForm.institutionId && instRes.data.institutions.length > 0) {
          setCourseForm((prev) => ({ ...prev, institutionId: instRes.data.institutions[0].id || instRes.data.institutions[0]._id }));
        }
      }

      if (courseRes.success && Array.isArray(courseRes.data?.courses)) {
        setCourses(courseRes.data.courses);
      }
    } catch (err) {
      setError(err.message || 'Failed to load administration data.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  // Handle Create Institution
  const handleCreateInstitution = async (e) => {
    e.preventDefault();
    if (!instForm.name || !instForm.code) return;

    try {
      setIsSubmitting(true);
      setError(null);
      const depts = instForm.departments.split(',').map((d) => d.trim()).filter(Boolean);
      const res = await institutionService.create({ name: instForm.name, code: instForm.code, departments: depts });

      if (res.success) {
        setActionSuccess('Institution created successfully!');
        setShowInstModal(false);
        setInstForm({ name: '', code: '', departments: 'Computer Science, Electrical Engineering' });
        await loadAdminData();
      }
    } catch (err) {
      setError(err.message || 'Failed to create institution.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Create Course
  const handleCreateCourse = async (e) => {
    e.preventDefault();
    if (!courseForm.name || !courseForm.code) return;

    try {
      setIsSubmitting(true);
      setError(null);
      const res = await courseService.create(courseForm);

      if (res.success) {
        setActionSuccess('Course created successfully!');
        setShowCourseModal(false);
        setCourseForm({
          institutionId: user?.institutionId || (institutions[0]?.id || ''),
          department: 'Computer Science',
          name: '',
          code: '',
          description: '',
        });
        await loadAdminData();
      }
    } catch (err) {
      setError(err.message || 'Failed to create course.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Add Department
  const handleAddDepartment = async (e) => {
    e.preventDefault();
    if (!targetInstId || !deptInput.trim()) return;

    try {
      setIsSubmitting(true);
      setError(null);
      const res = await institutionService.addDepartment(targetInstId, deptInput);
      if (res.success) {
        setActionSuccess('Department added successfully!');
        setShowDeptModal(false);
        setDeptInput('');
        await loadAdminData();
      }
    } catch (err) {
      setError(err.message || 'Failed to add department.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const data = adminMockData;

  return (
    <AppShell title="Admin Management Panel">
      <div className="space-y-6 pb-12">
        {/* Header & Tab Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[var(--surface)] p-6 rounded-2xl border border-[var(--border)] shadow-xs">
          <div>
            <h1 className="text-xl font-bold text-[var(--text-primary)]">Admin Management Panel</h1>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              Manage enterprise institutions, department frameworks, global course directory, and user rosters.
            </p>
          </div>

          <div className="flex p-1 bg-[var(--surface-muted)] rounded-xl border border-[var(--border-subtle)] self-start md:self-auto">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'overview'
                  ? 'bg-[var(--surface)] text-[var(--primary)] shadow-xs'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('institutions')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'institutions'
                  ? 'bg-[var(--surface)] text-[var(--primary)] shadow-xs'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              Institutions ({institutions.length})
            </button>
            <button
              onClick={() => setActiveTab('courses')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'courses'
                  ? 'bg-[var(--surface)] text-[var(--primary)] shadow-xs'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              Courses ({courses.length})
            </button>
          </div>
        </div>

        {actionSuccess && (
          <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 rounded-xl text-xs font-semibold flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>{actionSuccess}</span>
            </div>
            <button onClick={() => setActionSuccess(null)} className="cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {error && (
          <div className="p-3.5 bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 rounded-xl text-xs font-semibold flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              <span>{error}</span>
            </div>
            <button onClick={() => setError(null)} className="cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard title="Total Users" value={data.stats.totalUsers} icon={Users} />
              <StatCard title="Institutions" value={institutions.length || data.stats.institutionsCount} icon={Building2} />
              <StatCard title="Active Courses" value={courses.length || 12} icon={BookOpen} />
              <StatCard title="System Alerts" value={data.stats.systemAlertsCount} icon={AlertCircle} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
              <div className="md:col-span-7">
                <Card title="Recent Users">
                  <div className="space-y-3">
                    {data.recentUsers.map((u, i) => (
                      <div key={i} className="p-3 bg-[var(--background)] rounded-[var(--radius-md)] border border-[var(--border-subtle)] flex items-center justify-between">
                        <div>
                          <h4 className="text-xs font-bold text-[var(--text-primary)]">{u.name}</h4>
                          <p className="text-[11px] text-[var(--text-secondary)]">{u.email} • {u.joined}</p>
                        </div>
                        <span className="text-xs font-bold text-[var(--primary)]">{u.role}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>

              <div className="md:col-span-5">
                <Card title="System Health">
                  <div className="space-y-3 text-xs">
                    {Object.entries(data.systemHealth).map(([key, val]) => (
                      <div key={key} className="flex justify-between items-center p-2.5 bg-[var(--background)] rounded-[var(--radius-md)] border border-[var(--border-subtle)]">
                        <span className="font-semibold capitalize text-[var(--text-primary)]">{key}</span>
                        <span className={`font-bold flex items-center gap-1 ${val.includes('Warning') ? 'text-[var(--warning)]' : 'text-[var(--success)]'}`}>
                          <CheckCircle2 className="w-3.5 h-3.5" /> {val}
                        </span>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            </div>
          </div>
        )}

        {/* INSTITUTIONS TAB */}
        {activeTab === 'institutions' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-base font-bold text-[var(--text-primary)]">Registered Institutions</h2>
              {user?.role === 'SUPER_ADMIN' && (
                <Button variant="primary" size="sm" icon={PlusCircle} onClick={() => setShowInstModal(true)}>
                  New Institution
                </Button>
              )}
            </div>

            {institutions.length === 0 ? (
              <div className="p-12 text-center space-y-4 bg-[var(--surface)] rounded-2xl border border-[var(--border)] max-w-lg mx-auto">
                <Building2 className="w-8 h-8 text-[var(--text-muted)] mx-auto" />
                <h3 className="text-base font-bold text-[var(--text-primary)]">No Institutions Found</h3>
                <p className="text-xs text-[var(--text-secondary)]">Create an institution to begin managing departments and courses.</p>
                {user?.role === 'SUPER_ADMIN' && (
                  <Button variant="primary" size="sm" icon={PlusCircle} onClick={() => setShowInstModal(true)}>
                    Create Institution
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {institutions.map((inst) => (
                  <div
                    key={inst.id || inst._id}
                    className="bg-[var(--surface)] p-5 rounded-2xl border border-[var(--border)] shadow-xs space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[var(--primary-light)] text-[var(--primary)] flex items-center justify-center font-bold text-sm">
                          {inst.code}
                        </div>
                        <div>
                          <h3 className="text-base font-bold text-[var(--text-primary)]">{inst.name}</h3>
                          <span className="text-[11px] text-[var(--text-secondary)]">Code: {inst.code}</span>
                        </div>
                      </div>
                      <Badge variant={inst.status === 'ACTIVE' ? 'success' : 'neutral'}>
                        {inst.status}
                      </Badge>
                    </div>

                    <div className="space-y-2">
                      <span className="text-xs font-bold text-[var(--text-primary)] block">Academic Departments:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {inst.departments?.map((dept, i) => (
                          <span key={i} className="text-[11px] px-2.5 py-1 rounded-md bg-[var(--surface-muted)] text-[var(--text-secondary)] border border-[var(--border-subtle)] font-medium">
                            {dept}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-[var(--border-subtle)] flex items-center justify-between text-xs">
                      <span className="text-[var(--text-secondary)]">Max Capacity: {inst.settings?.maxStudents || 5000}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={PlusCircle}
                        onClick={() => {
                          setTargetInstId(inst.id || inst._id);
                          setShowDeptModal(true);
                        }}
                      >
                        Add Dept
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* COURSES TAB */}
        {activeTab === 'courses' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-base font-bold text-[var(--text-primary)]">Global Course Directory</h2>
              <Button variant="primary" size="sm" icon={PlusCircle} onClick={() => setShowCourseModal(true)}>
                Create New Course
              </Button>
            </div>

            {courses.length === 0 ? (
              <div className="p-12 text-center space-y-4 bg-[var(--surface)] rounded-2xl border border-[var(--border)] max-w-lg mx-auto">
                <BookOpen className="w-8 h-8 text-[var(--text-muted)] mx-auto" />
                <h3 className="text-base font-bold text-[var(--text-primary)]">No Courses Created</h3>
                <p className="text-xs text-[var(--text-secondary)]">Define your first course to assign instructors and enroll students.</p>
                <Button variant="primary" size="sm" icon={PlusCircle} onClick={() => setShowCourseModal(true)}>
                  Create Course
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {courses.map((c) => (
                  <div
                    key={c.id || c._id}
                    className="bg-[var(--surface)] p-5 rounded-2xl border border-[var(--border)] shadow-xs flex flex-col justify-between space-y-4 hover:border-[var(--primary-border)] transition-all min-w-0 overflow-hidden"
                  >
                    <div className="space-y-3 min-w-0">
                      <div className="flex items-center justify-between gap-2 min-w-0">
                        <span className="text-xs font-extrabold uppercase tracking-wider text-[var(--primary)] px-2.5 py-1 rounded-md bg-[var(--primary-light)] shrink-0">
                          {c.code}
                        </span>
                        <Badge variant={c.status === 'ACTIVE' ? 'success' : 'neutral'} className="shrink-0">
                          {c.status}
                        </Badge>
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-base font-bold text-[var(--text-primary)] min-w-0 break-words line-clamp-2">{c.name || c.title}</h3>
                        <p className="text-xs text-[var(--text-secondary)] mt-1 min-w-0 truncate">{c.department} Department</p>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-[var(--border-subtle)] flex items-center justify-between gap-2 text-xs">
                      <div className="space-y-0.5 min-w-0">
                        <span className="text-[var(--text-secondary)] block text-[11px] truncate">{c.instructorIds?.length || 0} Instructors</span>
                        <span className="text-[var(--text-secondary)] block text-[11px] truncate">{c.studentIds?.length || 0} Enrolled Students</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={ArrowRight}
                        onClick={() => navigate(`/courses/${c.id || c._id}`)}
                        className="shrink-0"
                      >
                        View Details
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* MODAL: CREATE INSTITUTION */}
        {showInstModal && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-2xl p-6 max-w-md w-full space-y-5 animate-fadeIn">
              <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
                <h3 className="text-base font-bold text-[var(--text-primary)]">Create Institution</h3>
                <button onClick={() => setShowInstModal(false)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateInstitution} className="space-y-4 text-xs">
                <div>
                  <label className="font-bold text-[var(--text-primary)] block mb-1">Institution Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Parul Institute of Technology"
                    value={instForm.name}
                    onChange={(e) => setInstForm({ ...instForm, name: e.target.value })}
                    className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                  />
                </div>

                <div>
                  <label className="font-bold text-[var(--text-primary)] block mb-1">Institution Code</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. PIT"
                    value={instForm.code}
                    onChange={(e) => setInstForm({ ...instForm, code: e.target.value })}
                    className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                  />
                </div>

                <div>
                  <label className="font-bold text-[var(--text-primary)] block mb-1">Comma-separated Departments</label>
                  <input
                    type="text"
                    placeholder="Computer Science, Electrical Engineering"
                    value={instForm.departments}
                    onChange={(e) => setInstForm({ ...instForm, departments: e.target.value })}
                    className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                  />
                </div>

                <div className="pt-3 flex justify-end gap-2">
                  <Button type="button" variant="ghost" size="sm" onClick={() => setShowInstModal(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary" size="sm" loading={isSubmitting}>
                    Save Institution
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: CREATE COURSE */}
        {showCourseModal && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-2xl p-6 max-w-md w-full space-y-5 animate-fadeIn">
              <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
                <h3 className="text-base font-bold text-[var(--text-primary)]">Create New Course</h3>
                <button onClick={() => setShowCourseModal(false)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateCourse} className="space-y-4 text-xs">
                {institutions.length > 0 && (
                  <div>
                    <label className="font-bold text-[var(--text-primary)] block mb-1">Target Institution</label>
                    <select
                      value={courseForm.institutionId}
                      onChange={(e) => setCourseForm({ ...courseForm, institutionId: e.target.value })}
                      className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                    >
                      {institutions.map((inst) => (
                        <option key={inst.id || inst._id} value={inst.id || inst._id}>
                          {inst.name} ({inst.code})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="font-bold text-[var(--text-primary)] block mb-1">Course Code</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. CS301"
                    value={courseForm.code}
                    onChange={(e) => setCourseForm({ ...courseForm, code: e.target.value })}
                    className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                  />
                </div>

                <div>
                  <label className="font-bold text-[var(--text-primary)] block mb-1">Course Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Data Structures & Algorithms"
                    value={courseForm.name}
                    onChange={(e) => setCourseForm({ ...courseForm, name: e.target.value })}
                    className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                  />
                </div>

                <div>
                  <label className="font-bold text-[var(--text-primary)] block mb-1">Department</label>
                  <input
                    type="text"
                    placeholder="Computer Science"
                    value={courseForm.department}
                    onChange={(e) => setCourseForm({ ...courseForm, department: e.target.value })}
                    className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                  />
                </div>

                <div>
                  <label className="font-bold text-[var(--text-primary)] block mb-1">Description (Optional)</label>
                  <textarea
                    rows={2}
                    placeholder="Brief course overview and syllabus scope..."
                    value={courseForm.description}
                    onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })}
                    className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                  />
                </div>

                <div className="pt-3 flex justify-end gap-2">
                  <Button type="button" variant="ghost" size="sm" onClick={() => setShowCourseModal(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary" size="sm" loading={isSubmitting}>
                    Save Course
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: ADD DEPARTMENT */}
        {showDeptModal && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-2xl p-6 max-w-sm w-full space-y-5 animate-fadeIn">
              <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
                <h3 className="text-base font-bold text-[var(--text-primary)]">Add Department</h3>
                <button onClick={() => setShowDeptModal(false)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddDepartment} className="space-y-4 text-xs">
                <div>
                  <label className="font-bold text-[var(--text-primary)] block mb-1">Department Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Mechanical Engineering"
                    value={deptInput}
                    onChange={(e) => setDeptInput(e.target.value)}
                    className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                  />
                </div>

                <div className="pt-3 flex justify-end gap-2">
                  <Button type="button" variant="ghost" size="sm" onClick={() => setShowDeptModal(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary" size="sm" loading={isSubmitting}>
                    Add
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
};
