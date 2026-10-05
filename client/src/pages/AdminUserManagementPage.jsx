import React, { useState, useEffect } from 'react';
import { AppShell } from '../components/layout/AppShell';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { userService } from '../services/userService';
import { institutionService } from '../services/institutionService';
import { useAuth } from '../context/AuthContext';
import {
  Users,
  Search,
  Filter,
  UserPlus,
  CheckCircle2,
  AlertCircle,
  X,
  BookOpen,
  Building2,
  GraduationCap,
  ShieldCheck,
  Eye,
  UserX,
  UserCheck,
} from 'lucide-react';

export const AdminUserManagementPage = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [institutions, setInstitutions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Filters
  const [roleFilter, setRoleFilter] = useState('ALL'); // 'ALL' | 'INSTRUCTOR' | 'STUDENT' | 'INSTITUTION_ADMIN'
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [instFilter, setInstFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal States
  const [selectedUser, setSelectedUser] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: '',
    email: '',
    password: 'Password@123',
    role: 'INSTRUCTOR',
    institutionId: currentUser?.institutionId || '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const filters = {};
      if (roleFilter !== 'ALL') filters.role = roleFilter;
      if (statusFilter !== 'ALL') filters.status = statusFilter;
      if (instFilter !== 'ALL') filters.institutionId = instFilter;
      if (searchQuery.trim()) filters.search = searchQuery.trim();

      const [usersRes, instRes] = await Promise.all([
        userService.getAll(filters),
        institutionService.getAll().catch(() => ({ success: false, data: { institutions: [] } })),
      ]);

      if (usersRes.success) {
        setUsers(usersRes.data.users);
      }
      if (instRes.success && Array.isArray(instRes.data?.institutions)) {
        setInstitutions(instRes.data.institutions);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch user directory.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [roleFilter, statusFilter, instFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchUsers();
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!createForm.name || !createForm.email) return;

    try {
      setIsSubmitting(true);
      setError(null);
      const res = await userService.create(createForm);
      if (res.success) {
        setSuccess(`User ${createForm.name} (${createForm.role}) created successfully!`);
        setShowCreateModal(false);
        setCreateForm({
          name: '',
          email: '',
          password: 'Password@123',
          role: 'INSTRUCTOR',
          institutionId: currentUser?.institutionId || '',
        });
        await fetchUsers();
      }
    } catch (err) {
      setError(err.message || 'Failed to create user account.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (targetUser) => {
    const newStatus = targetUser.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    try {
      setError(null);
      const res = await userService.updateStatus(targetUser.id || targetUser._id, newStatus);
      if (res.success) {
        setSuccess(`User status updated to ${newStatus}.`);
        if (selectedUser?.id === targetUser.id || selectedUser?._id === targetUser._id) {
          setSelectedUser({ ...selectedUser, status: newStatus });
        }
        await fetchUsers();
      }
    } catch (err) {
      setError(err.message || 'Failed to update status.');
    }
  };

  const getRoleBadgeVariant = (role) => {
    switch (role) {
      case 'SUPER_ADMIN':
      case 'INSTITUTION_ADMIN':
        return 'primary';
      case 'INSTRUCTOR':
        return 'warning';
      case 'STUDENT':
        return 'neutral';
      default:
        return 'neutral';
    }
  };

  return (
    <AppShell title="User Management">
      <div className="space-y-6 pb-12">
        {/* Top Action Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[var(--surface)] p-6 rounded-2xl border border-[var(--border)] shadow-xs">
          <div>
            <h1 className="text-xl font-bold text-[var(--text-primary)]">User & Roster Directory</h1>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              Manage instructors, students, and administrators with clear course mapping and access controls.
            </p>
          </div>
          <Button variant="primary" size="sm" icon={UserPlus} onClick={() => setShowCreateModal(true)}>
            Add User Account
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

        {/* Filters & Tabs */}
        <div className="bg-[var(--surface)] p-4 rounded-2xl border border-[var(--border)] space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border-subtle)] pb-3">
            <div className="flex items-center gap-1.5 overflow-x-auto">
              {['ALL', 'INSTRUCTOR', 'STUDENT', 'INSTITUTION_ADMIN'].map((r) => (
                <button
                  key={r}
                  onClick={() => setRoleFilter(r)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    roleFilter === r
                      ? 'bg-[var(--primary)] text-white shadow-xs'
                      : 'bg-[var(--surface-muted)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  {r === 'ALL' ? 'All Roles' : r.replace('_', ' ')}
                </button>
              ))}
            </div>

            <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 w-full md:w-72">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-[var(--text-muted)]" />
                <input
                  type="text"
                  placeholder="Search name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-[var(--background)] border border-[var(--border)] rounded-xl text-xs text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                />
              </div>
              <Button type="submit" variant="ghost" size="sm">
                Filter
              </Button>
            </form>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-[var(--text-secondary)]">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-2.5 py-1 bg-[var(--background)] border border-[var(--border)] rounded-lg text-xs font-medium text-[var(--text-primary)]"
              >
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="SUSPENDED">Suspended</option>
              </select>
            </div>

            {institutions.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="font-semibold text-[var(--text-secondary)]">Institution:</span>
                <select
                  value={instFilter}
                  onChange={(e) => setInstFilter(e.target.value)}
                  className="px-2.5 py-1 bg-[var(--background)] border border-[var(--border)] rounded-lg text-xs font-medium text-[var(--text-primary)]"
                >
                  <option value="ALL">All Institutions</option>
                  {institutions.map((inst) => (
                    <option key={inst.id || inst._id} value={inst.id || inst._id}>
                      {inst.name} ({inst.code})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] overflow-hidden shadow-xs">
          {isLoading ? (
            <div className="p-12 text-center text-xs text-[var(--text-secondary)]">Loading users directory...</div>
          ) : users.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <Users className="w-8 h-8 text-[var(--text-muted)] mx-auto" />
              <h3 className="text-sm font-bold text-[var(--text-primary)]">No Users Found</h3>
              <p className="text-xs text-[var(--text-secondary)]">Try adjusting your filters or search query.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[var(--surface-muted)] text-[var(--text-secondary)] font-semibold border-b border-[var(--border-subtle)] uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-4">User</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">Institution</th>
                    <th className="py-3 px-4">Courses / Scoping</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-subtle)] text-[var(--text-primary)]">
                  {users.map((u) => {
                    const uId = u.id || u._id;
                    return (
                      <tr key={uId} className="hover:bg-[var(--surface-muted)]/50 transition-colors">
                        <td className="py-3 px-4">
                          <div>
                            <span className="font-bold block">{u.name}</span>
                            <span className="text-[11px] text-[var(--text-secondary)]">{u.email}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant={getRoleBadgeVariant(u.role)}>{u.role.replace('_', ' ')}</Badge>
                        </td>
                        <td className="py-3 px-4 text-[var(--text-secondary)] font-medium">
                          {u.institutionId?.name ? `${u.institutionId.name} (${u.institutionId.code})` : 'Global / Unassigned'}
                        </td>
                        <td className="py-3 px-4">
                          {u.role === 'INSTRUCTOR' ? (
                            <span className="text-[11px] font-semibold text-[var(--primary)]">
                              {u.assignedCourses?.length || 0} Courses ({u.totalStudentsAcrossCourses || 0} Students)
                            </span>
                          ) : u.role === 'STUDENT' ? (
                            <span className="text-[11px] font-semibold text-[var(--text-secondary)]">
                              {u.enrolledCourses?.length || 0} Enrolled Courses
                            </span>
                          ) : (
                            <span className="text-[11px] text-[var(--text-muted)]">—</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant={u.status === 'ACTIVE' ? 'success' : 'danger'}>{u.status}</Badge>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button variant="ghost" size="sm" icon={Eye} onClick={() => setSelectedUser(u)}>
                              View
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              icon={u.status === 'ACTIVE' ? UserX : UserCheck}
                              onClick={() => handleToggleStatus(u)}
                            >
                              {u.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* MODAL: USER DETAILS (Instructor / Student Mapping) */}
        {selectedUser && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-2xl p-6 max-w-lg w-full space-y-5 animate-fadeIn">
              <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
                <div>
                  <h3 className="text-base font-bold text-[var(--text-primary)]">{selectedUser.name}</h3>
                  <span className="text-xs text-[var(--text-secondary)]">{selectedUser.email}</span>
                </div>
                <button onClick={() => setSelectedUser(null)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-3 p-3 bg-[var(--background)] rounded-xl border border-[var(--border-subtle)]">
                  <div>
                    <span className="text-[var(--text-secondary)] block">Account Role</span>
                    <span className="font-bold text-[var(--text-primary)]">{selectedUser.role}</span>
                  </div>
                  <div>
                    <span className="text-[var(--text-secondary)] block">Status</span>
                    <span className="font-bold text-[var(--text-primary)]">{selectedUser.status}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-[var(--text-secondary)] block">Institution</span>
                    <span className="font-bold text-[var(--text-primary)]">
                      {selectedUser.institutionId?.name ? `${selectedUser.institutionId.name} (${selectedUser.institutionId.code})` : 'Global / Unassigned'}
                    </span>
                  </div>
                </div>

                {/* INSTRUCTOR DETAILED MAP */}
                {selectedUser.role === 'INSTRUCTOR' && (
                  <div className="space-y-3">
                    <h4 className="font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                      <BookOpen className="w-4 h-4 text-[var(--primary)]" />
                      Assigned Academic Courses ({selectedUser.assignedCourses?.length || 0})
                    </h4>
                    {!selectedUser.assignedCourses || selectedUser.assignedCourses.length === 0 ? (
                      <p className="text-[11px] text-[var(--text-muted)] italic">No courses currently assigned to this instructor.</p>
                    ) : (
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {selectedUser.assignedCourses.map((c) => (
                          <div key={c.id} className="p-3 bg-[var(--background)] rounded-xl border border-[var(--border-subtle)] flex items-center justify-between">
                            <div>
                              <span className="font-bold text-[var(--primary)]">{c.code} — {c.name}</span>
                              <span className="text-[11px] text-[var(--text-secondary)] block">{c.department} Dept</span>
                            </div>
                            <Badge variant="neutral">{c.studentCount} Students Enrolled</Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* STUDENT DETAILED MAP */}
                {selectedUser.role === 'STUDENT' && (
                  <div className="space-y-3">
                    <h4 className="font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                      <GraduationCap className="w-4 h-4 text-[var(--primary)]" />
                      Enrolled Courses & Assigned Instructors ({selectedUser.enrolledCourses?.length || 0})
                    </h4>
                    {!selectedUser.enrolledCourses || selectedUser.enrolledCourses.length === 0 ? (
                      <p className="text-[11px] text-[var(--text-muted)] italic">Student is not currently enrolled in any course.</p>
                    ) : (
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {selectedUser.enrolledCourses.map((c) => (
                          <div key={c.id} className="p-3 bg-[var(--background)] rounded-xl border border-[var(--border-subtle)] space-y-1">
                            <div className="flex justify-between items-center">
                              <span className="font-bold text-[var(--primary)]">{c.code} — {c.name}</span>
                              <Badge variant={c.status === 'ACTIVE' ? 'success' : 'neutral'}>{c.status}</Badge>
                            </div>
                            <span className="text-[11px] text-[var(--text-secondary)] block">
                              Assigned Instructor: <strong className="text-[var(--text-primary)]">{c.assignedInstructors}</strong>
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* MODAL: CREATE USER */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-2xl p-6 max-w-md w-full space-y-5 animate-fadeIn">
              <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
                <h3 className="text-base font-bold text-[var(--text-primary)]">Create User Account</h3>
                <button onClick={() => setShowCreateModal(false)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateUser} className="space-y-4 text-xs">
                <div>
                  <label className="font-bold text-[var(--text-primary)] block mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dr. Rahul Kumar"
                    value={createForm.name}
                    onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                    className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                  />
                </div>

                <div>
                  <label className="font-bold text-[var(--text-primary)] block mb-1">College Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. rahul@college.edu"
                    value={createForm.email}
                    onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                    className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                  />
                </div>

                <div>
                  <label className="font-bold text-[var(--text-primary)] block mb-1">Account Role</label>
                  <select
                    value={createForm.role}
                    onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })}
                    className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                  >
                    <option value="INSTRUCTOR">Instructor</option>
                    <option value="STUDENT">Student</option>
                    {currentUser?.role === 'SUPER_ADMIN' && <option value="INSTITUTION_ADMIN">Institution Admin</option>}
                  </select>
                </div>

                {institutions.length > 0 && (
                  <div>
                    <label className="font-bold text-[var(--text-primary)] block mb-1">Institution</label>
                    <select
                      value={createForm.institutionId}
                      onChange={(e) => setCreateForm({ ...createForm, institutionId: e.target.value })}
                      className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                    >
                      <option value="">Select Institution...</option>
                      {institutions.map((inst) => (
                        <option key={inst.id || inst._id} value={inst.id || inst._id}>
                          {inst.name} ({inst.code})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="font-bold text-[var(--text-primary)] block mb-1">Initial Password</label>
                  <input
                    type="text"
                    required
                    value={createForm.password}
                    onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                    className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                  />
                </div>

                <div className="pt-3 flex justify-end gap-2">
                  <Button type="button" variant="ghost" size="sm" onClick={() => setShowCreateModal(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary" size="sm" loading={isSubmitting}>
                    Create Account
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
