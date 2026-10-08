import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { AppShell } from '../components/layout/AppShell';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { StatCard } from '../components/ui/StatCard';
import { examMonitoringService } from '../services/examMonitoringService';
import { formatExamTime } from '../utils/dateUtils';
import {
  ArrowLeft,
  RefreshCw,
  AlertCircle,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Users,
  Search,
  Clock,
  Eye,
  Ban,
  Filter,
} from 'lucide-react';

export const InstructorExamMonitoringDetailPage = () => {
  const { examId } = useParams();
  const navigate = useNavigate();

  const [exam, setExam] = useState(null);
  const [stats, setStats] = useState({});
  const [students, setStudents] = useState([]);
  const [totalStudentsCount, setTotalStudentsCount] = useState(0);

  const [isLoading, setIsLoading] = useState(true);
  const [isStudentsLoading, setIsStudentsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [socketStatus, setSocketStatus] = useState('connecting');

  // Modal State for Ending Exam Early
  const [showEndEarlyModal, setShowEndEarlyModal] = useState(false);
  const [isEndingEarly, setIsEndingEarly] = useState(false);

  // Filters State
  const [filters, setFilters] = useState({
    search: '',
    riskLevel: 'ALL',
    attemptStatus: 'ALL',
    reviewStatus: 'ALL',
    sortBy: 'riskScore',
    sortOrder: 'desc',
    page: 1,
    limit: 25,
  });

  const fetchExamDetailStats = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await examMonitoringService.getExamDetailStats(examId);
      if (res.success && res.data) {
        setExam(res.data.exam);
        setStats(res.data.stats || {});
      }
    } catch (err) {
      setError(err.message || 'Failed to load exam details.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMonitoredStudents = async () => {
    try {
      setIsStudentsLoading(true);
      const res = await examMonitoringService.getMonitoredStudents(examId, filters);
      if (res.success && res.data) {
        setStudents(res.data.students || []);
        setTotalStudentsCount(res.data.total || 0);
      }
    } catch (err) {
      console.warn('Failed to load monitored students:', err.message);
    } finally {
      setIsStudentsLoading(false);
    }
  };

  useEffect(() => {
    if (examId) {
      fetchExamDetailStats();
    }
  }, [examId]);

  useEffect(() => {
    if (examId) {
      fetchMonitoredStudents();
    }
  }, [examId, filters]);

  // Real-time Socket.IO room subscription for this specific exam
  useEffect(() => {
    if (!examId) return;

    const rawApiUrl = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL;
    const socketUrl = rawApiUrl ? rawApiUrl.replace(/\/api\/v1\/?$/, '') : window.location.origin;
    const socket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
    });

    socket.on('connect', () => {
      setSocketStatus('connected');
      socket.emit('join_exam_monitoring', { examId });
    });

    socket.on('disconnect', () => {
      setSocketStatus('disconnected');
    });

    socket.on('reconnect_attempt', () => {
      setSocketStatus('reconnecting');
    });

    // Real-time event listener when any student records an integrity signal
    socket.on('integrity_signal', () => {
      fetchExamDetailStats();
      fetchMonitoredStudents();
    });

    socket.on('attempt_updated', () => {
      fetchMonitoredStudents();
    });

    socket.on('exam_ended_early', () => {
      fetchExamDetailStats();
      fetchMonitoredStudents();
    });

    return () => {
      socket.emit('leave_exam_monitoring', { examId });
      socket.disconnect();
    };
  }, [examId]);

  // Handle End Exam Early
  const handleConfirmEndEarly = async () => {
    try {
      setIsEndingEarly(true);
      setError(null);
      const res = await examMonitoringService.endExamEarly(examId);
      if (res.success) {
        setShowEndEarlyModal(false);
        await fetchExamDetailStats();
        await fetchMonitoredStudents();
      }
    } catch (err) {
      setError(err.message || 'Failed to end exam early.');
      setShowEndEarlyModal(false);
    } finally {
      setIsEndingEarly(false);
    }
  };

  const formatSeconds = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <AppShell title="Exam Monitoring Detail">
        <div className="p-12 text-center text-xs text-[var(--text-secondary)]">
          <RefreshCw className="w-6 h-6 animate-spin text-[var(--primary)] mx-auto mb-2" />
          Loading exam live monitoring center...
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title={`Monitoring — ${exam?.title || 'Live Exam'}`}>
      <div className="space-y-6 pb-12">
        {/* Header Bar & Actions */}
        <div className="bg-[var(--surface)] p-6 rounded-2xl border border-[var(--border)] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                icon={ArrowLeft}
                onClick={() => navigate('/instructor/exam-monitoring')}
              >
                All Exams
              </Button>
              <h1 className="text-xl font-bold text-[var(--text-primary)]">{exam?.title}</h1>
              {socketStatus === 'connected' ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  ● Monitoring Live
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                  <RefreshCw className="w-3 h-3 animate-spin text-amber-500" />
                  ⚠ Reconnecting...
                </span>
              )}
            </div>

            <div className="text-xs text-[var(--text-secondary)] flex flex-wrap gap-x-4 gap-y-1 pt-1">
              <span>Course: <strong>{exam?.courseId?.code} — {exam?.courseId?.name}</strong></span>
              <span>Status: <strong className="uppercase">{exam?.computedStatus}</strong></span>
              {exam?.startTime && (
                <span>Started: <strong>{formatExamTime(exam.startTime)}</strong></span>
              )}
              {exam?.endTime && (
                <span>Ends: <strong>{formatExamTime(exam.endTime)}</strong></span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              icon={RefreshCw}
              onClick={() => {
                fetchExamDetailStats();
                fetchMonitoredStudents();
              }}
            >
              Refresh
            </Button>
            {exam?.computedStatus === 'LIVE' && (
              <Button
                variant="ghost"
                size="sm"
                className="text-red-600 hover:bg-red-500/10 border border-red-500/20 font-bold"
                icon={Ban}
                onClick={() => setShowEndEarlyModal(true)}
              >
                End Exam Early
              </Button>
            )}
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-600 rounded-xl text-xs font-semibold flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              <span>{error}</span>
            </div>
            <button
              onClick={() => {
                fetchExamDetailStats();
                fetchMonitoredStudents();
              }}
              className="cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Real MongoDB Live Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          <StatCard title="Total Students" value={stats.totalStudents || 0} icon={Users} />
          <StatCard title="In Progress" value={stats.attempting || 0} icon={Clock} />
          <StatCard title="Completed" value={stats.completed || 0} icon={CheckCircle2} />
          <StatCard title="Not Started" value={stats.notStarted || 0} icon={Users} />
          <StatCard title="High Risk" value={stats.highRisk || 0} icon={ShieldAlert} />
          <StatCard title="Medium Risk" value={stats.mediumRisk || 0} icon={AlertTriangle} />
          <StatCard title="Low Risk" value={stats.lowRisk || 0} icon={CheckCircle2} />
        </div>

        {/* Live Monitored Students Table & Filters */}
        <Card
          title="Student Live Monitoring Table"
          action={
            <span className="text-xs text-[var(--text-secondary)] font-medium">
              Showing {students.length} of {totalStudentsCount} Students
            </span>
          }
        >
          <div className="space-y-4">
            {/* Filter Bar */}
            <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between bg-[var(--surface-muted)] p-3 rounded-xl border border-[var(--border-subtle)] text-xs">
              <div className="flex-1 relative">
                <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search student name, roll number, email..."
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
                  className="w-full pl-9 pr-3 py-1.5 bg-[var(--surface)] border border-[var(--border)] rounded-lg text-xs font-semibold focus:ring-2 focus:ring-[var(--primary)]"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={filters.riskLevel}
                  onChange={(e) => setFilters({ ...filters, riskLevel: e.target.value, page: 1 })}
                  className="px-2.5 py-1.5 bg-[var(--surface)] border border-[var(--border)] rounded-lg text-xs font-semibold cursor-pointer"
                >
                  <option value="ALL">All Risk Levels</option>
                  <option value="HIGH">High Risk Only</option>
                  <option value="MEDIUM">Medium Risk Only</option>
                  <option value="LOW">Low Risk Only</option>
                </select>

                <select
                  value={filters.attemptStatus}
                  onChange={(e) => setFilters({ ...filters, attemptStatus: e.target.value, page: 1 })}
                  className="px-2.5 py-1.5 bg-[var(--surface)] border border-[var(--border)] rounded-lg text-xs font-semibold cursor-pointer"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="SUBMITTED">Submitted / Completed</option>
                  <option value="NOT_STARTED">Not Started</option>
                </select>

                <select
                  value={filters.sortBy}
                  onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
                  className="px-2.5 py-1.5 bg-[var(--surface)] border border-[var(--border)] rounded-lg text-xs font-semibold cursor-pointer"
                >
                  <option value="riskScore">Sort by Risk Score</option>
                  <option value="studentName">Sort by Name</option>
                  <option value="progress">Sort by Progress</option>
                  <option value="signalsCount">Sort by Signals Count</option>
                </select>
              </div>
            </div>

            {/* Desktop Monitoring Table */}
            {isStudentsLoading ? (
              <div className="p-8 text-center text-xs text-[var(--text-secondary)]">
                <RefreshCw className="w-5 h-5 animate-spin text-[var(--primary)] mx-auto mb-2" />
                Updating live student attempt table...
              </div>
            ) : students.length === 0 ? (
              <div className="p-8 text-center text-xs text-[var(--text-secondary)]">
                No matching student attempts found for the selected filters.
              </div>
            ) : (
              <>
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-[var(--border)] text-[var(--text-secondary)] font-bold uppercase text-[10px]">
                        <th className="py-3 px-3">Student Name</th>
                        <th className="py-3 px-3">Roll Number</th>
                        <th className="py-3 px-3">Progress</th>
                        <th className="py-3 px-3">Elapsed Time</th>
                        <th className="py-3 px-3">Risk Level</th>
                        <th className="py-3 px-3">Risk Score</th>
                        <th className="py-3 px-3">Signals</th>
                        <th className="py-3 px-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border-subtle)]">
                      {students.map((r) => {
                        const isHigh = r.riskLevel === 'HIGH';
                        const isMed = r.riskLevel === 'MEDIUM';

                        return (
                          <tr
                            key={r.student.id}
                            className={`hover:bg-[var(--surface-muted)] transition-colors ${
                              isHigh ? 'bg-red-500/5' : isMed ? 'bg-amber-500/5' : ''
                            }`}
                          >
                            <td className="py-3 px-3 font-bold text-[var(--text-primary)]">
                              <div>{r.student.name}</div>
                              <div className="text-[10px] text-[var(--text-muted)] font-normal">{r.student.email}</div>
                            </td>
                            <td className="py-3 px-3 font-semibold text-[var(--text-secondary)]">
                              {r.student.rollNumber}
                            </td>
                            <td className="py-3 px-3">
                              <div className="font-bold text-[var(--text-primary)]">{r.progressText}</div>
                              <div className="w-24 bg-[var(--border)] h-1.5 rounded-full overflow-hidden mt-1">
                                <div
                                  className="bg-[var(--primary)] h-full"
                                  style={{ width: `${r.progressPercentage}%` }}
                                />
                              </div>
                            </td>
                            <td className="py-3 px-3 font-mono font-semibold text-[var(--text-secondary)]">
                              {formatSeconds(r.timeElapsedSeconds)}
                            </td>
                            <td className="py-3 px-3">
                              <Badge variant={isHigh ? 'error font-bold' : isMed ? 'warning' : 'success'}>
                                {r.riskLevel}
                              </Badge>
                            </td>
                            <td className="py-3 px-3 font-bold text-sm">
                              <span
                                className={
                                  isHigh
                                    ? 'text-red-600 dark:text-red-400 font-black'
                                    : isMed
                                    ? 'text-amber-600 dark:text-amber-400 font-black'
                                    : 'text-[var(--text-primary)]'
                                }
                              >
                                {r.riskScore}
                              </span>
                            </td>
                            <td className="py-3 px-3 font-bold text-[var(--text-primary)]">
                              {r.signalsCount}
                            </td>
                            <td className="py-3 px-3 text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                icon={Eye}
                                onClick={() =>
                                  navigate(`/instructor/exam-monitoring/${examId}/student/${r.student.id}`)
                                }
                              >
                                View
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Responsive Cards View */}
                <div className="md:hidden space-y-3">
                  {students.map((r) => (
                    <div
                      key={r.student.id}
                      className="p-4 bg-[var(--surface-muted)] rounded-xl border border-[var(--border-subtle)] space-y-2 text-xs"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-bold text-[var(--text-primary)]">{r.student.name}</h4>
                          <p className="text-[10px] text-[var(--text-secondary)]">Roll: {r.student.rollNumber}</p>
                        </div>
                        <Badge variant={r.riskLevel === 'HIGH' ? 'error' : r.riskLevel === 'MEDIUM' ? 'warning' : 'success'}>
                          {r.riskLevel}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                        <div>
                          <span className="text-[var(--text-muted)] block">Progress</span>
                          <span className="font-bold">{r.progressText} ({r.progressPercentage}%)</span>
                        </div>
                        <div>
                          <span className="text-[var(--text-muted)] block">Time</span>
                          <span className="font-mono font-semibold">{formatSeconds(r.timeElapsedSeconds)}</span>
                        </div>
                        <div>
                          <span className="text-[var(--text-muted)] block">Risk Score</span>
                          <span className="font-bold text-red-600 dark:text-red-400">{r.riskScore}</span>
                        </div>
                        <div>
                          <span className="text-[var(--text-muted)] block">Signals</span>
                          <span className="font-bold">{r.signalsCount}</span>
                        </div>
                      </div>

                      <div className="pt-2 text-right">
                        <Button
                          variant="secondary"
                          size="sm"
                          icon={Eye}
                          onClick={() => navigate(`/instructor/exam-monitoring/${examId}/student/${r.student.id}`)}
                        >
                          View Details
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </Card>

        {/* End Exam Early Confirmation Modal */}
        {showEndEarlyModal && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-[var(--surface)] p-6 rounded-2xl border border-[var(--border)] max-w-md w-full space-y-4 shadow-xl">
              <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
                <AlertCircle className="w-6 h-6" />
                <h3 className="text-base font-bold text-[var(--text-primary)]">End Exam Early?</h3>
              </div>

              <p className="text-xs text-[var(--text-secondary)]">
                Ending the exam early will automatically submit all in-progress student attempts for <strong>{exam?.title}</strong> and mark the exam status as <strong>ENDED</strong>.
              </p>

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button variant="outline" onClick={() => setShowEndEarlyModal(false)}>
                  Keep Exam Live
                </Button>
                <Button
                  variant="primary"
                  className="bg-red-600 hover:bg-red-700 text-white border-none"
                  disabled={isEndingEarly}
                  onClick={handleConfirmEndEarly}
                >
                  {isEndingEarly ? 'Ending Exam...' : 'End Exam Early'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
};

export default InstructorExamMonitoringDetailPage;
