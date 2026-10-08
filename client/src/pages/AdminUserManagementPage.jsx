import React, { useState, useEffect } from 'react';
import { AppShell } from '../components/layout/AppShell';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { userService } from '../services/userService';
import { institutionService } from '../services/institutionService';
import { courseService } from '../services/courseService';
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
  Upload,
  Download,
  FileSpreadsheet,
  RefreshCw,
  School,
  AlertTriangle,
  FileText,
} from 'lucide-react';

export const AdminUserManagementPage = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [institutions, setInstitutions] = useState([]);
  const [courses, setCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Filters
  const [roleFilter, setRoleFilter] = useState('ALL'); // 'ALL' | 'INSTRUCTOR' | 'STUDENT' | 'INSTITUTION_ADMIN'
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [instFilter, setInstFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // View User Details Modal
  const [selectedUser, setSelectedUser] = useState(null);

  // Manual Add Modal States
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [showAddInstructorModal, setShowAddInstructorModal] = useState(false);

  // Student Form State
  const [studentForm, setStudentForm] = useState({
    name: '',
    email: '',
    enrollmentNumber: '',
    rollNumber: '',
    department: '',
    semester: '',
    batch: '',
    institutionId: currentUser?.institutionId || '',
    password: 'Student@123',
  });

  // Instructor Form State
  const [instructorForm, setInstructorForm] = useState({
    name: '',
    email: '',
    employeeId: '',
    department: '',
    institutionId: currentUser?.institutionId || '',
    password: 'Instructor@123',
  });

  // Bulk Import Modal State
  const [showBulkImportModal, setShowBulkImportModal] = useState(false);
  const [importRole, setImportRole] = useState('STUDENT'); // 'STUDENT' | 'INSTRUCTOR'
  const [importInstitutionId, setImportInstitutionId] = useState(currentUser?.institutionId || '');
  const [importFile, setImportFile] = useState(null);
  const [parsedRecords, setParsedRecords] = useState([]);
  const [importSummary, setImportSummary] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchDirectory = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const filters = {};
      if (roleFilter !== 'ALL') filters.role = roleFilter;
      if (statusFilter !== 'ALL') filters.status = statusFilter;
      if (instFilter !== 'ALL') filters.institutionId = instFilter;
      if (searchQuery.trim()) filters.search = searchQuery.trim();

      const [usersRes, instRes, coursesRes] = await Promise.all([
        userService.getAll(filters),
        institutionService.getAll().catch(() => ({ success: false, data: { institutions: [] } })),
        courseService.getAll().catch(() => ({ success: false, data: { courses: [] } })),
      ]);

      if (usersRes.success) {
        setUsers(usersRes.data.users);
      }
      if (instRes.success && Array.isArray(instRes.data?.institutions)) {
        setInstitutions(instRes.data.institutions);
      }
      if (coursesRes.success && Array.isArray(coursesRes.data?.courses)) {
        setCourses(coursesRes.data.courses);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch directory records.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDirectory();
  }, [roleFilter, statusFilter, instFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchDirectory();
  };

  // Toggle User Status (Active / Suspended)
  const handleToggleStatus = async (targetUser) => {
    const newStatus = targetUser.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    try {
      setError(null);
      const res = await userService.updateStatus(targetUser.id || targetUser._id, newStatus);
      if (res.success) {
        setSuccess(`Account ${targetUser.name} status updated to ${newStatus}.`);
        if (selectedUser?.id === targetUser.id || selectedUser?._id === targetUser._id) {
          setSelectedUser({ ...selectedUser, status: newStatus });
        }
        await fetchDirectory();
      }
    } catch (err) {
      setError(err.message || 'Failed to update user account status.');
    }
  };

  // Resend Welcome Email Handler
  const handleResendWelcomeEmail = async (targetUser) => {
    try {
      setIsSubmitting(true);
      setError(null);
      const res = await userService.resendWelcomeEmail(targetUser.id || targetUser._id);
      if (res.success) {
        setSuccess(`Welcome Email Sent ✓ | Email: ${targetUser.email} | Account Status: Active`);
      } else {
        setError(`Welcome Email Failed: ${res.data?.emailError || res.message || 'SMTP delivery not configured'}`);
      }
    } catch (err) {
      setError(err.message || 'Failed to resend welcome email.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Manual Add Student Submit
  const handleCreateStudent = async (e) => {
    e.preventDefault();
    if (!studentForm.name || !studentForm.email) return;

    try {
      setIsSubmitting(true);
      setError(null);
      const payload = {
        name: studentForm.name,
        email: studentForm.email,
        password: studentForm.password || 'Student@123',
        role: 'STUDENT',
        enrollmentNumber: studentForm.enrollmentNumber,
        rollNumber: studentForm.rollNumber,
        department: studentForm.department,
        semester: studentForm.semester,
        batch: studentForm.batch,
        institutionId: studentForm.institutionId || currentUser?.institutionId,
      };

      const res = await userService.create(payload);
      if (res.success) {
        const emailSent = res.data?.welcomeEmailSent;
        const emailErr = res.data?.emailError;
        setSuccess(
          emailSent
            ? `Student Created ✓ | Email: ${studentForm.email} | Email Verified: Yes | Welcome Email: Sent`
            : `Student Created ✓ | Email: ${studentForm.email} | Email Verified: Yes | Welcome Email: Failed (${emailErr || 'SMTP not configured'})`
        );
        setShowAddStudentModal(false);
        setStudentForm({
          name: '',
          email: '',
          enrollmentNumber: '',
          rollNumber: '',
          department: '',
          semester: '',
          batch: '',
          institutionId: currentUser?.institutionId || '',
          password: 'Student@123',
        });
        await fetchDirectory();
      }
    } catch (err) {
      setError(err.message || 'Failed to create student account.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Manual Add Instructor Submit
  const handleCreateInstructor = async (e) => {
    e.preventDefault();
    if (!instructorForm.name || !instructorForm.email) return;

    try {
      setIsSubmitting(true);
      setError(null);
      const payload = {
        name: instructorForm.name,
        email: instructorForm.email,
        password: instructorForm.password || 'Instructor@123',
        role: 'INSTRUCTOR',
        employeeId: instructorForm.employeeId,
        department: instructorForm.department,
        institutionId: instructorForm.institutionId || currentUser?.institutionId,
      };

      const res = await userService.create(payload);
      if (res.success) {
        const emailSent = res.data?.welcomeEmailSent;
        const emailErr = res.data?.emailError;
        setSuccess(
          emailSent
            ? `Instructor Created ✓ | Email: ${instructorForm.email} | Email Verified: Yes | Welcome Email: Sent`
            : `Instructor Created ✓ | Email: ${instructorForm.email} | Email Verified: Yes | Welcome Email: Failed (${emailErr || 'SMTP not configured'})`
        );
        setShowAddInstructorModal(false);
        setInstructorForm({
          name: '',
          email: '',
          employeeId: '',
          department: '',
          institutionId: currentUser?.institutionId || '',
          password: 'Instructor@123',
        });
        await fetchDirectory();
      }
    } catch (err) {
      setError(err.message || 'Failed to create instructor account.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper: Client-side CSV Text Parser
  const parseCSVText = (text) => {
    const lines = text.split(/\r\n|\n/).filter((l) => l.trim().length > 0);
    if (lines.length === 0) return [];

    const rawHeaders = lines[0].split(',');
    const headers = rawHeaders.map((h) => h.trim().replace(/^["']|["']$/g, ''));
    const records = [];

    for (let i = 1; i < lines.length; i++) {
      const row = lines[i];
      const values = [];
      let insideQuote = false;
      let currentVal = '';

      for (let char of row) {
        if (char === '"' || char === "'") {
          insideQuote = !insideQuote;
        } else if (char === ',' && !insideQuote) {
          values.push(currentVal.trim().replace(/^["']|["']$/g, ''));
          currentVal = '';
        } else {
          currentVal += char;
        }
      }
      values.push(currentVal.trim().replace(/^["']|["']$/g, ''));

      if (values.some((v) => v)) {
        const rec = {};
        headers.forEach((h, idx) => {
          rec[h] = values[idx] || '';
        });
        records.push(rec);
      }
    }
    return records;
  };

  // File Upload Handler
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setImportFile(file);
    const reader = new FileReader();

    reader.onload = (event) => {
      const content = event.target.result;
      const parsed = parseCSVText(content);
      setParsedRecords(parsed);
    };

    reader.readAsText(file);
  };

  // Download Sample Template CSV
  const handleDownloadTemplate = () => {
    let content = '';
    let filename = '';
    if (importRole === 'STUDENT') {
      content = 'Name,Enrollment No,Roll No,Email,Institution,Department,Semester,Batch\n';
      content += 'Rahul Sharma,EN2026001,CS001,rahul@university.edu,PIT,Computer Science,5,2023-2027\n';
      content += 'Priya Patel,EN2026002,CS002,priya@university.edu,PIT,Computer Science,5,2023-2027\n';
      filename = 'ExamForge_Student_Import_Template.csv';
    } else {
      content = 'Name,Employee ID,Email,Institution,Department\n';
      content += 'Dr. Ananya Verma,EMP1001,ananya@university.edu,PIT,Computer Science\n';
      content += 'Prof. Vikram Singh,EMP1002,vikram@university.edu,PIT,Computer Science\n';
      filename = 'ExamForge_Instructor_Import_Template.csv';
    }

    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Download Error Log CSV
  const handleDownloadErrorCSV = () => {
    if (!importSummary || !importSummary.failedRows || importSummary.failedRows.length === 0) return;

    let content = 'Row Number,Name,Email,Field,Error Reason\n';
    importSummary.failedRows.forEach((r) => {
      content += `"${r.rowNumber}","${r.name || ''}","${r.email || ''}","${r.field || ''}","${r.reason || ''}"\n`;
    });

    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `ExamForge_${importRole}_Import_Errors.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Confirm Bulk Import Submit
  const handleConfirmBulkImport = async () => {
    if (parsedRecords.length === 0) return;

    try {
      setIsSubmitting(true);
      setError(null);

      const res = await userService.bulkImport({
        records: parsedRecords,
        role: importRole,
        institutionId: importInstitutionId || currentUser?.institutionId,
      });

      if (res.success && res.data) {
        setImportSummary(res.data);
        setSuccess(`Bulk import complete: ${res.data.successCount} users imported successfully.`);
        await fetchDirectory();
      }
    } catch (err) {
      setError(err.message || 'Failed to complete bulk import.');
    } finally {
      setIsSubmitting(false);
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
    <AppShell title="User & Roster Management">
      <div className="space-y-6 pb-12">
        {/* Top Header Card */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[var(--surface)] p-6 rounded-2xl border border-[var(--border)] shadow-xs">
          <div>
            <h1 className="text-xl font-bold text-[var(--text-primary)]">User & Roster Directory</h1>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              Manage instructors and students account provisioning with manual entry and bulk CSV/XLSX imports.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              icon={Upload}
              onClick={() => {
                setImportSummary(null);
                setImportFile(null);
                setParsedRecords([]);
                setShowBulkImportModal(true);
              }}
            >
              Bulk Import
            </Button>

            {roleFilter === 'STUDENT' ? (
              <Button variant="primary" size="sm" icon={UserPlus} onClick={() => setShowAddStudentModal(true)}>
                + Add Student
              </Button>
            ) : roleFilter === 'INSTRUCTOR' ? (
              <Button variant="primary" size="sm" icon={UserPlus} onClick={() => setShowAddInstructorModal(true)}>
                + Add Instructor
              </Button>
            ) : (
              <>
                <Button variant="primary" size="sm" icon={UserPlus} onClick={() => setShowAddStudentModal(true)}>
                  + Add Student
                </Button>
                <Button variant="secondary" size="sm" icon={UserPlus} onClick={() => setShowAddInstructorModal(true)}>
                  + Add Instructor
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Global Feedback Banners */}
        {success && (
          <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 rounded-xl text-xs font-semibold flex items-center justify-between animate-fadeIn">
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
          <div className="p-3.5 bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 rounded-xl text-xs font-semibold flex items-center justify-between animate-fadeIn">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              <span>{error}</span>
            </div>
            <button onClick={() => setError(null)} className="cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Directory Filters & Role Tabs */}
        <div className="bg-[var(--surface)] p-4 rounded-2xl border border-[var(--border)] space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border-subtle)] pb-3">
            <div className="flex items-center gap-1.5 overflow-x-auto">
              {['ALL', 'STUDENT', 'INSTRUCTOR', 'INSTITUTION_ADMIN'].map((r) => (
                <button
                  key={r}
                  onClick={() => setRoleFilter(r)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    roleFilter === r
                      ? 'bg-[var(--primary)] text-white shadow-xs'
                      : 'bg-[var(--surface-muted)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  {r === 'ALL'
                    ? 'All Directory'
                    : r === 'STUDENT'
                    ? 'Students'
                    : r === 'INSTRUCTOR'
                    ? 'Instructors'
                    : 'Admins'}
                </button>
              ))}
            </div>

            <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 w-full md:w-80">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-[var(--text-muted)]" />
                <input
                  type="text"
                  placeholder="Search name, email, roll no, emp ID..."
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

        {/* Directory Table */}
        <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] overflow-hidden shadow-xs">
          {isLoading ? (
            <div className="p-12 text-center text-xs text-[var(--text-secondary)] flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-[var(--primary)]" />
              <span>Loading user directory...</span>
            </div>
          ) : users.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <Users className="w-8 h-8 text-[var(--text-muted)] mx-auto" />
              <h3 className="text-sm font-bold text-[var(--text-primary)]">No Users Found</h3>
              <p className="text-xs text-[var(--text-secondary)]">
                No matching student or instructor accounts found. Use "+ Add Student" or "Bulk Import" to populate accounts.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[var(--surface-muted)] text-[var(--text-secondary)] font-semibold border-b border-[var(--border-subtle)] uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-4">User Info</th>
                    <th className="py-3 px-4">IDs & Attributes</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">Institution & Dept</th>
                    <th className="py-3 px-4">Course Assignments</th>
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
                            <span className="font-bold block text-[var(--text-primary)]">{u.name}</span>
                            <span className="text-[11px] text-[var(--text-secondary)]">{u.email}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          {u.role === 'STUDENT' ? (
                            <div className="text-[11px] space-y-0.5">
                              {u.enrollmentNumber && <span className="block font-semibold">Enroll: {u.enrollmentNumber}</span>}
                              {u.rollNumber && <span className="block text-[var(--text-secondary)]">Roll: {u.rollNumber}</span>}
                              {u.semester && <span className="block text-[var(--text-muted)]">Sem {u.semester} ({u.batch || 'General'})</span>}
                              {!u.enrollmentNumber && !u.rollNumber && <span className="text-[var(--text-muted)]">—</span>}
                            </div>
                          ) : u.role === 'INSTRUCTOR' ? (
                            <div className="text-[11px]">
                              {u.employeeId ? (
                                <span className="font-semibold block">Emp ID: {u.employeeId}</span>
                              ) : (
                                <span className="text-[var(--text-muted)]">—</span>
                              )}
                            </div>
                          ) : (
                            <span className="text-[var(--text-muted)]">—</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant={getRoleBadgeVariant(u.role)}>{u.role.replace('_', ' ')}</Badge>
                        </td>
                        <td className="py-3 px-4 text-[var(--text-secondary)] font-medium">
                          <span className="block font-bold text-[var(--text-primary)]">
                            {u.institutionId?.name ? `${u.institutionId.name} (${u.institutionId.code})` : 'Global / Unassigned'}
                          </span>
                          {u.department && <span className="text-[11px] text-[var(--text-secondary)] block">{u.department}</span>}
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

        {/* MODAL 1: VIEW USER DETAILS */}
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
                    <span className="text-[var(--text-secondary)] block">Role</span>
                    <span className="font-bold text-[var(--text-primary)]">{selectedUser.role}</span>
                  </div>
                  <div>
                    <span className="text-[var(--text-secondary)] block">Account Status</span>
                    <span className="font-bold text-[var(--text-primary)]">{selectedUser.status}</span>
                  </div>
                  {selectedUser.enrollmentNumber && (
                    <div>
                      <span className="text-[var(--text-secondary)] block">Enrollment No</span>
                      <span className="font-bold text-[var(--text-primary)]">{selectedUser.enrollmentNumber}</span>
                    </div>
                  )}
                  {selectedUser.rollNumber && (
                    <div>
                      <span className="text-[var(--text-secondary)] block">Roll No</span>
                      <span className="font-bold text-[var(--text-primary)]">{selectedUser.rollNumber}</span>
                    </div>
                  )}
                  {selectedUser.employeeId && (
                    <div>
                      <span className="text-[var(--text-secondary)] block">Employee ID</span>
                      <span className="font-bold text-[var(--text-primary)]">{selectedUser.employeeId}</span>
                    </div>
                  )}
                  {selectedUser.department && (
                    <div>
                      <span className="text-[var(--text-secondary)] block">Department</span>
                      <span className="font-bold text-[var(--text-primary)]">{selectedUser.department}</span>
                    </div>
                  )}
                  {selectedUser.semester && (
                    <div>
                      <span className="text-[var(--text-secondary)] block">Semester / Batch</span>
                      <span className="font-bold text-[var(--text-primary)]">
                        Sem {selectedUser.semester} ({selectedUser.batch || 'N/A'})
                      </span>
                    </div>
                  )}
                  <div className="col-span-2">
                    <span className="text-[var(--text-secondary)] block">Institution</span>
                    <span className="font-bold text-[var(--text-primary)]">
                      {selectedUser.institutionId?.name ? `${selectedUser.institutionId.name} (${selectedUser.institutionId.code})` : 'Global / Unassigned'}
                    </span>
                  </div>
                  <div className="col-span-2 flex items-center justify-between p-3 bg-[var(--surface-muted)] rounded-xl border border-[var(--border-subtle)] mt-1">
                    <div>
                      <span className="text-[var(--text-secondary)] block font-semibold">Email Verification</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Verified (Admin Provisioned)
                      </span>
                    </div>
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={isSubmitting}
                      onClick={() => handleResendWelcomeEmail(selectedUser)}
                    >
                      Resend Welcome Email
                    </Button>
                  </div>
                </div>

                {selectedUser.role === 'INSTRUCTOR' && (
                  <div className="space-y-3">
                    <h4 className="font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                      <BookOpen className="w-4 h-4 text-[var(--primary)]" />
                      Assigned Academic Courses ({selectedUser.assignedCourses?.length || 0})
                    </h4>
                    {!selectedUser.assignedCourses || selectedUser.assignedCourses.length === 0 ? (
                      <p className="text-[11px] text-[var(--text-muted)] italic">No courses currently assigned.</p>
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

        {/* MODAL 2: MANUAL ADD STUDENT */}
        {showAddStudentModal && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-2xl p-6 max-w-lg w-full space-y-5 animate-fadeIn max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
                <div className="flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-[var(--primary)]" />
                  <h3 className="text-base font-bold text-[var(--text-primary)]">Add Student Account</h3>
                </div>
                <button onClick={() => setShowAddStudentModal(false)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateStudent} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-[var(--text-primary)] block mb-1">Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Rahul Sharma"
                      value={studentForm.name}
                      onChange={(e) => setStudentForm({ ...studentForm, name: e.target.value })}
                      className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-[var(--text-primary)] block mb-1">College Email Address *</label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. rahul@university.edu"
                      value={studentForm.email}
                      onChange={(e) => setStudentForm({ ...studentForm, email: e.target.value })}
                      className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-[var(--text-primary)] block mb-1">Enrollment Number</label>
                    <input
                      type="text"
                      placeholder="e.g. EN2026001"
                      value={studentForm.enrollmentNumber}
                      onChange={(e) => setStudentForm({ ...studentForm, enrollmentNumber: e.target.value })}
                      className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-[var(--text-primary)] block mb-1">Roll Number</label>
                    <input
                      type="text"
                      placeholder="e.g. CS001"
                      value={studentForm.rollNumber}
                      onChange={(e) => setStudentForm({ ...studentForm, rollNumber: e.target.value })}
                      className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="font-bold text-[var(--text-primary)] block mb-1">Department</label>
                    <input
                      type="text"
                      placeholder="e.g. Computer Science"
                      value={studentForm.department}
                      onChange={(e) => setStudentForm({ ...studentForm, department: e.target.value })}
                      className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-[var(--text-primary)] block mb-1">Semester</label>
                    <input
                      type="text"
                      placeholder="e.g. 5"
                      value={studentForm.semester}
                      onChange={(e) => setStudentForm({ ...studentForm, semester: e.target.value })}
                      className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-[var(--text-primary)] block mb-1">Batch</label>
                    <input
                      type="text"
                      placeholder="e.g. 2023-2027"
                      value={studentForm.batch}
                      onChange={(e) => setStudentForm({ ...studentForm, batch: e.target.value })}
                      className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                    />
                  </div>
                </div>

                {institutions.length > 0 && (
                  <div>
                    <label className="font-bold text-[var(--text-primary)] block mb-1">Institution</label>
                    <select
                      value={studentForm.institutionId}
                      onChange={(e) => setStudentForm({ ...studentForm, institutionId: e.target.value })}
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
                  <label className="font-bold text-[var(--text-primary)] block mb-1">Temporary Initial Password</label>
                  <input
                    type="text"
                    required
                    value={studentForm.password}
                    onChange={(e) => setStudentForm({ ...studentForm, password: e.target.value })}
                    className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                  />
                </div>

                <div className="pt-3 flex justify-end gap-2 border-t border-[var(--border-subtle)]">
                  <Button type="button" variant="ghost" size="sm" onClick={() => setShowAddStudentModal(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary" size="sm" loading={isSubmitting}>
                    Create Student Account
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL 3: MANUAL ADD INSTRUCTOR */}
        {showAddInstructorModal && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-2xl p-6 max-w-lg w-full space-y-5 animate-fadeIn max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
                <div className="flex items-center gap-2">
                  <School className="w-5 h-5 text-[var(--primary)]" />
                  <h3 className="text-base font-bold text-[var(--text-primary)]">Add Instructor Account</h3>
                </div>
                <button onClick={() => setShowAddInstructorModal(false)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateInstructor} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-[var(--text-primary)] block mb-1">Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Dr. Ananya Verma"
                      value={instructorForm.name}
                      onChange={(e) => setInstructorForm({ ...instructorForm, name: e.target.value })}
                      className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-[var(--text-primary)] block mb-1">College Email Address *</label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. ananya@university.edu"
                      value={instructorForm.email}
                      onChange={(e) => setInstructorForm({ ...instructorForm, email: e.target.value })}
                      className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-[var(--text-primary)] block mb-1">Employee ID</label>
                    <input
                      type="text"
                      placeholder="e.g. EMP1001"
                      value={instructorForm.employeeId}
                      onChange={(e) => setInstructorForm({ ...instructorForm, employeeId: e.target.value })}
                      className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-[var(--text-primary)] block mb-1">Department</label>
                    <input
                      type="text"
                      placeholder="e.g. Computer Science"
                      value={instructorForm.department}
                      onChange={(e) => setInstructorForm({ ...instructorForm, department: e.target.value })}
                      className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                    />
                  </div>
                </div>

                {institutions.length > 0 && (
                  <div>
                    <label className="font-bold text-[var(--text-primary)] block mb-1">Institution</label>
                    <select
                      value={instructorForm.institutionId}
                      onChange={(e) => setInstructorForm({ ...instructorForm, institutionId: e.target.value })}
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
                  <label className="font-bold text-[var(--text-primary)] block mb-1">Temporary Initial Password</label>
                  <input
                    type="text"
                    required
                    value={instructorForm.password}
                    onChange={(e) => setInstructorForm({ ...instructorForm, password: e.target.value })}
                    className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                  />
                </div>

                <div className="pt-3 flex justify-end gap-2 border-t border-[var(--border-subtle)]">
                  <Button type="button" variant="ghost" size="sm" onClick={() => setShowAddInstructorModal(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary" size="sm" loading={isSubmitting}>
                    Create Instructor Account
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL 4: BULK IMPORT (CSV/XLSX) */}
        {showBulkImportModal && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-2xl p-6 max-w-2xl w-full space-y-5 animate-fadeIn max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-[var(--primary)]" />
                  <h3 className="text-base font-bold text-[var(--text-primary)]">Bulk Import Roster (CSV / XLSX)</h3>
                </div>
                <button onClick={() => setShowBulkImportModal(false)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {!importSummary ? (
                <div className="space-y-4 text-xs">
                  {/* Controls: Target Role, Institution, Download Template */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-[var(--background)] rounded-xl border border-[var(--border-subtle)]">
                    <div>
                      <label className="font-bold text-[var(--text-primary)] block mb-1">Target Account Role</label>
                      <select
                        value={importRole}
                        onChange={(e) => setImportRole(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-[var(--surface)] border border-[var(--border)] rounded-lg text-xs font-medium text-[var(--text-primary)]"
                      >
                        <option value="STUDENT">Students Roster</option>
                        <option value="INSTRUCTOR">Instructors Roster</option>
                      </select>
                    </div>

                    {institutions.length > 0 && (
                      <div>
                        <label className="font-bold text-[var(--text-primary)] block mb-1">Institution</label>
                        <select
                          value={importInstitutionId}
                          onChange={(e) => setImportInstitutionId(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-[var(--surface)] border border-[var(--border)] rounded-lg text-xs font-medium text-[var(--text-primary)]"
                        >
                          <option value="">Default Institution...</option>
                          {institutions.map((inst) => (
                            <option key={inst.id || inst._id} value={inst.id || inst._id}>
                              {inst.name} ({inst.code})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    <div className="flex items-end">
                      <Button variant="outline" size="sm" icon={Download} onClick={handleDownloadTemplate} className="w-full justify-center">
                        Download Template
                      </Button>
                    </div>
                  </div>

                  {/* File Upload Box */}
                  <div className="p-6 border-2 border-dashed border-[var(--border)] hover:border-[var(--primary)] rounded-2xl text-center space-y-2 bg-[var(--background)]/50 transition-colors">
                    <Upload className="w-8 h-8 text-[var(--text-muted)] mx-auto" />
                    <div>
                      <label htmlFor="csv-file-upload" className="font-bold text-[var(--primary)] hover:underline cursor-pointer">
                        Click to upload CSV or XLSX file
                      </label>
                      <input
                        id="csv-file-upload"
                        type="file"
                        accept=".csv,.xlsx,.xls,.txt"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </div>
                    <p className="text-[11px] text-[var(--text-secondary)]">
                      Supported formats: .csv, .xlsx. Max file size: 10MB.
                    </p>
                    {importFile && (
                      <div className="pt-2">
                        <Badge variant="primary">Uploaded: {importFile.name} ({parsedRecords.length} Rows Parsed)</Badge>
                      </div>
                    )}
                  </div>

                  {/* Live Preview Table */}
                  {parsedRecords.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-[var(--text-primary)]">Preview Uploaded Roster ({parsedRecords.length} Rows)</h4>
                        <span className="text-[11px] text-[var(--text-secondary)]">Showing first 10 rows</span>
                      </div>
                      <div className="overflow-x-auto border border-[var(--border)] rounded-xl">
                        <table className="w-full text-left text-[11px]">
                          <thead className="bg-[var(--surface-muted)] text-[var(--text-secondary)] font-semibold border-b border-[var(--border-subtle)] uppercase">
                            <tr>
                              <th className="py-2 px-3">#</th>
                              <th className="py-2 px-3">Name</th>
                              <th className="py-2 px-3">Email</th>
                              <th className="py-2 px-3">{importRole === 'STUDENT' ? 'Enrollment No' : 'Employee ID'}</th>
                              <th className="py-2 px-3">Dept</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[var(--border-subtle)]">
                            {parsedRecords.slice(0, 10).map((r, idx) => (
                              <tr key={idx} className="hover:bg-[var(--surface-muted)]/50">
                                <td className="py-2 px-3 font-semibold">{idx + 1}</td>
                                <td className="py-2 px-3 font-bold">{r.Name || r['Full Name'] || r.name || '—'}</td>
                                <td className="py-2 px-3 text-[var(--text-secondary)]">{r.Email || r['College Email'] || r.email || '—'}</td>
                                <td className="py-2 px-3 font-semibold">
                                  {importRole === 'STUDENT'
                                    ? r['Enrollment No'] || r.enrollmentNumber || '—'
                                    : r['Employee ID'] || r.employeeId || '—'}
                                </td>
                                <td className="py-2 px-3">{r.Department || r.department || '—'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="pt-3 flex justify-end gap-2 border-t border-[var(--border-subtle)]">
                    <Button type="button" variant="ghost" size="sm" onClick={() => setShowBulkImportModal(false)}>
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      disabled={parsedRecords.length === 0}
                      loading={isSubmitting}
                      onClick={handleConfirmBulkImport}
                    >
                      Confirm & Import {parsedRecords.length > 0 ? `(${parsedRecords.length} Records)` : ''}
                    </Button>
                  </div>
                </div>
              ) : (
                /* IMPORT SUMMARY RESULT VIEW */
                <div className="space-y-4 text-xs">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                    <div className="p-3 bg-[var(--background)] rounded-xl border border-[var(--border)]">
                      <span className="text-[10px] uppercase font-bold text-[var(--text-secondary)]">Total Rows</span>
                      <span className="block text-xl font-black text-[var(--text-primary)]">{importSummary.totalRows}</span>
                    </div>
                    <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                      <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400">Imported</span>
                      <span className="block text-xl font-black text-emerald-600 dark:text-emerald-400">{importSummary.successCount}</span>
                    </div>
                    <div className="p-3 bg-amber-500/10 rounded-xl border border-amber-500/20">
                      <span className="text-[10px] uppercase font-bold text-amber-600 dark:text-amber-400">Duplicates</span>
                      <span className="block text-xl font-black text-amber-600 dark:text-amber-400">{importSummary.duplicateCount}</span>
                    </div>
                    <div className="p-3 bg-red-500/10 rounded-xl border border-red-500/20">
                      <span className="text-[10px] uppercase font-bold text-red-600 dark:text-red-400">Failed</span>
                      <span className="block text-xl font-black text-red-600 dark:text-red-400">{importSummary.failedCount}</span>
                    </div>
                  </div>

                  {importSummary.failedRows && importSummary.failedRows.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-red-600 dark:text-red-400 flex items-center gap-1.5">
                          <AlertTriangle className="w-4 h-4" />
                          Failed / Skipped Import Rows ({importSummary.failedRows.length})
                        </h4>
                        <Button variant="outline" size="xs" icon={Download} onClick={handleDownloadErrorCSV}>
                          Download Error CSV
                        </Button>
                      </div>

                      <div className="overflow-x-auto border border-red-500/20 rounded-xl max-h-48">
                        <table className="w-full text-left text-[11px]">
                          <thead className="bg-red-500/10 text-red-700 dark:text-red-300 font-semibold uppercase">
                            <tr>
                              <th className="py-2 px-3">Row #</th>
                              <th className="py-2 px-3">Name</th>
                              <th className="py-2 px-3">Email</th>
                              <th className="py-2 px-3">Field</th>
                              <th className="py-2 px-3">Reason</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-red-500/10">
                            {importSummary.failedRows.map((r, idx) => (
                              <tr key={idx} className="hover:bg-red-500/5">
                                <td className="py-2 px-3 font-bold">{r.rowNumber}</td>
                                <td className="py-2 px-3 font-semibold">{r.name}</td>
                                <td className="py-2 px-3 text-[var(--text-secondary)]">{r.email}</td>
                                <td className="py-2 px-3 font-bold text-red-600">{r.field}</td>
                                <td className="py-2 px-3 text-red-600 dark:text-red-400 font-medium">{r.reason}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  <div className="pt-3 flex justify-end gap-2 border-t border-[var(--border-subtle)]">
                    <Button type="button" variant="primary" size="sm" onClick={() => setShowBulkImportModal(false)}>
                      Close Summary
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
};
