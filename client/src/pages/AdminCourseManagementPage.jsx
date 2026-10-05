import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { courseService } from '../services/courseService';
import { institutionService } from '../services/institutionService';
import { userService } from '../services/userService';
import { useAuth } from '../context/AuthContext';
import {
  BookOpen,
  PlusCircle,
  Users,
  UserCheck,
  GraduationCap,
  Search,
  CheckCircle2,
  AlertCircle,
  X,
  ArrowRight,
  Archive,
  Edit,
} from 'lucide-react';

export const AdminCourseManagementPage = () => {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();

  const [courses, setCourses] = useState([]);
  const [institutions, setInstitutions] = useState([]);
  const [instructors, setInstructors] = useState([]);
  const [students, setStudents] = useState([]);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    institutionId: currentUser?.institutionId || '',
    department: 'CSE',
    name: '',
    code: '',
    description: '',
  });

  const [selectedCourse, setSelectedCourse] = useState(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [selectedInstIds, setSelectedInstIds] = useState([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [courseRes, instRes, instUsersRes, studUsersRes] = await Promise.all([
        courseService.getAll().catch(() => ({ success: false, data: { courses: [] } })),
        institutionService.getAll().catch(() => ({ success: false, data: { institutions: [] } })),
        userService.getAll({ role: 'INSTRUCTOR' }).catch(() => ({ success: false, data: { users: [] } })),
        userService.getAll({ role: 'STUDENT' }).catch(() => ({ success: false, data: { users: [] } })),
      ]);

      if (courseRes.success && Array.isArray(courseRes.data?.courses)) {
        setCourses(courseRes.data.courses);
      }
      if (instRes.success && Array.isArray(instRes.data?.institutions)) {
        setInstitutions(instRes.data.institutions);
        if (!createForm.institutionId && instRes.data.institutions.length > 0) {
          setCreateForm((prev) => ({ ...prev, institutionId: instRes.data.institutions[0].id || instRes.data.institutions[0]._id }));
        }
      }
      if (instUsersRes.success) setInstructors(instUsersRes.data.users);
      if (studUsersRes.success) setStudents(studUsersRes.data.users);
    } catch (err) {
      setError(err.message || 'Failed to load course directory.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateCourse = async (e) => {
    e.preventDefault();
    if (!createForm.name || !createForm.code) return;

    try {
      setIsSubmitting(true);
      setError(null);
      const res = await courseService.create(createForm);
      if (res.success) {
        setSuccess(`Course ${createForm.code} — ${createForm.name} created successfully!`);
        setShowCreateModal(false);
        setCreateForm({
          institutionId: currentUser?.institutionId || (institutions[0]?.id || ''),
          department: 'CSE',
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
      const res = await courseService.assignInstructors(selectedCourse.id || selectedCourse._id, selectedInstIds, 'set');
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
      setError(null);
      const res = await courseService.manageStudents(selectedCourse.id || selectedCourse._id, selectedStudentIds, 'set');
      if (res.success) {
        setSuccess(`Student enrollments updated for course ${selectedCourse.code}.`);
        setShowEnrollModal(false);
        setSelectedCourse(null);
        await loadData();
      }
    } catch (err) {
      setError(err.message || 'Failed to update enrolled students.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleArchiveCourse = async (courseId) => {
    try {
      setError(null);
      const res = await courseService.archive(courseId);
      if (res.success) {
        setSuccess('Course archived successfully.');
        await loadData();
      }
    } catch (err) {
      setError(err.message || 'Failed to archive course.');
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

  return (
    <AppShell title="Course Directory">
      <div className="space-y-6 pb-12">
        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[var(--surface)] p-6 rounded-2xl border border-[var(--border)] shadow-xs">
          <div>
            <h1 className="text-xl font-bold text-[var(--text-primary)]">Academic Course Directory</h1>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              Create CSE subjects, assign faculty instructors, and manage student course enrollments.
            </p>
          </div>
          <Button variant="primary" size="sm" icon={PlusCircle} onClick={() => setShowCreateModal(true)}>
            Create New Course
          </Button>
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

        {/* Filter Bar */}
        <div className="bg-[var(--surface)] p-4 rounded-2xl border border-[var(--border)] flex items-center justify-between">
          <div className="relative w-full max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-[var(--text-muted)]" />
            <input
              type="text"
              placeholder="Search course code, name, department..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-[var(--background)] border border-[var(--border)] rounded-xl text-xs text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
            />
          </div>
          <span className="text-xs font-semibold text-[var(--text-secondary)]">
            Total Courses: <strong>{filteredCourses.length}</strong>
          </span>
        </div>

        {/* Course Cards Grid */}
        {isLoading ? (
          <div className="p-12 text-center text-xs text-[var(--text-secondary)] bg-[var(--surface)] rounded-2xl border border-[var(--border)]">
            Loading database course directory...
          </div>
        ) : filteredCourses.length === 0 ? (
          <div className="p-12 text-center space-y-3 bg-[var(--surface)] rounded-2xl border border-[var(--border)] max-w-lg mx-auto">
            <BookOpen className="w-8 h-8 text-[var(--text-muted)] mx-auto" />
            <h3 className="text-base font-bold text-[var(--text-primary)]">No Courses Found</h3>
            <p className="text-xs text-[var(--text-secondary)]">Create a course to assign instructors and enroll students.</p>
            <Button variant="primary" size="sm" icon={PlusCircle} onClick={() => setShowCreateModal(true)}>
              Create Course
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((c) => {
              const cId = c.id || c._id;
              const instNames = c.instructorIds?.map((i) => i.name || i.email).join(', ') || 'Unassigned';
              return (
                <div
                  key={cId}
                  className="bg-[var(--surface)] p-5 rounded-2xl border border-[var(--border)] shadow-xs flex flex-col justify-between space-y-4 hover:border-[var(--primary-border)] transition-all"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold uppercase tracking-wider text-[var(--primary)] px-2.5 py-1 rounded-md bg-[var(--primary-light)]">
                        {c.code}
                      </span>
                      <Badge variant={c.status === 'ACTIVE' ? 'success' : 'neutral'}>{c.status}</Badge>
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-[var(--text-primary)]">{c.name}</h3>
                      <p className="text-xs text-[var(--text-secondary)] mt-0.5">{c.department} Department</p>
                    </div>
                    <div className="p-2.5 bg-[var(--background)] rounded-xl border border-[var(--border-subtle)] text-[11px] space-y-1">
                      <div className="flex justify-between">
                        <span className="text-[var(--text-secondary)]">Assigned Faculty:</span>
                        <strong className="text-[var(--text-primary)]">{instNames}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[var(--text-secondary)]">Enrolled Students:</span>
                        <strong className="text-[var(--text-primary)]">{c.studentIds?.length || 0} Students</strong>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-[var(--border-subtle)] flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={UserCheck}
                        onClick={() => {
                          setSelectedCourse(c);
                          setSelectedInstIds(c.instructorIds?.map((i) => i._id || i) || []);
                          setShowAssignModal(true);
                        }}
                      >
                        Assign Inst
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={GraduationCap}
                        onClick={() => {
                          setSelectedCourse(c);
                          setSelectedStudentIds(c.studentIds?.map((s) => s._id || s) || []);
                          setShowEnrollModal(true);
                        }}
                      >
                        Students
                      </Button>
                    </div>
                    <Button variant="ghost" size="sm" icon={ArrowRight} onClick={() => navigate(`/courses/${cId}`)}>
                      Details
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* MODAL: CREATE COURSE */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-2xl p-6 max-w-md w-full space-y-5 animate-fadeIn">
              <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
                <h3 className="text-base font-bold text-[var(--text-primary)]">Create Academic Course</h3>
                <button onClick={() => setShowCreateModal(false)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateCourse} className="space-y-4 text-xs">
                {institutions.length > 0 && (
                  <div>
                    <label className="font-bold text-[var(--text-primary)] block mb-1">Institution</label>
                    <select
                      value={createForm.institutionId}
                      onChange={(e) => setCreateForm({ ...createForm, institutionId: e.target.value })}
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
                    placeholder="e.g. Operating System"
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

                <div className="pt-3 flex justify-end gap-2">
                  <Button type="button" variant="ghost" size="sm" onClick={() => setShowCreateModal(false)}>
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

        {/* MODAL: ASSIGN INSTRUCTOR */}
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
                      const instId = inst.id || inst._id;
                      const isChecked = selectedInstIds.includes(instId);
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
                                setSelectedInstIds([...selectedInstIds, instId]);
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

              <form onSubmit={handleEnrollStudentsSubmit} className="space-y-4 text-xs">
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {students.length === 0 ? (
                    <p className="text-[11px] text-[var(--text-muted)] italic">No student accounts registered in system.</p>
                  ) : (
                    students.map((stud) => {
                      const studId = stud.id || stud._id;
                      const isChecked = selectedStudentIds.includes(studId);
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
                                setSelectedStudentIds([...selectedStudentIds, studId]);
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
