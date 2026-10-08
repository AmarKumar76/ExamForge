import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { examMonitoringService } from '../services/examMonitoringService';
import { formatExamDateTime, formatExamTime } from '../utils/dateUtils';
import {
  ArrowLeft,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Clock,
  User,
  FileText,
  Camera,
  MessageSquare,
  AlertCircle,
  RefreshCw,
  Check,
  Send,
} from 'lucide-react';

export const InstructorStudentMonitoringDetailPage = () => {
  const { examId, studentId } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Instructor Action Form State
  const [instructorNote, setInstructorNote] = useState('');
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [actionSuccess, setActionSuccess] = useState(null);

  const fetchStudentMonitoringDetail = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await examMonitoringService.getStudentDetail(examId, studentId);
      if (res.success && res.data) {
        setData(res.data);
        setInstructorNote(res.data.instructorNote || '');
      }
    } catch (err) {
      setError(err.message || 'Failed to load student attempt details.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (examId && studentId) {
      fetchStudentMonitoringDetail();
    }
  }, [examId, studentId]);

  // Handle Adding Instructor Note
  const handleSaveNote = async (e) => {
    e.preventDefault();
    if (!data?.attempt?.id && !data?.attempt?._id) return;
    try {
      setIsSavingNote(true);
      setActionSuccess(null);
      const attemptId = data.attempt.id || data.attempt._id;
      const res = await examMonitoringService.addInstructorNote(attemptId, instructorNote);
      if (res.success) {
        setActionSuccess('Instructor note saved to MongoDB.');
        setTimeout(() => setActionSuccess(null), 3000);
      }
    } catch (err) {
      alert(err.message || 'Failed to save instructor note.');
    } finally {
      setIsSavingNote(false);
    }
  };

  // Handle Review Status Update
  const handleUpdateReviewStatus = async (status) => {
    if (!data?.attempt?.id && !data?.attempt?._id) return;
    try {
      setIsUpdatingStatus(true);
      setActionSuccess(null);
      const attemptId = data.attempt.id || data.attempt._id;
      const res = await examMonitoringService.updateReviewStatus(attemptId, status);
      if (res.success) {
        setActionSuccess(`Review status updated to ${status}.`);
        await fetchStudentMonitoringDetail();
        setTimeout(() => setActionSuccess(null), 3000);
      }
    } catch (err) {
      alert(err.message || 'Failed to update review status.');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const formatSeconds = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <AppShell title="Student Monitoring Detail">
        <div className="p-12 text-center text-xs text-[var(--text-secondary)]">
          <RefreshCw className="w-6 h-6 animate-spin text-[var(--primary)] mx-auto mb-2" />
          Loading student monitoring detail...
        </div>
      </AppShell>
    );
  }

  const student = data?.student || {};
  const exam = data?.exam || {};
  const attempt = data?.attempt || {};
  const progress = data?.progress || {};
  const riskSummary = data?.riskSummary || {};
  const riskBreakdown = data?.riskBreakdown || [];
  const timeline = data?.timeline || [];
  const reviewStatus = data?.reviewStatus || 'UNREVIEWED';

  const isHigh = riskSummary.riskLevel === 'HIGH';
  const isMed = riskSummary.riskLevel === 'MEDIUM';

  return (
    <AppShell title={`Monitoring — ${student.name || 'Student'}`}>
      <div className="space-y-6 max-w-6xl mx-auto pb-12">
        {/* Header Bar */}
        <div className="bg-[var(--surface)] p-6 rounded-2xl border border-[var(--border)] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                icon={ArrowLeft}
                onClick={() => navigate(`/instructor/exam-monitoring/${examId}`)}
              >
                Back to Exam
              </Button>
              <h1 className="text-xl font-bold text-[var(--text-primary)]">{student.name}</h1>
              <Badge variant={isHigh ? 'error font-bold' : isMed ? 'warning font-bold' : 'success'}>
                {riskSummary.riskLevel} RISK
              </Badge>
              <Badge variant="neutral">{reviewStatus}</Badge>
            </div>

            <div className="text-xs text-[var(--text-secondary)] flex flex-wrap gap-x-4 gap-y-1 pt-1">
              <span>Roll: <strong>{student.rollNumber || 'N/A'}</strong></span>
              <span>Email: <strong>{student.email}</strong></span>
              <span>Course: <strong>{exam.courseId?.code || ''} — {exam.courseId?.name || ''}</strong></span>
              <span>Exam: <strong>{exam.title}</strong></span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" icon={RefreshCw} onClick={fetchStudentMonitoringDetail}>
              Refresh Data
            </Button>
          </div>
        </div>

        {actionSuccess && (
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 rounded-xl text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{actionSuccess}</span>
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-600 rounded-xl text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        )}

        {/* Grid Section 1: Progress & Camera Status */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left: Attempt & Progress Statistics */}
          <div className="lg:col-span-8 space-y-6">
            <Card title="Attempt & Real-Time Progress">
              <div className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[var(--surface-muted)] p-4 rounded-xl text-xs border border-[var(--border-subtle)]">
                  <div>
                    <span className="text-[10px] text-[var(--text-muted)] font-bold uppercase block">Questions Answered</span>
                    <span className="text-base font-black text-[var(--text-primary)]">
                      {progress.questionsAnswered} / {progress.totalQuestions}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[var(--text-muted)] font-bold uppercase block">Progress Percentage</span>
                    <span className="text-base font-black text-[var(--primary)]">{progress.progressPercentage}%</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[var(--text-muted)] font-bold uppercase block">Time Elapsed</span>
                    <span className="text-base font-mono font-bold text-[var(--text-primary)]">
                      {formatSeconds(progress.timeElapsedSeconds || 0)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[var(--text-muted)] font-bold uppercase block">Time Remaining</span>
                    <span className="text-base font-mono font-bold text-[var(--text-primary)]">
                      {formatSeconds(progress.timeRemainingSeconds || 0)}
                    </span>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-bold">
                    <span>Overall Completion</span>
                    <span>{progress.progressPercentage}%</span>
                  </div>
                  <div className="w-full bg-[var(--border)] h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-[var(--primary)] h-full transition-all"
                      style={{ width: `${progress.progressPercentage}%` }}
                    />
                  </div>
                </div>

                <div className="text-xs text-[var(--text-secondary)] flex flex-wrap gap-x-4 gap-y-1 pt-2 border-t border-[var(--border-subtle)]">
                  <span>Attempt Status: <strong className="uppercase text-[var(--text-primary)]">{data?.status || 'NOT_STARTED'}</strong></span>
                  {attempt?.startedAt && (
                    <span>Started At: <strong>{formatExamDateTime(attempt.startedAt)}</strong></span>
                  )}
                  {attempt?.submittedAt && (
                    <span>Submitted At: <strong>{formatExamDateTime(attempt.submittedAt)}</strong></span>
                  )}
                </div>
              </div>
            </Card>

            {/* Integrity Risk Summary & Weighted Breakdown */}
            <Card title="Academic Integrity Risk Summary">
              <div className="space-y-4">
                <div className="p-4 bg-[var(--surface-muted)] rounded-xl border border-[var(--border-subtle)] flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-[var(--text-secondary)] block">Calculated Integrity Risk Score</span>
                    <span className={`text-2xl font-black ${isHigh ? 'text-red-600 dark:text-red-400' : isMed ? 'text-amber-600 dark:text-amber-400' : 'text-[var(--text-primary)]'}`}>
                      {riskSummary.riskScore} Points
                    </span>
                  </div>
                  <div className="text-right">
                    <Badge variant={isHigh ? 'error font-bold' : isMed ? 'warning font-bold' : 'success'}>
                      {riskSummary.riskLevel} RISK LEVEL
                    </Badge>
                    <span className="text-xs text-[var(--text-muted)] block mt-1">
                      Total Signals Recorded: {riskSummary.totalSignals}
                    </span>
                  </div>
                </div>

                {/* Risk Weighted Breakdown Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-[var(--border)] text-[var(--text-secondary)] font-bold uppercase text-[10px]">
                        <th className="py-2.5 px-3">Signal Type</th>
                        <th className="py-2.5 px-3 text-center">Occurrences</th>
                        <th className="py-2.5 px-3 text-center">Weight</th>
                        <th className="py-2.5 px-3 text-right">Score Contribution</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border-subtle)]">
                      {riskBreakdown.map((item, idx) => (
                        <tr key={idx} className="hover:bg-[var(--surface-muted)] transition-colors">
                          <td className="py-2.5 px-3 font-semibold text-[var(--text-primary)]">{item.type}</td>
                          <td className="py-2.5 px-3 text-center font-bold">{item.count}</td>
                          <td className="py-2.5 px-3 text-center text-[var(--text-muted)]">+{item.weight}</td>
                          <td className="py-2.5 px-3 text-right font-bold text-[var(--text-primary)]">
                            +{item.scoreContribution}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <p className="text-[10px] text-[var(--text-muted)] italic">
                  Note: Risk score is an aggregate integrity indicator for instructor guidance and does not constitute automatic proof of misconduct.
                </p>
              </div>
            </Card>

            {/* Chronological Integrity Signal Timeline */}
            <Card title="Chronological Integrity Signal Timeline">
              {timeline.length === 0 ? (
                <div className="p-8 text-center text-xs text-[var(--text-secondary)]">
                  No integrity signals recorded during this examination session.
                </div>
              ) : (
                <div className="space-y-4 pt-1">
                  {timeline.map((sig) => {
                    const isSigHigh = sig.severity === 'HIGH';
                    const isSigMed = sig.severity === 'MEDIUM';

                    return (
                      <div
                        key={sig.id}
                        className={`p-4 rounded-xl border text-xs space-y-1 transition-all ${
                          isSigHigh
                            ? 'bg-red-500/5 border-red-500/30'
                            : isSigMed
                            ? 'bg-amber-500/5 border-amber-500/30'
                            : 'bg-[var(--surface-muted)] border-[var(--border-subtle)]'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-sm text-[var(--text-primary)] flex items-center gap-2">
                            {isSigHigh ? (
                              <ShieldAlert className="w-4 h-4 text-red-600 dark:text-red-400" />
                            ) : (
                              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                            )}
                            {sig.signalType.replace(/_/g, ' ')}
                          </span>
                          <span className="font-mono text-[11px] text-[var(--text-muted)] font-semibold">
                            {formatExamTime(sig.timestamp)}
                          </span>
                        </div>

                        <p className="text-xs text-[var(--text-secondary)]">{sig.description}</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          </div>

          {/* Right: Camera Status & Instructor Review Box */}
          <div className="lg:col-span-4 space-y-6">
            {/* Camera & Face Proctoring Box */}
            <Card title="Proctoring & Camera Status">
              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between p-3 bg-[var(--surface-muted)] rounded-xl border border-[var(--border-subtle)]">
                  <span className="font-semibold text-[var(--text-secondary)] flex items-center gap-2">
                    <Camera className="w-4 h-4 text-[var(--primary)]" /> Camera Feed
                  </span>
                  <Badge variant="success">Active</Badge>
                </div>

                <div className="flex items-center justify-between p-3 bg-[var(--surface-muted)] rounded-xl border border-[var(--border-subtle)]">
                  <span className="font-semibold text-[var(--text-secondary)] flex items-center gap-2">
                    <User className="w-4 h-4 text-[var(--primary)]" /> Face Status
                  </span>
                  <Badge variant={isHigh ? 'error' : isMed ? 'warning' : 'success'}>
                    {isHigh ? 'Multiple / Absent' : 'Detected'}
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-3 bg-[var(--surface-muted)] rounded-xl border border-[var(--border-subtle)]">
                  <span className="font-semibold text-[var(--text-secondary)] flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-[var(--primary)]" /> Integrity Shield
                  </span>
                  <Badge variant="success">Monitoring Active</Badge>
                </div>
              </div>
            </Card>

            {/* Instructor Actions & Review Box */}
            <Card title="Instructor Review & Actions">
              <div className="space-y-4 text-xs">
                {/* Review Status Selector */}
                <div className="space-y-2">
                  <label className="font-bold text-[var(--text-primary)] block">Review Status</label>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant={reviewStatus === 'REVIEWED' ? 'primary' : 'outline'}
                      size="sm"
                      disabled={isUpdatingStatus}
                      onClick={() => handleUpdateReviewStatus('REVIEWED')}
                    >
                      Mark Reviewed
                    </Button>
                    <Button
                      variant={reviewStatus === 'ESCALATED' ? 'primary' : 'outline'}
                      size="sm"
                      className={reviewStatus === 'ESCALATED' ? 'bg-red-600 hover:bg-red-700 text-white' : 'text-red-500 border-red-500/20'}
                      disabled={isUpdatingStatus}
                      onClick={() => handleUpdateReviewStatus('ESCALATED')}
                    >
                      Escalate
                    </Button>
                  </div>
                </div>

                {/* Add Instructor Note Form */}
                <form onSubmit={handleSaveNote} className="space-y-3 pt-2 border-t border-[var(--border-subtle)]">
                  <label className="font-bold text-[var(--text-primary)] block">Instructor Audit Note</label>
                  <textarea
                    rows={4}
                    placeholder="Record notes on student live attempt or verified integrity signals..."
                    value={instructorNote}
                    onChange={(e) => setInstructorNote(e.target.value)}
                    className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-xl text-xs text-[var(--text-primary)] font-medium"
                  />
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    className="w-full"
                    disabled={isSavingNote || !instructorNote.trim()}
                    icon={Send}
                  >
                    {isSavingNote ? 'Saving Note...' : 'Save Note to Database'}
                  </Button>
                </form>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </AppShell>
  );
};

export default InstructorStudentMonitoringDetailPage;
