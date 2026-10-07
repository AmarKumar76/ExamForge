import React, { useState, useEffect, useCallback } from 'react';
import { AppShell } from '../components/layout/AppShell';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { adminService } from '../services/adminService';
import { useAuth } from '../context/AuthContext';
import {
  ShieldCheck,
  Layers,
  Search,
  RefreshCw,
  AlertCircle,
  X,
  ChevronLeft,
  ChevronRight,
  Clock,
  User,
  Shield,
  Briefcase,
  FileText,
  Terminal,
  Calendar,
  Filter,
  Info,
  CheckCircle2,
  XCircle,
  AlertTriangle,
} from 'lucide-react';

const COMMON_AUDIT_ACTIONS = [
  'LOGIN_SUCCESS',
  'LOGIN_FAILED',
  'LOGOUT',
  'PASSWORD_CHANGED',
  'ACCOUNT_CREATED',
  'ACCOUNT_STATUS_CHANGED',
  'INSTITUTION_CREATED',
  'INSTITUTION_UPDATED',
  'INSTITUTION_ARCHIVED',
  'COURSE_CREATED',
  'COURSE_UPDATED',
  'COURSE_ARCHIVED',
  'INSTRUCTOR_ASSIGNED',
  'INSTRUCTOR_REMOVED',
  'STUDENT_ENROLLED',
  'STUDENT_REMOVED',
  'MATERIAL_UPLOADED',
  'MATERIAL_PROCESSING_STARTED',
  'MATERIAL_PROCESSING_COMPLETED',
  'MATERIAL_PROCESSING_FAILED',
  'MATERIAL_ARCHIVED',
  'MATERIAL_DELETED',
  'QUESTION_CREATED',
  'QUESTION_UPDATED',
  'QUESTION_APPROVED',
  'QUESTION_REJECTED',
  'QUESTION_DELETED',
  'QUESTION_MOVED_TO_FOLDER',
  'AI_GENERATION_STARTED',
  'AI_GENERATION_COMPLETED',
  'AI_GENERATION_FAILED',
  'EXAM_CREATED',
  'EXAM_UPDATED',
  'EXAM_PUBLISHED',
  'EXAM_CANCELLED',
  'EXAM_STARTED',
  'EXAM_SUBMITTED',
  'RESULT_GRADED',
  'RESULT_PUBLISHED',
  'UNAUTHORIZED_ACCESS',
  'FORBIDDEN_RESOURCE_ACCESS',
  'INVALID_RESOURCE_REQUEST',
];

const SYSTEM_SERVICES = ['API', 'DATABASE', 'RAG', 'GEMINI', 'AUTH', 'STORAGE', 'NOTIFICATION'];
const SYSTEM_SEVERITIES = ['INFO', 'WARNING', 'ERROR', 'CRITICAL'];

export const AdminLogsPage = () => {
  const { user: currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('audit'); // 'audit' | 'system'

  // Counts from MongoDB
  const [counts, setCounts] = useState({ auditCount: 0, systemCount: 0 });

  // List states
  const [auditLogs, setAuditLogs] = useState([]);
  const [systemLogs, setSystemLogs] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 25, totalPages: 1, total: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Selected Log for Modal
  const [selectedLog, setSelectedLog] = useState(null);

  // Audit Filters
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // System Filters
  const [severityFilter, setSeverityFilter] = useState('');
  const [serviceFilter, setServiceFilter] = useState('');

  // Page state
  const [page, setPage] = useState(1);

  // Fetch real counts from MongoDB
  const fetchCounts = useCallback(async () => {
    try {
      const res = await adminService.getLogCounts();
      if (res.success && res.data) {
        setCounts({
          auditCount: res.data.auditCount || 0,
          systemCount: res.data.systemCount || 0,
        });
      }
    } catch (err) {
      console.error('Failed to fetch log counts:', err);
    }
  }, []);

  // Fetch log records from MongoDB
  const fetchLogs = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (activeTab === 'audit') {
        const res = await adminService.getAuditLogs({
          search,
          role: roleFilter,
          action: actionFilter,
          status: statusFilter,
          startDate,
          endDate,
          page,
          limit: 25,
        });
        if (res.success && res.data) {
          setAuditLogs(res.data.logs || []);
          if (res.data.pagination) {
            setPagination(res.data.pagination);
          }
        }
      } else {
        const res = await adminService.getSystemLogs({
          search,
          level: severityFilter,
          service: serviceFilter,
          startDate,
          endDate,
          page,
          limit: 25,
        });
        if (res.success && res.data) {
          setSystemLogs(res.data.logs || []);
          if (res.data.pagination) {
            setPagination(res.data.pagination);
          }
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch logs data.');
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, search, roleFilter, actionFilter, statusFilter, severityFilter, serviceFilter, startDate, endDate, page]);

  // Refresh everything
  const handleRefresh = () => {
    fetchCounts();
    fetchLogs();
  };

  useEffect(() => {
    fetchCounts();
  }, [fetchCounts]);

  useEffect(() => {
    setPage(1);
  }, [activeTab, search, roleFilter, actionFilter, statusFilter, severityFilter, serviceFilter, startDate, endDate]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Action badge style helper
  const getActionBadgeVariant = (action = '') => {
    if (action.startsWith('LOGIN') || action.startsWith('ACCOUNT')) return 'success';
    if (action.startsWith('COURSE') || action.startsWith('INSTITUTION')) return 'primary';
    if (action.startsWith('MATERIAL')) return 'secondary';
    if (action.startsWith('AI') || action.startsWith('QUESTION')) return 'warning';
    if (action.startsWith('EXAM') || action.startsWith('RESULT')) return 'dark';
    if (action.includes('FAILED') || action.includes('UNAUTHORIZED') || action.includes('FORBIDDEN') || action.includes('REJECTED'))
      return 'danger';
    return 'neutral';
  };

  // Severity badge style helper
  const getSeverityBadgeVariant = (severity = '') => {
    switch (severity.toUpperCase()) {
      case 'CRITICAL':
      case 'ERROR':
        return 'danger';
      case 'WARNING':
      case 'WARN':
        return 'warning';
      case 'INFO':
      default:
        return 'primary';
    }
  };

  const resetFilters = () => {
    setSearch('');
    setRoleFilter('');
    setActionFilter('');
    setStatusFilter('');
    setSeverityFilter('');
    setServiceFilter('');
    setStartDate('');
    setEndDate('');
    setPage(1);
  };

  return (
    <AppShell title="Audit & System Logs">
      <div className="space-y-6 pb-12">
        {/* Header & Tabs */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[var(--surface)] p-6 rounded-2xl border border-[var(--border)] shadow-xs">
          <div>
            <h1 className="text-xl font-bold text-[var(--text-primary)]">Audit & System Logs</h1>
            <p className="text-xs text-[var(--text-secondary)] mt-1">
              Track administrative actions, academic operations, security events and technical system events.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex p-1 bg-[var(--surface-muted)] rounded-xl border border-[var(--border-subtle)]">
              <button
                onClick={() => {
                  setActiveTab('audit');
                  setSelectedLog(null);
                }}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                  activeTab === 'audit'
                    ? 'bg-[var(--surface)] text-[var(--primary)] shadow-xs'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Audit Trail ({counts.auditCount})</span>
              </button>
              <button
                onClick={() => {
                  setActiveTab('system');
                  setSelectedLog(null);
                }}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                  activeTab === 'system'
                    ? 'bg-[var(--surface)] text-[var(--primary)] shadow-xs'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>System Events ({counts.systemCount})</span>
              </button>
            </div>

            <button
              onClick={handleRefresh}
              className="p-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-muted)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
              title="Refresh logs"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 rounded-2xl text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Filter Controls */}
        <div className="bg-[var(--surface)] p-5 rounded-2xl border border-[var(--border)] space-y-4 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[260px]">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-[var(--text-muted)]" />
              <input
                type="text"
                placeholder={activeTab === 'audit' ? 'Search actor, action, resource...' : 'Search message, event, module...'}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-8 py-2 bg-[var(--background)] border border-[var(--border)] rounded-xl text-xs text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-2.5 top-2.5 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Common Date Range Filters */}
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-3 py-1.5 bg-[var(--background)] border border-[var(--border)] rounded-xl text-xs text-[var(--text-primary)]"
                title="Start Date"
              />
              <span className="text-xs text-[var(--text-muted)]">to</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-3 py-1.5 bg-[var(--background)] border border-[var(--border)] rounded-xl text-xs text-[var(--text-primary)]"
                title="End Date"
              />
            </div>
          </div>

          {/* Tab Specific Filter Dropdowns */}
          <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-[var(--border-subtle)] text-xs">
            <span className="font-bold text-[var(--text-secondary)] flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5" /> Filters:
            </span>

            {activeTab === 'audit' ? (
              <>
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="px-3 py-1.5 bg-[var(--background)] border border-[var(--border)] rounded-xl text-xs text-[var(--text-primary)] font-medium"
                >
                  <option value="">Role ▼</option>
                  <option value="SUPER_ADMIN">Super Admin</option>
                  <option value="INSTITUTION_ADMIN">Institution Admin</option>
                  <option value="INSTRUCTOR">Instructor</option>
                  <option value="STUDENT">Student</option>
                </select>

                <select
                  value={actionFilter}
                  onChange={(e) => setActionFilter(e.target.value)}
                  className="px-3 py-1.5 bg-[var(--background)] border border-[var(--border)] rounded-xl text-xs text-[var(--text-primary)] font-medium max-w-[200px]"
                >
                  <option value="">Action ▼</option>
                  {COMMON_AUDIT_ACTIONS.map((act) => (
                    <option key={act} value={act}>
                      {act}
                    </option>
                  ))}
                </select>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-1.5 bg-[var(--background)] border border-[var(--border)] rounded-xl text-xs text-[var(--text-primary)] font-medium"
                >
                  <option value="">Status ▼</option>
                  <option value="SUCCESS">SUCCESS</option>
                  <option value="FAILED">FAILED</option>
                </select>
              </>
            ) : (
              <>
                <select
                  value={severityFilter}
                  onChange={(e) => setSeverityFilter(e.target.value)}
                  className="px-3 py-1.5 bg-[var(--background)] border border-[var(--border)] rounded-xl text-xs text-[var(--text-primary)] font-medium"
                >
                  <option value="">Severity ▼</option>
                  {SYSTEM_SEVERITIES.map((sev) => (
                    <option key={sev} value={sev}>
                      {sev}
                    </option>
                  ))}
                </select>

                <select
                  value={serviceFilter}
                  onChange={(e) => setServiceFilter(e.target.value)}
                  className="px-3 py-1.5 bg-[var(--background)] border border-[var(--border)] rounded-xl text-xs text-[var(--text-primary)] font-medium"
                >
                  <option value="">Service ▼</option>
                  {SYSTEM_SERVICES.map((srv) => (
                    <option key={srv} value={srv}>
                      {srv}
                    </option>
                  ))}
                </select>
              </>
            )}

            {(search || roleFilter || actionFilter || statusFilter || severityFilter || serviceFilter || startDate || endDate) && (
              <button
                onClick={resetFilters}
                className="px-3 py-1.5 text-xs text-red-500 hover:text-red-600 font-semibold cursor-pointer underline ml-auto"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>

        {/* AUDIT LOGS TABLE */}
        {activeTab === 'audit' && (
          <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] overflow-hidden shadow-xs">
            {isLoading ? (
              <div className="p-12 text-center text-xs text-[var(--text-secondary)] flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-[var(--primary)]" />
                <span>Loading audit trail records from MongoDB...</span>
              </div>
            ) : auditLogs.length === 0 ? (
              <div className="p-16 text-center space-y-3">
                <ShieldCheck className="w-10 h-10 text-[var(--text-muted)] mx-auto opacity-50" />
                <h3 className="text-base font-bold text-[var(--text-primary)]">No Audit Logs Found</h3>
                <p className="text-xs text-[var(--text-secondary)] max-w-sm mx-auto">
                  No immutable audit trail records matched your filter criteria. Real operations performed in ExamForge will be automatically recorded here.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-[var(--surface-muted)] text-[var(--text-secondary)] font-bold border-b border-[var(--border-subtle)] uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-3.5 px-4 whitespace-nowrap">Time</th>
                      <th className="py-3.5 px-4">Actor</th>
                      <th className="py-3.5 px-4">Role</th>
                      <th className="py-3.5 px-4">Action</th>
                      <th className="py-3.5 px-4">Resource</th>
                      <th className="py-3.5 px-4 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-subtle)] text-[var(--text-primary)]">
                    {auditLogs.map((log) => (
                      <tr
                        key={log.id || log._id}
                        onClick={() => setSelectedLog(log)}
                        className="hover:bg-[var(--surface-muted)]/60 transition-colors cursor-pointer group"
                      >
                        <td className="py-3.5 px-4 text-[var(--text-secondary)] font-mono text-[11px] whitespace-nowrap">
                          {new Date(log.timestamp || log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          <span className="block text-[10px] text-[var(--text-muted)]">
                            {new Date(log.timestamp || log.createdAt).toLocaleDateString()}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-bold text-[var(--text-primary)] group-hover:text-[var(--primary)] transition-colors">
                          {log.actorName || 'System'}
                          {log.ipAddress && (
                            <span className="block text-[10px] font-normal text-[var(--text-muted)] font-mono">
                              {log.ipAddress}
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="inline-block px-2 py-0.5 text-[10px] font-bold rounded-md bg-[var(--surface-muted)] text-[var(--text-secondary)] border border-[var(--border-subtle)]">
                            {log.actorRole || 'N/A'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <Badge variant={getActionBadgeVariant(log.action)} className="font-mono text-[10px] uppercase">
                            {log.action}
                          </Badge>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-semibold block text-[var(--text-primary)]">
                            {log.resourceName || log.resourceType || 'N/A'}
                          </span>
                          <span className="text-[10px] text-[var(--text-secondary)] font-mono">
                            {log.resourceType} {log.resourceId ? `(#${String(log.resourceId).slice(-6)})` : ''}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <Badge variant={log.status === 'SUCCESS' ? 'success' : 'danger'}>{log.status || 'SUCCESS'}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* SYSTEM LOGS TABLE */}
        {activeTab === 'system' && (
          <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] overflow-hidden shadow-xs">
            {isLoading ? (
              <div className="p-12 text-center text-xs text-[var(--text-secondary)] flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-[var(--primary)]" />
                <span>Loading system events from MongoDB...</span>
              </div>
            ) : systemLogs.length === 0 ? (
              <div className="p-16 text-center space-y-3">
                <Layers className="w-10 h-10 text-[var(--text-muted)] mx-auto opacity-50" />
                <h3 className="text-base font-bold text-[var(--text-primary)]">No System Events Logged</h3>
                <p className="text-xs text-[var(--text-secondary)] max-w-sm mx-auto">
                  Technical events, API exceptions, and database background logs will be recorded here.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-[var(--surface-muted)] text-[var(--text-secondary)] font-bold border-b border-[var(--border-subtle)] uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-3.5 px-4 whitespace-nowrap">Time</th>
                      <th className="py-3.5 px-4">Severity</th>
                      <th className="py-3.5 px-4">Service</th>
                      <th className="py-3.5 px-4">Event</th>
                      <th className="py-3.5 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-subtle)] text-[var(--text-primary)]">
                    {systemLogs.map((log) => (
                      <tr
                        key={log.id || log._id}
                        onClick={() => setSelectedLog(log)}
                        className="hover:bg-[var(--surface-muted)]/60 transition-colors cursor-pointer group"
                      >
                        <td className="py-3.5 px-4 text-[var(--text-secondary)] font-mono text-[11px] whitespace-nowrap">
                          {new Date(log.timestamp || log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          <span className="block text-[10px] text-[var(--text-muted)]">
                            {new Date(log.timestamp || log.createdAt).toLocaleDateString()}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <Badge variant={getSeverityBadgeVariant(log.level)}>{log.level || 'INFO'}</Badge>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-bold text-[var(--text-primary)] font-mono text-[11px]">
                            {log.service || log.module || 'API'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-bold block text-[var(--text-primary)] group-hover:text-[var(--primary)] transition-colors">
                            {log.event}
                          </span>
                          <span className="text-[11px] text-[var(--text-secondary)] line-clamp-1">{log.message}</span>
                        </td>
                        <td className="py-3.5 px-4">
                          <Badge variant={log.status === 'SUCCESS' ? 'success' : 'danger'}>{log.status || 'ERROR'}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* PAGINATION FOOTER */}
        {pagination.total > 0 && (
          <div className="bg-[var(--surface)] p-4 rounded-2xl border border-[var(--border)] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[var(--text-secondary)] shadow-xs">
            <div>
              Showing <span className="font-bold text-[var(--text-primary)]">{(page - 1) * pagination.limit + 1}</span> to{' '}
              <span className="font-bold text-[var(--text-primary)]">{Math.min(page * pagination.limit, pagination.total)}</span> of{' '}
              <span className="font-bold text-[var(--text-primary)]">{pagination.total}</span> logs
            </div>

            <div className="flex items-center gap-1.5">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                disabled={page <= 1 || isLoading}
                className="gap-1"
              >
                <ChevronLeft className="w-4 h-4" /> Previous
              </Button>

              {Array.from({ length: Math.min(pagination.totalPages, 5) }, (_, i) => {
                let pNum = i + 1;
                if (pagination.totalPages > 5 && page > 3) {
                  pNum = page - 2 + i;
                  if (pNum > pagination.totalPages) pNum = pagination.totalPages - (4 - i);
                }
                return (
                  <button
                    key={pNum}
                    onClick={() => setPage(pNum)}
                    className={`w-8 h-8 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      page === pNum
                        ? 'bg-[var(--primary)] text-white shadow-xs'
                        : 'hover:bg-[var(--surface-muted)] text-[var(--text-secondary)]'
                    }`}
                  >
                    {pNum}
                  </button>
                );
              })}

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPage((p) => Math.min(p + 1, pagination.totalPages))}
                disabled={page >= pagination.totalPages || isLoading}
                className="gap-1"
              >
                Next <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* EVENT DETAIL MODAL */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-[var(--surface)] border border-[var(--border)] w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-5 border-b border-[var(--border-subtle)] flex items-center justify-between bg-[var(--surface-muted)]/50">
              <div className="flex items-center gap-3">
                {activeTab === 'audit' ? (
                  <div className="p-2.5 rounded-xl bg-[var(--primary-subtle)] text-[var(--primary)] border border-[var(--primary)]/20">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                ) : (
                  <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
                    <Layers className="w-5 h-5" />
                  </div>
                )}
                <div>
                  <h3 className="text-base font-bold text-[var(--text-primary)]">
                    {activeTab === 'audit' ? selectedLog.action : selectedLog.event}
                  </h3>
                  <p className="text-xs text-[var(--text-secondary)]">
                    Event ID: <span className="font-mono">{selectedLog._id || selectedLog.id}</span>
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedLog(null)}
                className="p-2 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-muted)] cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 text-xs text-[var(--text-primary)]">
              {activeTab === 'audit' ? (
                /* AUDIT LOG DETAILS */
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-3.5 bg-[var(--background)] rounded-xl border border-[var(--border-subtle)] space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] block">
                      Actor Details
                    </span>
                    <p className="font-bold text-sm text-[var(--text-primary)]">{selectedLog.actorName || 'N/A'}</p>
                    <p className="text-[var(--text-secondary)]">Role: <span className="font-bold">{selectedLog.actorRole || 'N/A'}</span></p>
                    {selectedLog.actorId && (
                      <p className="text-[10px] font-mono text-[var(--text-muted)]">ID: {selectedLog.actorId}</p>
                    )}
                  </div>

                  <div className="p-3.5 bg-[var(--background)] rounded-xl border border-[var(--border-subtle)] space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] block">
                      Resource & Status
                    </span>
                    <p className="font-bold text-sm text-[var(--text-primary)]">{selectedLog.resourceName || selectedLog.resourceType || 'N/A'}</p>
                    <p className="text-[var(--text-secondary)]">Type: <span className="font-bold">{selectedLog.resourceType}</span></p>
                    <div className="pt-1">
                      <Badge variant={selectedLog.status === 'SUCCESS' ? 'success' : 'danger'}>
                        {selectedLog.status || 'SUCCESS'}
                      </Badge>
                    </div>
                  </div>

                  <div className="p-3.5 bg-[var(--background)] rounded-xl border border-[var(--border-subtle)] space-y-1 md:col-span-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] block">
                      Context & Timestamp
                    </span>
                    <div className="grid grid-cols-2 gap-2 pt-1 text-[var(--text-secondary)]">
                      <div>
                        Timestamp:{' '}
                        <span className="font-mono text-[var(--text-primary)] font-bold">
                          {new Date(selectedLog.timestamp || selectedLog.createdAt).toLocaleString()}
                        </span>
                      </div>
                      {selectedLog.ipAddress && (
                        <div>
                          IP Address: <span className="font-mono text-[var(--text-primary)]">{selectedLog.ipAddress}</span>
                        </div>
                      )}
                      {selectedLog.institutionId && (
                        <div>
                          Institution: <span className="font-medium text-[var(--text-primary)]">{selectedLog.institutionId.name || selectedLog.institutionId}</span>
                        </div>
                      )}
                      {selectedLog.userAgent && (
                        <div className="col-span-2 text-[10px] truncate text-[var(--text-muted)] font-mono" title={selectedLog.userAgent}>
                          User Agent: {selectedLog.userAgent}
                        </div>
                      )}
                    </div>
                  </div>

                  {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 && (
                    <div className="md:col-span-2 space-y-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] block">
                        Metadata Details
                      </span>
                      <pre className="p-3.5 bg-[var(--background)] rounded-xl border border-[var(--border-subtle)] font-mono text-[11px] text-[var(--primary)] overflow-x-auto whitespace-pre-wrap">
                        {JSON.stringify(selectedLog.metadata, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              ) : (
                /* SYSTEM LOG DETAILS */
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="p-3 bg-[var(--background)] rounded-xl border border-[var(--border-subtle)]">
                      <span className="text-[10px] font-bold uppercase text-[var(--text-muted)] block">Severity</span>
                      <Badge variant={getSeverityBadgeVariant(selectedLog.level)} className="mt-1">{selectedLog.level || 'INFO'}</Badge>
                    </div>

                    <div className="p-3 bg-[var(--background)] rounded-xl border border-[var(--border-subtle)]">
                      <span className="text-[10px] font-bold uppercase text-[var(--text-muted)] block">Service</span>
                      <span className="font-mono font-bold text-sm block mt-1">{selectedLog.service || 'API'}</span>
                    </div>

                    <div className="p-3 bg-[var(--background)] rounded-xl border border-[var(--border-subtle)]">
                      <span className="text-[10px] font-bold uppercase text-[var(--text-muted)] block">Status</span>
                      <Badge variant={selectedLog.status === 'SUCCESS' ? 'success' : 'danger'} className="mt-1">{selectedLog.status || 'ERROR'}</Badge>
                    </div>

                    <div className="p-3 bg-[var(--background)] rounded-xl border border-[var(--border-subtle)]">
                      <span className="text-[10px] font-bold uppercase text-[var(--text-muted)] block">Time</span>
                      <span className="font-mono text-[11px] font-semibold block mt-1">
                        {new Date(selectedLog.timestamp || selectedLog.createdAt).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>

                  <div className="p-3.5 bg-[var(--background)] rounded-xl border border-[var(--border-subtle)] space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] block">
                      Message / Error Statement
                    </span>
                    <p className="font-mono text-xs text-red-500 font-semibold">{selectedLog.message}</p>
                    {selectedLog.requestId && (
                      <p className="text-[10px] font-mono text-[var(--text-muted)]">Request ID: {selectedLog.requestId}</p>
                    )}
                  </div>

                  {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 && (
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] block">
                        Event Metadata
                      </span>
                      <pre className="p-3 bg-[var(--background)] rounded-xl border border-[var(--border-subtle)] font-mono text-[11px] text-[var(--primary)] overflow-x-auto whitespace-pre-wrap">
                        {JSON.stringify(selectedLog.metadata, null, 2)}
                      </pre>
                    </div>
                  )}

                  {/* STACK TRACE - Restricted to SUPER_ADMIN ONLY */}
                  {selectedLog.stackTrace && currentUser?.role === 'SUPER_ADMIN' && (
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-red-500 flex items-center gap-1">
                        <Terminal className="w-3.5 h-3.5" /> Stack Trace (Super Admin Only)
                      </span>
                      <pre className="p-4 bg-slate-950 text-red-400 rounded-xl font-mono text-[10px] leading-relaxed overflow-x-auto max-h-60 whitespace-pre">
                        {selectedLog.stackTrace}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-[var(--border-subtle)] bg-[var(--surface-muted)]/50 flex justify-end">
              <Button variant="ghost" size="sm" onClick={() => setSelectedLog(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
};
