import React, { useState, useEffect } from 'react';
import { AppShell } from '../components/layout/AppShell';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { adminService } from '../services/adminService';
import {
  Layers,
  ShieldCheck,
  Search,
  Filter,
  AlertCircle,
  RefreshCw,
  Clock,
  UserCheck,
} from 'lucide-react';

export const AdminLogsPage = () => {
  const [activeTab, setActiveTab] = useState('audit'); // 'audit' | 'system'
  const [auditLogs, setAuditLogs] = useState([]);
  const [systemLogs, setSystemLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [levelFilter, setLevelFilter] = useState('ALL');

  const fetchLogs = async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (activeTab === 'audit') {
        const res = await adminService.getAuditLogs({ search: searchQuery });
        if (res.success) setAuditLogs(res.data.logs);
      } else {
        const filters = { search: searchQuery };
        if (levelFilter !== 'ALL') filters.level = levelFilter;
        const res = await adminService.getSystemLogs(filters);
        if (res.success) setSystemLogs(res.data.logs);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch logs data.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [activeTab, levelFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchLogs();
  };

  const getLogLevelBadge = (level) => {
    switch (level) {
      case 'ERROR':
        return 'danger';
      case 'WARN':
        return 'warning';
      case 'INFO':
      default:
        return 'primary';
    }
  };

  return (
    <AppShell title="Audit & System Logs">
      <div className="space-y-6 pb-12">
        {/* Header & Tabs */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[var(--surface)] p-6 rounded-2xl border border-[var(--border)] shadow-xs">
          <div>
            <h1 className="text-xl font-bold text-[var(--text-primary)]">System Audit & Operations Log</h1>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              Comprehensive immutable tracking of administrative actions, course security events, and technical system logs.
            </p>
          </div>

          <div className="flex p-1 bg-[var(--surface-muted)] rounded-xl border border-[var(--border-subtle)] self-start md:self-auto">
            <button
              onClick={() => setActiveTab('audit')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'audit'
                  ? 'bg-[var(--surface)] text-[var(--primary)] shadow-xs'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              Audit Trail ({auditLogs.length})
            </button>
            <button
              onClick={() => setActiveTab('system')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'system'
                  ? 'bg-[var(--surface)] text-[var(--primary)] shadow-xs'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              System Events ({systemLogs.length})
            </button>
          </div>
        </div>

        {error && (
          <div className="p-3.5 bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 rounded-xl text-xs font-semibold flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Filter Controls */}
        <div className="bg-[var(--surface)] p-4 rounded-2xl border border-[var(--border)] flex flex-wrap items-center justify-between gap-3">
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 w-full md:w-80">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-[var(--text-muted)]" />
              <input
                type="text"
                placeholder={activeTab === 'audit' ? 'Search actor, action, resource...' : 'Search event, module, error message...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-[var(--background)] border border-[var(--border)] rounded-xl text-xs text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
              />
            </div>
            <Button type="submit" variant="ghost" size="sm">
              Filter
            </Button>
          </form>

          <div className="flex items-center gap-3 text-xs">
            {activeTab === 'system' && (
              <div className="flex items-center gap-2">
                <span className="font-semibold text-[var(--text-secondary)]">Log Level:</span>
                <select
                  value={levelFilter}
                  onChange={(e) => setLevelFilter(e.target.value)}
                  className="px-2.5 py-1 bg-[var(--background)] border border-[var(--border)] rounded-lg text-xs font-medium text-[var(--text-primary)]"
                >
                  <option value="ALL">All Levels</option>
                  <option value="INFO">INFO</option>
                  <option value="WARN">WARN</option>
                  <option value="ERROR">ERROR</option>
                </select>
              </div>
            )}
            <button onClick={fetchLogs} className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* AUDIT LOGS VIEW */}
        {activeTab === 'audit' && (
          <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] overflow-hidden shadow-xs">
            {isLoading ? (
              <div className="p-12 text-center text-xs text-[var(--text-secondary)]">Loading audit trail records...</div>
            ) : auditLogs.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <ShieldCheck className="w-8 h-8 text-[var(--text-muted)] mx-auto" />
                <h3 className="text-sm font-bold text-[var(--text-primary)]">No Audit Logs Found</h3>
                <p className="text-xs text-[var(--text-secondary)]">Actions taken by administrators and instructors will appear here.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[var(--surface-muted)] text-[var(--text-secondary)] font-semibold border-b border-[var(--border-subtle)] uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-3 px-4">Timestamp</th>
                      <th className="py-3 px-4">Actor</th>
                      <th className="py-3 px-4">Action</th>
                      <th className="py-3 px-4">Resource</th>
                      <th className="py-3 px-4">Institution</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-subtle)] text-[var(--text-primary)]">
                    {auditLogs.map((log) => (
                      <tr key={log.id || log._id} className="hover:bg-[var(--surface-muted)]/50 transition-colors">
                        <td className="py-3 px-4 text-[var(--text-secondary)] font-medium whitespace-nowrap">
                          {new Date(log.createdAt).toLocaleString()}
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-bold block">{log.actorName || 'User'}</span>
                          <span className="text-[10px] text-[var(--text-secondary)]">{log.actorRole}</span>
                        </td>
                        <td className="py-3 px-4 font-bold text-[var(--primary)]">{log.action}</td>
                        <td className="py-3 px-4 text-[var(--text-secondary)] font-mono text-[11px]">
                          {log.resourceType} {log.resourceId ? `(${log.resourceId.substring(0, 8)}...)` : ''}
                        </td>
                        <td className="py-3 px-4 text-[var(--text-secondary)] font-medium">
                          {log.institutionId?.name || 'Global'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* SYSTEM LOGS VIEW */}
        {activeTab === 'system' && (
          <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] overflow-hidden shadow-xs">
            {isLoading ? (
              <div className="p-12 text-center text-xs text-[var(--text-secondary)]">Loading system operation events...</div>
            ) : systemLogs.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <Layers className="w-8 h-8 text-[var(--text-muted)] mx-auto" />
                <h3 className="text-sm font-bold text-[var(--text-primary)]">No System Events Logged</h3>
                <p className="text-xs text-[var(--text-secondary)]">Technical system events will be recorded here.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[var(--surface-muted)] text-[var(--text-secondary)] font-semibold border-b border-[var(--border-subtle)] uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-3 px-4">Timestamp</th>
                      <th className="py-3 px-4">Level</th>
                      <th className="py-3 px-4">Module</th>
                      <th className="py-3 px-4">Event / Message</th>
                      <th className="py-3 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-subtle)] text-[var(--text-primary)]">
                    {systemLogs.map((log) => (
                      <tr key={log.id || log._id} className="hover:bg-[var(--surface-muted)]/50 transition-colors">
                        <td className="py-3 px-4 text-[var(--text-secondary)] font-medium whitespace-nowrap">
                          {new Date(log.createdAt).toLocaleString()}
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant={getLogLevelBadge(log.level)}>{log.level}</Badge>
                        </td>
                        <td className="py-3 px-4 font-bold text-[var(--text-secondary)]">{log.module}</td>
                        <td className="py-3 px-4">
                          <span className="font-bold block">{log.event}</span>
                          <span className="text-[11px] text-[var(--text-secondary)]">{log.message}</span>
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant={log.status === 'SUCCESS' ? 'success' : 'danger'}>{log.status}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
};
