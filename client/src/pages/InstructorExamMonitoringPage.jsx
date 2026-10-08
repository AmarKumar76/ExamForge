import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { AppShell } from '../components/layout/AppShell';
import { StatCard } from '../components/ui/StatCard';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { examMonitoringService } from '../services/examMonitoringService';
import {
  Activity,
  Tv,
  Users,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowRight,
  RefreshCw,
  AlertCircle,
  FileText,
  Calendar,
} from 'lucide-react';

export const InstructorExamMonitoringPage = () => {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('LIVE'); // 'LIVE' | 'SCHEDULED' | 'COMPLETED'
  const [summaryStats, setSummaryStats] = useState({
    liveExams: 0,
    studentsAttempting: 0,
    highRisk: 0,
    mediumRisk: 0,
    lowRisk: 0,
    totalSignals: 0,
  });
  const [exams, setExams] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [socketStatus, setSocketStatus] = useState('connecting'); // 'connected' | 'reconnecting' | 'disconnected'
  const [recentLiveAlert, setRecentLiveAlert] = useState(null);

  const fetchMonitoringData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await examMonitoringService.getInstructorExams(activeTab);
      if (res.success && res.data) {
        setSummaryStats(res.data.summaryStats || {});
        setExams(res.data.exams || []);
      }
    } catch (err) {
      setError(err.message || 'Failed to load live monitoring dashboard.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMonitoringData();
  }, [activeTab]);

  // Real-time Socket.IO Connection & Alerts
  useEffect(() => {
    const socket = io(import.meta.env.VITE_API_URL || window.location.origin, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
    });

    socket.on('connect', () => {
      setSocketStatus('connected');
    });

    socket.on('disconnect', () => {
      setSocketStatus('disconnected');
    });

    socket.on('reconnect_attempt', () => {
      setSocketStatus('reconnecting');
    });

    socket.on('global_monitoring_alert', (payload) => {
      // Refresh statistics & display non-intrusive notification
      fetchMonitoringData();
      if (payload.severity === 'HIGH' || payload.riskLevel === 'HIGH') {
        setRecentLiveAlert(payload);
        setTimeout(() => setRecentLiveAlert(null), 6000);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <AppShell title="Exam Monitoring">
      <div className="space-y-8 pb-12">
        {/* Top Header & Live Socket Connection Indicator */}
        <div className="bg-[var(--surface)] p-6 rounded-2xl border border-[var(--border)] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-[var(--text-primary)]">Exam Monitoring</h1>
              {socketStatus === 'connected' ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  ● Monitoring Live
                </span>
              ) : socketStatus === 'reconnecting' ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                  <RefreshCw className="w-3 h-3 animate-spin text-amber-500" />
                  ⚠ Reconnecting...
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">
                  <span className="w-2 h-2 rounded-full bg-red-500" />
                  ⚠ Connection Interrupted
                </span>
              )}
            </div>
            <p className="text-xs text-[var(--text-secondary)] mt-1">
              Monitor active examinations, student progress and academic integrity signals in real time.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" icon={RefreshCw} onClick={fetchMonitoringData}>
              Refresh Data
            </Button>
          </div>
        </div>

        {/* Live Signal Toast Alert Banner */}
        {recentLiveAlert && (
          <div className="p-4 bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 rounded-2xl text-xs font-semibold flex items-center justify-between shadow-sm animate-bounce-short">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center shrink-0">
                <ShieldAlert className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <span className="font-bold text-sm block">🔴 High Risk Activity Detected</span>
                <p className="text-[11px] opacity-90">
                  {recentLiveAlert.studentName || 'A student'} recorded signal: <strong>{recentLiveAlert.signalType}</strong>
                </p>
              </div>
            </div>
            <Button
              variant="secondary"
              size="sm"
              icon={ArrowRight}
              onClick={() => navigate(`/instructor/exam-monitoring/${recentLiveAlert.examId}`)}
            >
              Monitor Exam
            </Button>
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-600 rounded-xl text-xs font-semibold flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              <span>{error}</span>
            </div>
            <button onClick={fetchMonitoringData} className="cursor-pointer">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Real MongoDB-Driven 6 Summary Statistics Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
          <StatCard title="Live Exams" value={isLoading ? '...' : summaryStats.liveExams || 0} icon={Tv} />
          <StatCard title="Students Attempting" value={isLoading ? '...' : summaryStats.studentsAttempting || 0} icon={Users} />
          <StatCard title="High Risk" value={isLoading ? '...' : summaryStats.highRisk || 0} icon={ShieldAlert} />
          <StatCard title="Medium Risk" value={isLoading ? '...' : summaryStats.mediumRisk || 0} icon={AlertTriangle} />
          <StatCard title="Low Risk" value={isLoading ? '...' : summaryStats.lowRisk || 0} icon={CheckCircle2} />
          <StatCard title="Integrity Signals" value={isLoading ? '...' : summaryStats.totalSignals || 0} icon={Activity} />
        </div>

        {/* Tab Filters */}
        <div className="flex items-center gap-2 border-b border-[var(--border-subtle)] pb-2">
          <Button
            variant={activeTab === 'LIVE' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('LIVE')}
          >
            Live Exams ({summaryStats.liveExams || 0})
          </Button>
          <Button
            variant={activeTab === 'SCHEDULED' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('SCHEDULED')}
          >
            Scheduled
          </Button>
          <Button
            variant={activeTab === 'COMPLETED' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('COMPLETED')}
          >
            Completed
          </Button>
        </div>

        {/* Main Monitoring Section */}
        {isLoading ? (
          <div className="p-12 text-center text-xs text-[var(--text-secondary)]">
            <RefreshCw className="w-6 h-6 animate-spin text-[var(--primary)] mx-auto mb-2" />
            Loading real-time exam monitoring data...
          </div>
        ) : exams.length === 0 ? (
          <Card>
            {activeTab === 'LIVE' ? (
              <div className="p-10 text-center space-y-3">
                <Tv className="w-10 h-10 text-[var(--text-muted)] mx-auto" />
                <h3 className="text-base font-bold text-[var(--text-primary)]">No Live Exams</h3>
                <p className="text-xs text-[var(--text-secondary)] max-w-md mx-auto">
                  There are currently no active examinations to monitor for your assigned courses.
                </p>
                <div className="pt-2 flex justify-center gap-3">
                  <Button variant="secondary" size="sm" icon={Calendar} onClick={() => setActiveTab('SCHEDULED')}>
                    View Scheduled Exams
                  </Button>
                  <Button variant="outline" size="sm" icon={FileText} onClick={() => navigate('/instructor/exams')}>
                    Create Exam
                  </Button>
                </div>
              </div>
            ) : activeTab === 'SCHEDULED' ? (
              <div className="p-10 text-center space-y-3">
                <Calendar className="w-10 h-10 text-[var(--text-muted)] mx-auto" />
                <h3 className="text-base font-bold text-[var(--text-primary)]">No Upcoming Scheduled Exams</h3>
                <p className="text-xs text-[var(--text-secondary)] max-w-md mx-auto">
                  No upcoming scheduled exams were found for your assigned courses.
                </p>
              </div>
            ) : (
              <div className="p-10 text-center space-y-3">
                <CheckCircle2 className="w-10 h-10 text-[var(--text-muted)] mx-auto" />
                <h3 className="text-base font-bold text-[var(--text-primary)]">No Completed Exams</h3>
                <p className="text-xs text-[var(--text-secondary)] max-w-md mx-auto">
                  No past completed examinations found.
                </p>
              </div>
            )}
          </Card>
        ) : (
          <div className="space-y-4">
            {exams.map((ex) => {
              const stats = ex.monitoringStats || {};

              return (
                <div
                  key={ex._id || ex.id}
                  className="bg-[var(--surface)] p-6 rounded-2xl border border-[var(--border)] shadow-xs hover:border-[var(--primary)] transition-all flex flex-col md:flex-row md:items-center justify-between gap-6"
                >
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-bold text-[var(--text-primary)]">{ex.title}</h3>
                      <Badge
                        variant={
                          ex.computedStatus === 'LIVE'
                            ? 'success font-bold'
                            : ex.computedStatus === 'SCHEDULED'
                            ? 'warning'
                            : 'neutral'
                        }
                      >
                        {ex.computedStatus === 'LIVE' ? '● LIVE' : ex.computedStatus}
                      </Badge>
                    </div>

                    <div className="text-xs text-[var(--text-secondary)] flex flex-wrap gap-x-4 gap-y-1">
                      <span>Course: <strong>{ex.courseId?.code} — {ex.courseId?.name}</strong></span>
                      {ex.startTime && (
                        <span>Started: <strong>{new Date(ex.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong></span>
                      )}
                      {ex.endTime && (
                        <span>Ends: <strong>{new Date(ex.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong></span>
                      )}
                      <span>Duration: <strong>{ex.duration} Mins</strong></span>
                    </div>

                    {/* Attempt & Risk Metrics Pills */}
                    <div className="flex flex-wrap items-center gap-2 pt-2">
                      <span className="px-2.5 py-1 bg-[var(--surface-muted)] text-[var(--text-primary)] rounded-lg text-xs font-bold">
                        {stats.attempting || 0} Students Attempting
                      </span>
                      <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 rounded-lg text-xs font-bold">
                        {stats.completed || 0} Completed
                      </span>
                      {stats.highRisk > 0 && (
                        <span className="px-2.5 py-1 bg-red-500/10 text-red-600 dark:text-red-400 rounded-lg text-xs font-bold flex items-center gap-1">
                          <ShieldAlert className="w-3.5 h-3.5" />
                          {stats.highRisk} High Risk
                        </span>
                      )}
                      {stats.mediumRisk > 0 && (
                        <span className="px-2.5 py-1 bg-amber-500/10 text-amber-700 dark:text-amber-400 rounded-lg text-xs font-bold">
                          {stats.mediumRisk} Medium Risk
                        </span>
                      )}
                      <span className="px-2.5 py-1 bg-blue-500/10 text-blue-700 dark:text-blue-400 rounded-lg text-xs font-semibold">
                        {stats.totalSignals || 0} Signals
                      </span>
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-3">
                    <Button
                      variant="primary"
                      icon={ArrowRight}
                      onClick={() => navigate(`/instructor/exam-monitoring/${ex._id || ex.id}`)}
                    >
                      Monitor Exam
                    </Button>
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

export default InstructorExamMonitoringPage;
