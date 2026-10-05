import React, { useState, useEffect } from 'react';
import { AppShell } from '../components/layout/AppShell';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { institutionService } from '../services/institutionService';
import { courseService } from '../services/courseService';
import { userService } from '../services/userService';
import { useAuth } from '../context/AuthContext';
import {
  Building2,
  PlusCircle,
  Users,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  X,
  Eye,
  Archive,
  Layers,
} from 'lucide-react';

export const AdminInstitutionPage = () => {
  const { user: currentUser } = useAuth();

  const [institutions, setInstitutions] = useState([]);
  const [courses, setCourses] = useState([]);
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [instForm, setInstForm] = useState({ name: '', code: '', departments: 'Computer Science, Electrical Engineering' });

  const [showDeptModal, setShowDeptModal] = useState(false);
  const [targetInstId, setTargetInstId] = useState(null);
  const [deptInput, setDeptInput] = useState('');

  const [selectedInst, setSelectedInst] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [instRes, courseRes, userRes] = await Promise.all([
        institutionService.getAll().catch(() => ({ success: false, data: { institutions: [] } })),
        courseService.getAll().catch(() => ({ success: false, data: { courses: [] } })),
        userService.getAll().catch(() => ({ success: false, data: { users: [] } })),
      ]);

      if (instRes.success && Array.isArray(instRes.data?.institutions)) {
        setInstitutions(instRes.data.institutions);
      }
      if (courseRes.success && Array.isArray(courseRes.data?.courses)) {
        setCourses(courseRes.data.courses);
      }
      if (userRes.success && Array.isArray(userRes.data?.users)) {
        setUsers(userRes.data.users);
      }
    } catch (err) {
      setError(err.message || 'Failed to load institution directory.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateInstitution = async (e) => {
    e.preventDefault();
    if (!instForm.name || !instForm.code) return;

    try {
      setIsSubmitting(true);
      setError(null);
      const depts = instForm.departments.split(',').map((d) => d.trim()).filter(Boolean);
      const res = await institutionService.create({ name: instForm.name, code: instForm.code, departments: depts });

      if (res.success) {
        setSuccess(`Institution ${instForm.name} created successfully!`);
        setShowCreateModal(false);
        setInstForm({ name: '', code: '', departments: 'Computer Science, Electrical Engineering' });
        await loadData();
      }
    } catch (err) {
      setError(err.message || 'Failed to create institution.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddDepartment = async (e) => {
    e.preventDefault();
    if (!targetInstId || !deptInput.trim()) return;

    try {
      setIsSubmitting(true);
      setError(null);
      const res = await institutionService.addDepartment(targetInstId, deptInput);
      if (res.success) {
        setSuccess('Department added successfully!');
        setShowDeptModal(false);
        setDeptInput('');
        await loadData();
      }
    } catch (err) {
      setError(err.message || 'Failed to add department.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleArchive = async (instId) => {
    try {
      setError(null);
      const res = await institutionService.archive(instId);
      if (res.success) {
        setSuccess('Institution status updated.');
        await loadData();
      }
    } catch (err) {
      setError(err.message || 'Failed to archive institution.');
    }
  };

  return (
    <AppShell title="Institution Management">
      <div className="space-y-6 pb-12">
        {/* Top Action Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[var(--surface)] p-6 rounded-2xl border border-[var(--border)] shadow-xs">
          <div>
            <h1 className="text-xl font-bold text-[var(--text-primary)]">Enterprise Institutions</h1>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              Manage institution hierarchy, academic departments, capacity limits, and course mappings.
            </p>
          </div>
          {currentUser?.role === 'SUPER_ADMIN' && (
            <Button variant="primary" size="sm" icon={PlusCircle} onClick={() => setShowCreateModal(true)}>
              Create Institution
            </Button>
          )}
        </div>

        {success && (
          <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 rounded-xl text-xs font-semibold flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>{success}</span>
            </div>
            <button onClick={() => setSuccess(null)} className="cursor-pointer">
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

        {/* Institution Cards */}
        {isLoading ? (
          <div className="p-12 text-center text-xs text-[var(--text-secondary)] bg-[var(--surface)] rounded-2xl border border-[var(--border)]">
            Loading database institution directory...
          </div>
        ) : institutions.length === 0 ? (
          <div className="p-12 text-center space-y-3 bg-[var(--surface)] rounded-2xl border border-[var(--border)] max-w-lg mx-auto">
            <Building2 className="w-8 h-8 text-[var(--text-muted)] mx-auto" />
            <h3 className="text-base font-bold text-[var(--text-primary)]">No Institutions Configured</h3>
            <p className="text-xs text-[var(--text-secondary)]">Create an institution to manage departments and courses.</p>
            {currentUser?.role === 'SUPER_ADMIN' && (
              <Button variant="primary" size="sm" icon={PlusCircle} onClick={() => setShowCreateModal(true)}>
                Create Institution
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {institutions.map((inst) => {
              const instId = inst.id || inst._id;
              const instCourses = courses.filter((c) => (c.institutionId?._id || c.institutionId) === instId);
              const instUsers = users.filter((u) => (u.institutionId?._id || u.institutionId) === instId);
              const instInstructors = instUsers.filter((u) => u.role === 'INSTRUCTOR');
              const instStudents = instUsers.filter((u) => u.role === 'STUDENT');

              return (
                <div
                  key={instId}
                  className="bg-[var(--surface)] p-5 rounded-2xl border border-[var(--border)] shadow-xs space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[var(--primary-light)] text-[var(--primary)] flex items-center justify-center font-bold text-sm">
                          {inst.code}
                        </div>
                        <div>
                          <h3 className="text-base font-bold text-[var(--text-primary)]">{inst.name}</h3>
                          <span className="text-[11px] text-[var(--text-secondary)] block">Code: {inst.code}</span>
                        </div>
                      </div>
                      <Badge variant={inst.status === 'ACTIVE' ? 'success' : 'neutral'}>{inst.status}</Badge>
                    </div>

                    <div className="grid grid-cols-3 gap-2 p-3 bg-[var(--background)] rounded-xl border border-[var(--border-subtle)] text-[11px] text-center">
                      <div>
                        <span className="text-[var(--text-secondary)] block">Courses</span>
                        <strong className="text-xs text-[var(--text-primary)]">{instCourses.length}</strong>
                      </div>
                      <div>
                        <span className="text-[var(--text-secondary)] block">Faculty</span>
                        <strong className="text-xs text-[var(--text-primary)]">{instInstructors.length}</strong>
                      </div>
                      <div>
                        <span className="text-[var(--text-secondary)] block">Students</span>
                        <strong className="text-xs text-[var(--text-primary)]">{instStudents.length}</strong>
                      </div>
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
                  </div>

                  <div className="pt-3 border-t border-[var(--border-subtle)] flex items-center justify-between text-xs">
                    <Button variant="ghost" size="sm" icon={Eye} onClick={() => setSelectedInst({ ...inst, courses: instCourses, instructors: instInstructors, students: instStudents })}>
                      Overview Map
                    </Button>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={PlusCircle}
                        onClick={() => {
                          setTargetInstId(instId);
                          setShowDeptModal(true);
                        }}
                      >
                        Add Dept
                      </Button>
                      {currentUser?.role === 'SUPER_ADMIN' && (
                        <Button variant="ghost" size="sm" icon={Archive} onClick={() => handleArchive(instId)}>
                          Archive
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* MODAL: INSTITUTION OVERVIEW MAP */}
        {selectedInst && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-2xl p-6 max-w-lg w-full space-y-5 animate-fadeIn">
              <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
                <div>
                  <h3 className="text-base font-bold text-[var(--text-primary)]">{selectedInst.name} ({selectedInst.code})</h3>
                  <span className="text-xs text-[var(--text-secondary)]">Hierarchy & Relationship Map</span>
                </div>
                <button onClick={() => setSelectedInst(null)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4 text-xs">
                <div className="p-3 bg-[var(--background)] rounded-xl border border-[var(--border-subtle)] space-y-2">
                  <span className="font-bold text-[var(--text-primary)] block">Departments Framework</span>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedInst.departments?.map((d, i) => (
                      <span key={i} className="px-2 py-0.5 bg-[var(--primary-light)] text-[var(--primary)] font-semibold rounded-md">
                        {d}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="font-bold text-[var(--text-primary)] block">Active Courses ({selectedInst.courses?.length || 0})</span>
                  <div className="space-y-1.5 max-h-36 overflow-y-auto">
                    {selectedInst.courses?.map((c) => (
                      <div key={c.id || c._id} className="p-2.5 bg-[var(--background)] rounded-lg border border-[var(--border-subtle)] flex justify-between items-center">
                        <div>
                          <span className="font-bold text-[var(--text-primary)]">{c.code} — {c.name}</span>
                          <span className="text-[10px] text-[var(--text-secondary)] block">{c.department} Dept</span>
                        </div>
                        <Badge variant="neutral">{c.studentIds?.length || 0} Students</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MODAL: CREATE INSTITUTION */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-2xl p-6 max-w-md w-full space-y-5 animate-fadeIn">
              <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
                <h3 className="text-base font-bold text-[var(--text-primary)]">Create Institution</h3>
                <button onClick={() => setShowCreateModal(false)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateInstitution} className="space-y-4 text-xs">
                <div>
                  <label className="font-bold text-[var(--text-primary)] block mb-1">Institution Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Parul University"
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
                    placeholder="e.g. PARUL"
                    value={instForm.code}
                    onChange={(e) => setInstForm({ ...instForm, code: e.target.value })}
                    className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                  />
                </div>

                <div>
                  <label className="font-bold text-[var(--text-primary)] block mb-1">Comma-separated Departments</label>
                  <input
                    type="text"
                    placeholder="Computer Science, Information Technology, Electrical Engineering"
                    value={instForm.departments}
                    onChange={(e) => setInstForm({ ...instForm, departments: e.target.value })}
                    className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                  />
                </div>

                <div className="pt-3 flex justify-end gap-2">
                  <Button type="button" variant="ghost" size="sm" onClick={() => setShowCreateModal(false)}>
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

        {/* MODAL: ADD DEPARTMENT */}
        {showDeptModal && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-2xl p-6 max-w-sm w-full space-y-5 animate-fadeIn">
              <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
                <h3 className="text-base font-bold text-[var(--text-primary)]">Add Academic Department</h3>
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
