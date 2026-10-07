import React, { useState, useEffect } from 'react';
import { AppShell } from '../components/layout/AppShell';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { examService } from '../services/examService';
import {
  ShieldAlert,
  Eye,
  AlertTriangle,
  RefreshCw,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  FileText,
  User,
  Zap,
  Check,
  AlertCircle,
  FileCheck,
} from 'lucide-react';

export const ProctoringDashboardPage = () => {
  const [data, setData] = useState({ stats: {}, exams: [], attempts: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters state
  const [filterExamId, setFilterExamId] = useState('');
  const [filterRiskLevel, setFilterRiskLevel] = useState('');
  const [filterReviewStatus, setFilterReviewStatus] = useState('');
  const [filterSignalType, setFilterSignalType] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected attempt drawer/modal
  const [selectedAttempt, setSelectedAttempt] = useState(null);
  const [isAttemptLoading, setIsAttemptLoading] = useState(false);
  const [attemptDetails, setAttemptDetails] = useState(null);

  // Review form state
  const [reviewStatus, setReviewStatus] = useState('REVIEWED');
  const [instructorNote, setInstructorNote] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [isRunningSimilarity, setIsRunningSimilarity] = useState(false);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await examService.getInstructorProctoringDashboard({
        examId: filterExamId,
        riskLevel: filterRiskLevel,
        reviewStatus: filterReviewStatus,
        signalType: filterSignalType,
        search: searchQuery,
      });
      if (res.success && res.data) {
        setData(res.data);
      }
    } catch (err) {
      console.error('Proctoring dashboard load error:', err);
      setError(err?.response?.data?.message || 'Failed to load proctoring dashboard.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [filterExamId, filterRiskLevel, filterReviewStatus, filterSignalType]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchDashboardData();
  };

  const handleInspectAttempt = async (attemptItem) => {
    setSelectedAttempt(attemptItem);
    setReviewStatus(attemptItem.integritySummary?.reviewStatus || 'REVIEWED');
    setInstructorNote(attemptItem.integritySummary?.instructorNote || '');

    try {
      setIsAttemptLoading(true);
      const res = await examService.getAttemptIntegrityDetails(attemptItem.attemptId);
      if (res.success && res.data) {
        setAttemptDetails(res.data);
      }
    } catch (err) {
      console.error('Failed to load attempt details:', err);
    } finally {
      setIsAttemptLoading(false);
    }
  };

  const handleSaveReview = async (e) => {
    e.preventDefault();
    if (!selectedAttempt) return;

    try {
      setIsSubmittingReview(true);
      const res = await examService.updateReviewStatus(selectedAttempt.attemptId, reviewStatus, instructorNote);
      if (res.success) {
        setSelectedAttempt(null);
        setAttemptDetails(null);
        fetchDashboardData();
      }
    } catch (err) {
      console.error('Failed to save integrity review:', err);
      alert('Failed to save review status.');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleRunSimilarityCheck = async () => {
    if (!filterExamId) {
      return alert('Please select an exam from the filter dropdown to run a semantic similarity check.');
    }

    try {
      setIsRunningSimilarity(true);
      const res = await examService.runExamSimilarityCheck(filterExamId);
      if (res.success) {
        alert(`Similarity comparison complete! Identified ${res.data.reportsCount} potential response matches.`);
        fetchDashboardData();
      }
    } catch (err) {
      console.error('Similarity check error:', err);
      alert('Failed to run similarity check.');
    } finally {
      setIsRunningSimilarity(false);
    }
  };

  const { stats = {}, exams = [], attempts = [] } = data;

  const getRiskBadge = (level) => {
    switch (level) {
      case 'HIGH':
        return <Badge variant="error">High Risk</Badge>;
      case 'MEDIUM':
        return <Badge variant="warning">Medium Risk</Badge>;
      case 'LOW':
        return <Badge variant="success">Low Risk</Badge>;
      default:
        return <Badge variant="neutral">{level}</Badge>;
    }
  };

  const getReviewBadge = (status) => {
    switch (status) {
      case 'REVIEWED':
        return <Badge variant="success">Reviewed</Badge>;
      case 'UNDER_REVIEW':
        return <Badge variant="warning">Under Review</Badge>;
      case 'DISMISSED':
        return <Badge variant="neutral">Dismissed</Badge>;
      default:
        return <Badge variant="error">Unreviewed</Badge>;
    }
  };

  return (
    <AppShell title="Proctoring & Academic Integrity Dashboard">
      <div className="space-y-6 pb-12">
        {/* Header & Stats */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-2">
              <ShieldAlert className="w-6 h-6 text-[var(--primary)]" />
              Proctoring & Academic Integrity Dashboard
            </h1>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              Evidence-based signal monitoring, timing analysis, semantic similarity, and instructor human review.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              icon={Zap}
              loading={isRunningSimilarity}
              onClick={handleRunSimilarityCheck}
            >
              Run Similarity Check
            </Button>
            <Button variant="outline" size="sm" icon={RefreshCw} onClick={fetchDashboardData}>
              Refresh Data
            </Button>
          </div>
        </div>

        {/* Real Statistics Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">Total Submissions</span>
            <span className="text-2xl font-extrabold text-[var(--text-primary)] block mt-1">{stats.totalAttempts || 0}</span>
          </Card>

          <Card>
            <span className="text-[10px] font-bold uppercase tracking-wider text-red-500">High Risk Signals</span>
            <span className="text-2xl font-extrabold text-red-500 block mt-1">{stats.highRiskAttemptsCount || 0}</span>
          </Card>

          <Card>
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-500">Medium Risk Signals</span>
            <span className="text-2xl font-extrabold text-amber-500 block mt-1">{stats.mediumRiskAttemptsCount || 0}</span>
          </Card>

          <Card>
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-500">Unreviewed Submissions</span>
            <span className="text-2xl font-extrabold text-indigo-500 block mt-1">{stats.unreviewedCount || 0}</span>
          </Card>
        </div>

        {/* Filter Toolbar */}
        <Card>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={filterExamId}
                onChange={(e) => setFilterExamId(e.target.value)}
                className="px-3 py-1.5 bg-[var(--surface-muted)] border border-[var(--border)] rounded-lg text-[var(--text-primary)]"
              >
                <option value="">All Assigned Exams</option>
                {exams.map((e) => (
                  <option key={e.id} value={e.id}>{e.courseCode} — {e.title}</option>
                ))}
              </select>

              <select
                value={filterRiskLevel}
                onChange={(e) => setFilterRiskLevel(e.target.value)}
                className="px-3 py-1.5 bg-[var(--surface-muted)] border border-[var(--border)] rounded-lg text-[var(--text-primary)]"
              >
                <option value="">All Risk Levels</option>
                <option value="HIGH">High Risk</option>
                <option value="MEDIUM">Medium Risk</option>
                <option value="LOW">Low Risk</option>
              </select>

              <select
                value={filterReviewStatus}
                onChange={(e) => setFilterReviewStatus(e.target.value)}
                className="px-3 py-1.5 bg-[var(--surface-muted)] border border-[var(--border)] rounded-lg text-[var(--text-primary)]"
              >
                <option value="">All Review Statuses</option>
                <option value="UNREVIEWED">Unreviewed</option>
                <option value="UNDER_REVIEW">Under Review</option>
                <option value="REVIEWED">Reviewed</option>
                <option value="DISMISSED">Dismissed</option>
              </select>

              <select
                value={filterSignalType}
                onChange={(e) => setFilterSignalType(e.target.value)}
                className="px-3 py-1.5 bg-[var(--surface-muted)] border border-[var(--border)] rounded-lg text-[var(--text-primary)]"
              >
                <option value="">All Signal Types</option>
                <option value="FULLSCREEN_EXIT">Fullscreen Exit</option>
                <option value="TAB_SWITCH">Tab Switch</option>
                <option value="UNUSUAL_TIMING">Unusual Timing</option>
                <option value="SEMANTIC_SIMILARITY">Semantic Similarity</option>
                <option value="FACE_NOT_DETECTED">Face Absence</option>
                <option value="MULTIPLE_PERSON_DETECTED">Multiple Persons</option>
                <option value="COPY_ATTEMPT">Copy Attempt</option>
                <option value="PASTE_ATTEMPT">Paste Attempt</option>
                <option value="CONNECTION_LOST">Connection Anomaly</option>
              </select>
            </div>

            <form onSubmit={handleSearchSubmit} className="flex gap-2">
              <input
                type="text"
                placeholder="Search student or exam..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="px-3 py-1.5 bg-[var(--surface-muted)] border border-[var(--border)] rounded-lg text-[var(--text-primary)]"
              />
              <Button variant="outline" size="sm" type="submit" icon={Search}>
                Search
              </Button>
            </form>
          </div>
        </Card>

        {/* Live / Submitted Attempt Monitoring Table */}
        <Card title="Exam Attempt Integrity Records">
          {isLoading ? (
            <div className="p-12 text-center text-xs text-[var(--text-secondary)]">
              <RefreshCw className="w-8 h-8 text-[var(--primary)] animate-spin mx-auto mb-2" />
              Loading real integrity monitoring records from MongoDB...
            </div>
          ) : attempts.length === 0 ? (
            <div className="p-12 text-center text-xs text-[var(--text-secondary)]">
              <ShieldAlert className="w-10 h-10 text-[var(--text-secondary)] opacity-40 mx-auto mb-2" />
              <p className="font-bold text-[var(--text-primary)] mb-1">No integrity records found.</p>
              <p>Adjust filters or search parameters to view other student attempts.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[var(--border-subtle)] text-[var(--text-secondary)] font-bold uppercase tracking-wider">
                    <th className="py-3 px-4">Student</th>
                    <th className="py-3 px-4">Exam & Course</th>
                    <th className="py-3 px-4">Attempt Status</th>
                    <th className="py-3 px-4">Risk Level</th>
                    <th className="py-3 px-4">Signals Count</th>
                    <th className="py-3 px-4">Review Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-subtle)]">
                  {attempts.map((item) => (
                    <tr key={item.attemptId} className="hover:bg-[var(--surface-muted)] transition-colors">
                      <td className="py-3 px-4 font-bold text-[var(--text-primary)]">
                        {item.student?.name}
                        {item.student?.rollNumber && (
                          <span className="text-[10px] text-[var(--text-secondary)] block font-normal">
                            Roll: {item.student.rollNumber}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-bold text-[var(--text-primary)] block">{item.examTitle}</span>
                        <span className="text-[10px] text-[var(--primary)] font-semibold">{item.courseCode}</span>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={item.status === 'PUBLISHED' ? 'success' : item.status === 'GRADED' ? 'warning' : 'secondary'}>
                          {item.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">{getRiskBadge(item.riskLevel)}</td>
                      <td className="py-3 px-4 font-extrabold text-[var(--text-primary)]">
                        {item.totalSignals} signals
                      </td>
                      <td className="py-3 px-4">{getReviewBadge(item.integritySummary?.reviewStatus)}</td>
                      <td className="py-3 px-4 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          icon={Eye}
                          onClick={() => handleInspectAttempt(item)}
                        >
                          Inspect Integrity
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Attempt Integrity Inspector Drawer/Modal */}
        {selectedAttempt && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
              {/* Drawer Header */}
              <div className="p-5 border-b border-[var(--border)] flex items-center justify-between bg-[var(--surface-muted)]">
                <div>
                  <div className="flex items-center gap-2">
                    {getRiskBadge(selectedAttempt.riskLevel)}
                    <span className="text-xs font-bold text-[var(--text-secondary)]">{selectedAttempt.courseCode}</span>
                  </div>
                  <h3 className="text-lg font-bold text-[var(--text-primary)] mt-1">
                    Integrity Record: {selectedAttempt.student?.name}
                  </h3>
                  <p className="text-xs text-[var(--text-secondary)]">{selectedAttempt.examTitle}</p>
                </div>
                <button
                  onClick={() => {
                    setSelectedAttempt(null);
                    setAttemptDetails(null);
                  }}
                  className="text-lg font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                >
                  ✕
                </button>
              </div>

              {/* Drawer Body */}
              <div className="flex-1 p-6 overflow-y-auto space-y-6 text-xs bg-[var(--background)]">
                {isAttemptLoading ? (
                  <div className="p-8 text-center text-[var(--text-secondary)]">
                    <RefreshCw className="w-6 h-6 text-[var(--primary)] animate-spin mx-auto mb-2" />
                    Loading event timeline and similarity reports...
                  </div>
                ) : (
                  <>
                    {/* Explainable Risk Summary */}
                    <div className="p-4 bg-[var(--surface)] border border-[var(--border)] rounded-xl space-y-2">
                      <h4 className="font-bold text-[var(--text-primary)] uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4 text-amber-500" />
                        Explainable Evidence Summary (Not a cheating verdict)
                      </h4>
                      <p className="text-xs text-[var(--text-secondary)] leading-relaxed font-medium">
                        {selectedAttempt.integritySummary?.aiSummary || 'Attempt recorded zero integrity signals.'}
                      </p>
                      <p className="text-xs text-[var(--primary)] italic font-semibold">
                        Recommendation: {selectedAttempt.integritySummary?.aiRecommendation || 'Instructor review recommended.'}
                      </p>
                    </div>

                    {/* Timestamped Signals Timeline */}
                    <div className="space-y-3">
                      <h4 className="font-bold text-[var(--text-primary)] uppercase tracking-wider text-[11px]">
                        Recorded Signals Timeline ({selectedAttempt.integritySignals?.length || 0})
                      </h4>

                      {selectedAttempt.integritySignals?.length === 0 ? (
                        <p className="text-xs text-[var(--text-secondary)] italic p-3 bg-[var(--surface-muted)] rounded-lg">
                          Zero signals recorded during this exam attempt.
                        </p>
                      ) : (
                        <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                          {selectedAttempt.integritySignals?.map((sig, sIdx) => (
                            <div
                              key={sIdx}
                              className="p-3 bg-[var(--surface)] rounded-xl border border-[var(--border-subtle)] flex items-center justify-between text-xs"
                            >
                              <div className="flex items-center gap-2.5">
                                <Clock className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
                                <div>
                                  <span className="font-bold text-[var(--text-primary)] block">
                                    {sig.signalType.replace(/_/g, ' ')}
                                  </span>
                                  {sig.metadata && Object.keys(sig.metadata).length > 0 && (
                                    <span className="text-[11px] text-[var(--text-secondary)]">
                                      {sig.metadata.message || JSON.stringify(sig.metadata)}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <span className="text-[11px] text-[var(--text-secondary)] font-mono">
                                {new Date(sig.timestamp).toLocaleTimeString()}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Semantic Similarity Reports */}
                    {attemptDetails?.similarityReports?.length > 0 && (
                      <div className="space-y-3 pt-2">
                        <h4 className="font-bold text-amber-500 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                          <FileText className="w-4 h-4" />
                          Potentially Similar Response Signal Detected
                        </h4>

                        <div className="space-y-2.5">
                          {attemptDetails.similarityReports.map((rep, rIdx) => (
                            <div key={rIdx} className="p-3 bg-[var(--surface)] border border-amber-500/30 rounded-xl space-y-2">
                              <div className="flex items-center justify-between text-xs">
                                <span className="font-bold text-[var(--text-primary)]">
                                  Match with {rep.comparedStudentId?.name || 'Student'}: {rep.similarityScore}% Similarity
                                </span>
                                <Badge variant="warning">Requires Review</Badge>
                              </div>
                              <p className="text-[11px] text-[var(--text-secondary)] font-serif italic bg-[var(--surface-muted)] p-2 rounded border border-[var(--border-subtle)]">
                                "{rep.flaggedSnippet}"
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Human Review Action Form */}
                    <form onSubmit={handleSaveReview} className="p-4 bg-[var(--surface-muted)] border border-[var(--border)] rounded-xl space-y-3">
                      <h4 className="font-bold text-[var(--text-primary)] uppercase tracking-wider text-[11px]">
                        Instructor Human Review Decision
                      </h4>

                      <div>
                        <label className="block text-[11px] font-bold text-[var(--text-secondary)] mb-1">
                          Review Status
                        </label>
                        <select
                          value={reviewStatus}
                          onChange={(e) => setReviewStatus(e.target.value)}
                          className="w-full px-3 py-2 text-xs bg-[var(--surface)] border border-[var(--border)] rounded-lg text-[var(--text-primary)]"
                        >
                          <option value="UNREVIEWED">Unreviewed</option>
                          <option value="UNDER_REVIEW">Under Review</option>
                          <option value="REVIEWED">Reviewed (No Misconduct)</option>
                          <option value="DISMISSED">Dismissed / Flagged</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-[var(--text-secondary)] mb-1">
                          Instructor Review Note
                        </label>
                        <textarea
                          rows={2}
                          value={instructorNote}
                          onChange={(e) => setInstructorNote(e.target.value)}
                          placeholder="e.g. Reviewed fullscreen exits; environmental context verified. No misconduct found."
                          className="w-full px-3 py-2 text-xs bg-[var(--surface)] border border-[var(--border)] rounded-lg text-[var(--text-primary)]"
                        />
                      </div>

                      <div className="flex justify-end gap-2 pt-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedAttempt(null);
                            setAttemptDetails(null);
                          }}
                        >
                          Cancel
                        </Button>
                        <Button variant="primary" size="sm" type="submit" loading={isSubmittingReview} icon={Check}>
                          Save Integrity Review
                        </Button>
                      </div>
                    </form>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
};

export default ProctoringDashboardPage;
