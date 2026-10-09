import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { institutionService } from '../services/institutionService';
import { courseService } from '../services/courseService';
import { userService } from '../services/userService';
import { useAuth } from '../context/AuthContext';
import {
  Building2,
  BookOpen,
  Users,
  GraduationCap,
  PlusCircle,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  X,
  UserCheck,
  ArrowRight,
  Search,
} from 'lucide-react';

export const AdminInstitutionDetailPage = () => {
  const { institutionId } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();

  const [institution, setInstitution] = useState(null);
  const [courses, setCourses] = useState([]);
  const [instructors, setInstructors] = useState([]);
  const [students, setStudents] = useState([]);
  const [allUsers, setAllUsers] = useState([]);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [showCreateCourseModal, setShowCreateCourseModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    institutionId: institutionId,
    department: 'Computer Science & Engineering',
    name: '',
    code: '',
    description: '',
  });

  const [selectedCourse, setSelectedCourse] = useState(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [selectedInstIds, setSelectedInstIds] = useState([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);
  const [enrollModalError, setEnrollModalError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [instRes, courseRes, instUsersRes, studUsersRes, allUsersRes] = await Promise.all([
        institutionService.getById(institutionId).catch(() => null),
        courseService.getAll({ institutionId }).catch(() => ({ success: false, data: { courses: [] } })),
        userService.getAll({ role: 'INSTRUCTOR' }).catch(() => ({ success: false, data: { users: [] } })),
        userService.getAll({ role: 'STUDENT', institutionId }).catch(() => ({ success: false, data: { users: [] } })),
        userService.getAll().catch(() => ({ success: false, data: { users: [] } })),
      ]);

      if (instRes && instRes.success && instRes.data?.institution) {
        setInstitution(instRes.data.institution);
      } else if (instRes && instRes.institution) {
        setInstitution(instRes.institution);
      } else {
        // Fallback: search in all institutions list
        const allInstRes = await institutionService.getAll().catch(() => ({ success: false, data: { institutions: [] } }));
        const instList = allInstRes.data?.institutions || [];
        const found = instList.find((i) => (i.id || i._id)?.toString() === institutionId);
        if (found) setInstitution(found);
      }

      if (courseRes?.success && Array.isArray(courseRes.data?.courses)) {
        setCourses(courseRes.data.courses);
      }
      if (instUsersRes?.success) setInstructors(instUsersRes.data.users || []);
      if (studUsersRes?.success) setStudents(studUsersRes.data.users || []);
      if (allUsersRes?.success) setAllUsers(allUsersRes.data.users || []);
    } catch (err) {
      setError(err.message || 'Failed to load institution details.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (institutionId) {
      setCreateForm((prev) => ({ ...prev, institutionId }));
      loadData();
    }
  }, [institutionId]);

  // Compute distinct instructor and student counts
  const distinctInstructorIds = new Set();
  const distinctStudentIds = new Set();

  courses.forEach((c) => {
    c.instructorIds?.forEach((inst) => {
      const id = (inst.id || inst._id || inst)?.toString();
      if (id) distinctInstructorIds.add(id);
    });
    c.studentIds?.forEach((stud) => {
      const id = (stud.id || stud._id || stud)?.toString();
      if (id) distinctStudentIds.add(id);
    });
  });

  // Also include users directly linked via institutionId
  allUsers.forEach((u) => {
    const uInstId = (u.institutionId?.id || u.institutionId?._id || u.institutionId)?.toString();
    if (uInstId === institutionId) {
      const uid = (u.id || u._id)?.toString();
      if (u.role === 'INSTRUCTOR' && uid) distinctInstructorIds.add(uid);
      if (u.role === 'STUDENT' && uid) distinctStudentIds.add(uid);
    }
  });

  const handleCreateCourse = async (e) => {
    e.preventDefault();
    if (!createForm.name || !createForm.code) return;

    try {
      setIsSubmitting(true);
      setError(null);
      const res = await courseService.create({ ...createForm, institutionId });
      if (res.success) {
        setSuccess(`Course ${createForm.code} created successfully!`);
        setShowCreateCourseModal(false);
        setCreateForm({
          institutionId,
          department: 'Computer Science & Engineering',
          name: '',
          code: '',
          description: '',
        });
        await loadData();
      }
    } catch (err) {
      setError(err.message || 'Failed to create course.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAssignInstructorsSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCourse) return;

    try {
      setIsSubmitting(true);
      setError(null);
      const courseId = (selectedCourse.id || selectedCourse._id)?.toString();
      const cleanInstIds = selectedInstIds
        .map((item) => (typeof item === 'string' ? item : (item.id || item._id)?.toString()))
        .filter(Boolean);
      const res = await courseService.assignInstructors(courseId, cleanInstIds, 'set');
      if (res.success) {
        setSuccess(`Instructor assignment updated for course ${selectedCourse.code}.`);
        setShowAssignModal(false);
        setSelectedCourse(null);
        await loadData();
      }
    } catch (err) {
      setError(err.message || 'Failed to update assigned instructors.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEnrollStudentsSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCourse) return;

    try {
      setIsSubmitting(true);
      setEnrollModalError(null);
      const courseId = (selectedCourse.id || selectedCourse._id)?.toString();
      const cleanStudentIds = [...new Set(selectedStudentIds
        .map((item) => (typeof item === 'string' ? item : (item.id || item._id)?.toString()))
        .filter(Boolean))];
      const res = await courseService.manageStudents(courseId, cleanStudentIds, 'set');
      if (res.success) {
        setSuccess(`Student enrollments updated for course ${selectedCourse.code}.`);
        setShowEnrollModal(false);
        setSelectedCourse(null);
        await loadData();
      }
    } catch (err) {
      setEnrollModalError(err.message || 'Failed to update enrolled students.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredCourses = courses.filter((c) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.code?.toLowerCase().includes(q) ||
      c.name?.toLowerCase().includes(q) ||
      c.department?.toLowerCase().includes(q)
    );
  });

  if (isLoading) {
    return (
      <AppShell title="Institution Overview">
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
          <div className="w-10 h-10 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-semibold text-[var(--text-secondary)]">Loading institution details...</p>
        </div>
      </AppShell>
    );
  }

  if (!institution) {
    return (
      <AppShell title="Institution Not Found">
        <div className="p-8 text-center space-y-4 max-w-md mx-auto bg-[var(--surface)] rounded-2xl border border-[var(--border)] shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-red-500/10 text-red-600 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-base font-bold text-[var(--text-primary)]">Institution Not Found</h2>
          <p className="text-xs text-[var(--text-secondary)]">The requested institution record does not exist or has been archived.</p>
          <Button variant="secondary" size="sm" icon={ArrowLeft} onClick={() => navigate('/admin/institutions')}>
            Back to Institutions
          </Button>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title={institution.name}>
      <div className="space-y-6 pb-12">
        {/* Navigation & Header */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" icon={ArrowLeft} onClick={() => navigate('/admin/institutions')}>
            Back to Institutions
          </Button>
          <Badge variant={institution.status === 'ACTIVE' ? 'success' : 'neutral'}>
            {institution.status}
          </Badge>
        </div>

        {/* Institution Banner */}
        <div className="bg-[var(--surface)] p-6 md:p-8 rounded-2xl border border-[var(--border)] shadow-xs space-y-4 min-w-0">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 min-w-0">
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-14 h-14 rounded-2xl bg-[var(--primary-light)] text-[var(--primary)] flex items-center justify-center font-black text-base uppercase tracking-wider shrink-0 border border-[var(--primary-border)]">
                {institution.code}
              </div>
              <div className="min-w-0">
                <h1 className="text-2xl font-extrabold text-[var(--text-primary)] min-w-0 break-words leading-tight">
                  {institution.name}
                </h1>
                <span className="text-xs text-[var(--text-secondary)] font-semibold mt-1 block">
                  Institution Code: <strong className="text-[var(--text-primary)]">{institution.code}</strong>
                </span>
              </div>
            </div>
            {currentUser?.role === 'SUPER_ADMIN' && (
              <Button
                variant="primary"
                size="sm"
                icon={PlusCircle}
                onClick={() => setShowCreateCourseModal(true)}
              >
                Create Course
              </Button>
            )}
          </div>
        </div>

        {/* Alert Notifications */}
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

        {/* Summary Statistics Grid (3 Cards) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-[var(--surface)] p-5 rounded-2xl border border-[var(--border)] shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs text-[var(--text-secondary)] font-semibold block">Active Courses</span>
              <strong className="text-xl font-extrabold text-[var(--text-primary)]">{courses.length}</strong>
            </div>
          </div>

          <div className="bg-[var(--surface)] p-5 rounded-2xl border border-[var(--border)] shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
              <UserCheck className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs text-[var(--text-secondary)] font-semibold block">Instructors</span>
              <strong className="text-xl font-extrabold text-[var(--text-primary)]">{distinctInstructorIds.size}</strong>
            </div>
          </div>

          <div className="bg-[var(--surface)] p-5 rounded-2xl border border-[var(--border)] shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs text-[var(--text-secondary)] font-semibold block">Enrolled Students</span>
              <strong className="text-xl font-extrabold text-[var(--text-primary)]">{distinctStudentIds.size}</strong>
            </div>
          </div>
        </div>

        {/* Courses Offered Section */}
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[var(--surface)] p-4 rounded-2xl border border-[var(--border)]">
            <div>
              <h2 className="text-base font-bold text-[var(--text-primary)]">Courses Offered</h2>
              <p className="text-xs text-[var(--text-secondary)]">
                Academic courses belonging strictly to {institution.name}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative w-full max-w-xs">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-[var(--text-muted)]" />
                <input
                  type="text"
                  placeholder="Search courses..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-[var(--background)] border border-[var(--border)] rounded-xl text-xs text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                />
              </div>
              <Button
                variant="primary"
                size="sm"
                icon={PlusCircle}
                onClick={() => setShowCreateCourseModal(true)}
              >
                Create Course
              </Button>
            </div>
          </div>

          {/* Courses Grid */}
          {filteredCourses.length === 0 ? (
            <div className="p-12 text-center space-y-3 bg-[var(--surface)] rounded-2xl border border-[var(--border)] max-w-lg mx-auto">
              <BookOpen className="w-8 h-8 text-[var(--text-muted)] mx-auto" />
              <h3 className="text-base font-bold text-[var(--text-primary)]">No Courses Found</h3>
              <p className="text-xs text-[var(--text-secondary)]">No active courses configured for this institution yet.</p>
              <Button
                variant="primary"
                size="sm"
                icon={PlusCircle}
                onClick={() => setShowCreateCourseModal(true)}
              >
                Create Course
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCourses.map((c) => {
                const cId = (c.id || c._id)?.toString();
                const instNames = c.instructorIds?.map((i) => i.name || i.email).join(', ') || 'Unassigned';

                return (
                  <div
                    key={cId}
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
                        <h3 className="text-base font-bold text-[var(--text-primary)] min-w-0 break-words line-clamp-2">
                          {c.name || c.title}
                        </h3>
                        <p className="text-xs text-[var(--text-secondary)] mt-0.5 min-w-0 truncate">
                          {c.department || 'Computer Science & Engineering'}
                        </p>
                      </div>

                      <div className="p-3 bg-[var(--background)] rounded-xl border border-[var(--border-subtle)] text-[11px] space-y-1.5 min-w-0">
                        <div className="flex justify-between items-start gap-2 min-w-0">
                          <span className="text-[var(--text-secondary)] shrink-0">Instructor(s):</span>
                          <strong className="text-[var(--text-primary)] text-right min-w-0 break-words font-semibold">
                            {instNames}
                          </strong>
                        </div>
                        <div className="flex justify-between items-center gap-2 min-w-0">
                          <span className="text-[var(--text-secondary)] shrink-0">Students:</span>
                          <strong className="text-[var(--text-primary)] text-right shrink-0 font-semibold">
                            {c.studentIds?.length || 0} Students
                          </strong>
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-[var(--border-subtle)] flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <Button
                          variant="secondary"
                          size="sm"
                          icon={UserCheck}
                          onClick={() => {
                            setSelectedCourse(c);
                            const initialInstIds = (c.instructorIds || [])
                              .map((i) => (typeof i === 'string' ? i : (i.id || i._id)?.toString()))
                              .filter(Boolean);
                            setSelectedInstIds(initialInstIds);
                            setShowAssignModal(true);
                          }}
                        >
                          Assign Instructor
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          icon={GraduationCap}
                          onClick={() => {
                            setSelectedCourse(c);
                            setEnrollModalError(null);
                            const validStudSet = new Set((students || []).map((s) => (s.id || s._id)?.toString()).filter(Boolean));
                            const initialStudIds = (c.studentIds || [])
                              .map((s) => (typeof s === 'string' ? s : (s.id || s._id)?.toString()))
                              .filter((id) => Boolean(id) && validStudSet.has(id));
                            setSelectedStudentIds([...new Set(initialStudIds)]);
                            setShowEnrollModal(true);
                          }}
                        >
                          Students
                        </Button>
                      </div>
                      <Button
                        variant="primary"
                        size="sm"
                        icon={ArrowRight}
                        onClick={() => navigate(`/courses/${cId}`)}
                      >
                        View Course →
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* MODAL: CREATE COURSE */}
        {showCreateCourseModal && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-2xl p-6 max-w-md w-full space-y-5 animate-fadeIn">
              <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
                <div>
                  <h3 className="text-base font-bold text-[var(--text-primary)]">Create Course for Institution</h3>
                  <span className="text-xs text-[var(--text-secondary)]">{institution.name}</span>
                </div>
                <button
                  onClick={() => setShowCreateCourseModal(false)}
                  className="text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateCourse} className="space-y-4 text-xs">
                <div>
                  <label className="font-bold text-[var(--text-primary)] block mb-1">Course Code</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. CS301"
                    value={createForm.code}
                    onChange={(e) => setCreateForm({ ...createForm, code: e.target.value })}
                    className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                  />
                </div>

                <div>
                  <label className="font-bold text-[var(--text-primary)] block mb-1">Course Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Data Structures & Algorithms"
                    value={createForm.name}
                    onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                    className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                  />
                </div>

                <div>
                  <label className="font-bold text-[var(--text-primary)] block mb-1">Department</label>
                  <input
                    type="text"
                    value={createForm.department}
                    onChange={(e) => setCreateForm({ ...createForm, department: e.target.value })}
                    className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                  />
                </div>

                <div>
                  <label className="font-bold text-[var(--text-primary)] block mb-1">Description (Optional)</label>
                  <textarea
                    rows={2}
                    placeholder="Course description..."
                    value={createForm.description}
                    onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                    className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                  />
                </div>

                <div className="pt-3 flex justify-end gap-2">
                  <Button type="button" variant="ghost" size="sm" onClick={() => setShowCreateCourseModal(false)}>
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

        {/* MODAL: ASSIGN INSTRUCTORS */}
        {showAssignModal && selectedCourse && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-2xl p-6 max-w-md w-full space-y-5 animate-fadeIn">
              <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
                <div>
                  <h3 className="text-base font-bold text-[var(--text-primary)]">Assign Faculty Instructors</h3>
                  <span className="text-xs text-[var(--text-secondary)]">{selectedCourse.code} — {selectedCourse.name}</span>
                </div>
                <button onClick={() => setShowAssignModal(false)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAssignInstructorsSubmit} className="space-y-4 text-xs">
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {instructors.length === 0 ? (
                    <p className="text-[11px] text-[var(--text-muted)] italic">No instructors registered in system.</p>
                  ) : (
                    instructors.map((inst) => {
                      const instId = (inst.id || inst._id)?.toString();
                      const isChecked = selectedInstIds.some((id) => id?.toString() === instId);
                      return (
                        <label
                          key={instId}
                          className="p-3 bg-[var(--background)] rounded-xl border border-[var(--border-subtle)] flex items-center justify-between cursor-pointer hover:border-[var(--primary-border)]"
                        >
                          <div>
                            <span className="font-bold block text-[var(--text-primary)]">{inst.name}</span>
                            <span className="text-[11px] text-[var(--text-secondary)]">{inst.email}</span>
                          </div>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedInstIds([...selectedInstIds.filter((id) => id !== instId), instId]);
                              } else {
                                setSelectedInstIds(selectedInstIds.filter((id) => id !== instId));
                              }
                            }}
                            className="w-4 h-4 rounded text-[var(--primary)] focus:ring-[var(--primary)]"
                          />
                        </label>
                      );
                    })
                  )}
                </div>

                <div className="pt-3 flex justify-end gap-2">
                  <Button type="button" variant="ghost" size="sm" onClick={() => setShowAssignModal(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary" size="sm" loading={isSubmitting}>
                    Save Assignment
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: MANAGE ENROLLED STUDENTS */}
        {showEnrollModal && selectedCourse && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-2xl p-6 max-w-md w-full space-y-5 animate-fadeIn">
              <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
                <div>
                  <h3 className="text-base font-bold text-[var(--text-primary)]">Manage Student Enrollments</h3>
                  <span className="text-xs text-[var(--text-secondary)]">{selectedCourse.code} — {selectedCourse.name}</span>
                </div>
                <button onClick={() => setShowEnrollModal(false)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {enrollModalError && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 rounded-xl text-xs font-semibold flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{enrollModalError}</span>
                  </div>
                  <button type="button" onClick={() => setEnrollModalError(null)} className="cursor-pointer">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              <form onSubmit={handleEnrollStudentsSubmit} className="space-y-4 text-xs">
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {students.length === 0 ? (
                    <p className="text-[11px] text-[var(--text-muted)] italic">No student accounts registered for this institution.</p>
                  ) : (
                    students.map((stud) => {
                      const studId = (stud.id || stud._id)?.toString();
                      const isChecked = selectedStudentIds.some((id) => id?.toString() === studId);
                      return (
                        <label
                          key={studId}
                          className="p-3 bg-[var(--background)] rounded-xl border border-[var(--border-subtle)] flex items-center justify-between cursor-pointer hover:border-[var(--primary-border)]"
                        >
                          <div>
                            <span className="font-bold block text-[var(--text-primary)]">{stud.name}</span>
                            <span className="text-[11px] text-[var(--text-secondary)]">{stud.email}</span>
                          </div>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedStudentIds([...selectedStudentIds.filter((id) => id !== studId), studId]);
                              } else {
                                setSelectedStudentIds(selectedStudentIds.filter((id) => id !== studId));
                              }
                            }}
                            className="w-4 h-4 rounded text-[var(--primary)] focus:ring-[var(--primary)]"
                          />
                        </label>
                      );
                    })
                  )}
                </div>

                <div className="pt-3 flex justify-end gap-2">
                  <Button type="button" variant="ghost" size="sm" onClick={() => setShowEnrollModal(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary" size="sm" loading={isSubmitting}>
                    Save Enrollments
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
