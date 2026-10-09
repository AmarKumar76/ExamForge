import React, { useState, useEffect } from 'react';
import { AppShell } from '../components/layout/AppShell';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { FeedbackBanner } from '../components/ui/FeedbackBanner';
import { ConfirmModal as ConfirmModalDialog } from '../components/ui/ConfirmModal';
import { examService } from '../services/examService';
import { RefreshCw, AlertCircle, FileText, CheckCircle2, ArrowRight, ShieldAlert, Check, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const InstructorResultsPage = () => {
  const navigate = useNavigate();
  const [exams, setExams] = useState([]);
  const [selectedExam, setSelectedExam] = useState(null);
  const [attempts, setAttempts] = useState([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isAttemptsLoading, setIsAttemptsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Confirmation modal state
  const [confirmModal, setConfirmModal] = useState(null); // { message, onConfirm }

  const [selectedAttempts, setSelectedAttempts] = useState([]);

  useEffect(() => {
    const fetchExams = async () => {
      try {
        setIsLoading(true);
        const res = await examService.getInstructorExams();
        if (res.success && res.data?.exams) {
          setExams(res.data.exams);
        }
      } catch (err) {
        setError(err.message || 'Failed to load exams.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchExams();
  }, []);

  const handleSelectExam = async (exam) => {
    setSelectedExam(exam);
    setSelectedAttempts([]);
    setSuccess(null);
    setError(null);
    try {
      setIsAttemptsLoading(true);
      const res = await examService.getInstructorExamAttempts(exam._id || exam.id);
      if (res.success && res.data) {
        setAttempts(res.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to load exam attempts.');
    } finally {
      setIsAttemptsLoading(false);
    }
  };

  const handlePublish = (attemptId) => {
    setConfirmModal({
      message: 'Release this result to the student?',
      onConfirm: async () => {
        setConfirmModal(null);
        try {
          const res = await examService.publishResult(attemptId);
          if (res.success) {
            setAttempts((prev) =>
              prev.map((a) =>
                a.attempt && (a.attempt._id === attemptId || a.attempt.id === attemptId)
                  ? { ...a, attempt: { ...a.attempt, status: 'PUBLISHED' } }
                  : a
              )
            );
            setSuccess('Result released to student successfully.');
          }
        } catch (err) {
          setError(err.message || 'Failed to publish result.');
        }
      },
    });
  };

  const handleBulkPublish = () => {
    const count = selectedAttempts.length;
    setConfirmModal({
      message: `Release results for ${count} student${count !== 1 ? 's' : ''}?`,
      onConfirm: async () => {
        setConfirmModal(null);
        let successCount = 0;
        const ids = [...selectedAttempts];
        for (const id of ids) {
          try {
            await examService.publishResult(id);
            successCount++;
          } catch (err) {
            console.error('Failed to publish', id, err);
          }
        }
        if (successCount > 0) {
          setAttempts((prev) =>
            prev.map((a) =>
              a.attempt && ids.includes(a.attempt._id || a.attempt.id)
                ? { ...a, attempt: { ...a.attempt, status: 'PUBLISHED' } }
                : a
            )
          );
          setSelectedAttempts([]);
          setSuccess(`Successfully released ${successCount} result${successCount !== 1 ? 's' : ''}.`);
        }
      },
    });
  };

  const toggleSelect = (id) => {
    if (selectedAttempts.includes(id)) {
      setSelectedAttempts(selectedAttempts.filter(a => a !== id));
    } else {
      setSelectedAttempts([...selectedAttempts, id]);
    }
  };

  const [reviewAttempt, setReviewAttempt] = useState(null);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'IN_PROGRESS': return <Badge variant="neutral">In Progress</Badge>;
      case 'SUBMITTED': return <Badge variant="warning font-bold">Submitted</Badge>;
      case 'GRADED': return <Badge variant="warning font-bold">Under Review</Badge>;
      case 'PUBLISHED': return <Badge variant="success font-bold">Published</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <AppShell title="Results Management">
        <div className="p-12 text-center max-w-md mx-auto space-y-4">
          <RefreshCw className="w-8 h-8 text-[var(--primary)] animate-spin mx-auto" />
          <p className="text-xs">Loading...</p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title="Results Management">
      <div className="space-y-6 pb-12">
        {/* Confirmation Modal */}
        <ConfirmModalDialog 
          isOpen={!!confirmModal} 
          message={confirmModal?.message}
          onConfirm={confirmModal?.onConfirm}
          onCancel={() => setConfirmModal(null)}
          title="Publish Results"
        />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">Exam Results Review</h1>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">Manage academic integrity and release student exam results.</p>
          </div>
          {selectedExam && (
            <Button variant="outline" size="sm" onClick={() => setSelectedExam(null)}>
              &larr; Back to Exams
            </Button>
          )}
        </div>

        <FeedbackBanner type="success" message={success} onClose={() => setSuccess(null)} />
        <FeedbackBanner type="error" message={error} onClose={() => setError(null)} />

        {!selectedExam ? (
          <Card title="Select an Exam">
            {exams.length === 0 ? (
              <div className="p-8 text-center text-xs text-[var(--text-secondary)]">No exams found.</div>
            ) : (
              <div className="space-y-3">
                {exams.filter(e => ['PUBLISHED', 'SCHEDULED', 'ENDED', 'COMPLETED'].includes(e.status)).map(exam => (
                  <div key={exam._id || exam.id} className="p-4 border rounded-xl flex items-center justify-between hover:border-[var(--primary)] transition-colors cursor-pointer" onClick={() => handleSelectExam(exam)}>
                    <div>
                      <h4 className="font-bold text-sm text-[var(--text-primary)]">{exam.title}</h4>
                      <p className="text-xs text-[var(--text-secondary)]">{exam.courseId?.code} — {exam.courseId?.name}</p>
                    </div>
                    <div className="flex items-center gap-4 text-xs">
                      <div className="text-center">
                        <span className="block font-bold">{exam.metrics?.totalAttempts || 0}</span>
                        <span className="text-[10px] text-[var(--text-secondary)] uppercase">Attempted</span>
                      </div>
                      <div className="text-center">
                        <span className="block font-bold">{exam.metrics?.submittedAttempts || 0}</span>
                        <span className="text-[10px] text-[var(--text-secondary)] uppercase">Submitted</span>
                      </div>
                      <ArrowRight className="w-4 h-4 text-[var(--text-muted)]" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-[var(--surface)] p-4 rounded-xl border border-[var(--border)] shadow-xs">
                <p className="text-[10px] uppercase font-bold text-[var(--text-secondary)]">Total Enrolled</p>
                <p className="text-xl font-black text-[var(--text-primary)]">{selectedExam.metrics?.totalEnrolledStudents || 0}</p>
              </div>
              <div className="bg-[var(--surface)] p-4 rounded-xl border border-[var(--border)] shadow-xs">
                <p className="text-[10px] uppercase font-bold text-[var(--text-secondary)]">Submitted</p>
                <p className="text-xl font-black text-[var(--text-primary)]">{selectedExam.metrics?.submittedAttempts || 0}</p>
              </div>
              <div className="bg-[var(--surface)] p-4 rounded-xl border border-[var(--border)] shadow-xs">
                <p className="text-[10px] uppercase font-bold text-[var(--text-secondary)]">Average Score</p>
                <p className="text-xl font-black text-[var(--text-primary)]">{selectedExam.metrics?.averageScore || 0}%</p>
              </div>
              <div className="bg-[var(--surface)] p-4 rounded-xl border border-[var(--border)] shadow-xs">
                <p className="text-[10px] uppercase font-bold text-[var(--text-secondary)]">Pass Rate</p>
                <p className="text-xl font-black text-[var(--text-primary)]">
                  {attempts.length > 0 ? Math.round((attempts.filter(a => a.attempt?.passed).length / attempts.length) * 100) : 0}%
                </p>
              </div>
            </div>

            <Card title="Student Submissions & Integrity Review">
              <div className="mb-4 flex justify-between items-center">
                <div className="text-xs text-[var(--text-secondary)]">
                  {selectedAttempts.length} selected
                </div>
                {selectedAttempts.length > 0 && (
                  <Button variant="primary" size="sm" icon={Check} onClick={handleBulkPublish}>
                    Release Selected Results
                  </Button>
                )}
              </div>

              {isAttemptsLoading ? (
                <div className="p-8 text-center text-xs text-[var(--text-secondary)]"><RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" /> Loading attempts...</div>
              ) : attempts.length === 0 ? (
                <div className="p-8 text-center text-xs text-[var(--text-secondary)]">No student attempts found for this exam.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b text-[var(--text-secondary)]">
                        <th className="p-2"><input type="checkbox" onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedAttempts(attempts.filter(a => a.attempt && (a.attempt.status === 'SUBMITTED' || a.attempt.status === 'GRADED')).map(a => a.attempt._id || a.attempt.id));
                          } else {
                            setSelectedAttempts([]);
                          }
                        }} /></th>
                        <th className="p-2">Student</th>
                        <th className="p-2">Status</th>
                        <th className="p-2">Score</th>
                        <th className="p-2">Result Release</th>
                        <th className="p-2">Integrity Risk</th>
                        <th className="p-2">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border-subtle)]">
                      {attempts.map(row => {
                        const att = row.attempt;
                        const student = row.student;

                        if (!att) {
                          return (
                            <tr key={student._id} className="hover:bg-[var(--surface-muted)] transition-colors">
                              <td className="p-2"><input type="checkbox" disabled /></td>
                              <td className="p-2">
                                <div className="font-bold text-[var(--text-primary)]">{student.name}</div>
                                <div className="text-[10px] text-[var(--text-secondary)]">{student.email}</div>
                              </td>
                              <td className="p-2"><Badge variant="neutral">Not Attempted</Badge></td>
                              <td className="p-2">—</td>
                              <td className="p-2">—</td>
                              <td className="p-2">—</td>
                              <td className="p-2">—</td>
                            </tr>
                          );
                        }

                        const isEligible = att.status === 'SUBMITTED' || att.status === 'GRADED';
                        const attemptId = att._id || att.id;
                        const risk = att.integritySummary?.riskLevel || (att.integritySignals?.length > 3 ? 'MEDIUM' : (att.integritySignals?.length > 0 ? 'LOW' : 'NONE'));

                        return (
                          <tr key={attemptId} className="hover:bg-[var(--surface-muted)] transition-colors">
                            <td className="p-2">
                              <input type="checkbox" disabled={!isEligible} checked={selectedAttempts.includes(attemptId)} onChange={() => toggleSelect(attemptId)} />
                            </td>
                            <td className="p-2">
                              <div className="font-bold text-[var(--text-primary)]">{student.name}</div>
                              <div className="text-[10px] text-[var(--text-secondary)]">{student.email}</div>
                            </td>
                            <td className="p-2">{getStatusBadge(att.status)}</td>
                            <td className="p-2 font-bold text-[var(--primary)]">
                              {att.status !== 'IN_PROGRESS' ? `${att.percentage}% (${att.totalScore})` : '—'}
                            </td>
                            <td className="p-2">
                              {att.status === 'PUBLISHED' ? <Badge variant="success">Published</Badge> : (att.status !== 'IN_PROGRESS' ? <Badge variant="warning">Under Review</Badge> : <Badge variant="neutral">Not Ready</Badge>)}
                            </td>
                            <td className="p-2">
                              {risk === 'HIGH' && <Badge variant="danger">HIGH ({att.integritySignals?.length || 0})</Badge>}
                              {risk === 'MEDIUM' && <Badge variant="warning">MEDIUM ({att.integritySignals?.length || 0})</Badge>}
                              {risk === 'LOW' && <Badge variant="neutral">LOW ({att.integritySignals?.length || 0})</Badge>}
                              {risk === 'NONE' && <span className="text-[var(--text-muted)]">—</span>}
                            </td>
                            <td className="p-2 flex gap-2">
                              <Button variant="ghost" size="sm" onClick={() => setReviewAttempt({ student, attempt: att })}>View</Button>
                              {isEligible && (
                                <Button variant="outline" size="sm" onClick={() => handlePublish(attemptId)}>Release Result</Button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>

            {reviewAttempt && (
              <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-xs">
                <div className="bg-[var(--surface)] p-6 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto space-y-6 shadow-2xl border border-[var(--border)]">
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="text-xl font-bold text-[var(--text-primary)]">Student Attempt & Integrity Review</h2>
                      <p className="text-xs text-[var(--text-secondary)]">{reviewAttempt.student.name} ({reviewAttempt.student.email})</p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setReviewAttempt(null)}>Close</Button>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div className="p-4 border rounded-xl bg-[var(--background)]">
                      <p className="text-[var(--text-secondary)] uppercase font-bold text-[10px]">Score</p>
                      <p className="text-2xl font-black text-[var(--primary)]">{reviewAttempt.attempt.percentage}%</p>
                    </div>
                    <div className="p-4 border rounded-xl bg-[var(--background)]">
                      <p className="text-[var(--text-secondary)] uppercase font-bold text-[10px]">Status</p>
                      <p className="text-base font-black text-[var(--text-primary)] mt-1">{getStatusBadge(reviewAttempt.attempt.status)}</p>
                    </div>
                  </div>

                  {/* Comprehensive Instructor Integrity Dashboard */}
                  <div className="p-5 border border-[var(--border)] rounded-2xl bg-[var(--background)] space-y-4 text-xs">
                    <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
                      <div className="flex items-center gap-2">
                        <ShieldAlert className="w-5 h-5 text-[var(--primary)]" />
                        <h3 className="font-bold text-sm text-[var(--text-primary)]">Academic Integrity & Proctoring Analysis</h3>
                      </div>
                      {(() => {
                        const risk = reviewAttempt.attempt.integritySummary?.riskLevel || (reviewAttempt.attempt.integritySignals?.length > 3 ? 'MEDIUM' : 'LOW');
                        if (risk === 'HIGH') return <Badge variant="danger">HIGH RISK</Badge>;
                        if (risk === 'MEDIUM') return <Badge variant="warning">MEDIUM RISK</Badge>;
                        return <Badge variant="success">LOW RISK</Badge>;
                      })()}
                    </div>

                    {reviewAttempt.attempt.integritySummary?.aiSummary && (
                      <div className="p-3 bg-[var(--surface)] border border-[var(--border)] rounded-xl space-y-1">
                        <p className="font-bold text-[var(--text-primary)] text-[11px]">AI Integrity Summary</p>
                        <p className="text-[var(--text-secondary)] leading-relaxed">{reviewAttempt.attempt.integritySummary.aiSummary}</p>
                        {reviewAttempt.attempt.integritySummary.aiRecommendation && (
                          <p className="text-[var(--primary)] font-semibold text-[11px] pt-1">
                            Recommendation: {reviewAttempt.attempt.integritySummary.aiRecommendation}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Signal Counts Breakdown Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                      {(() => {
                        const sigs = reviewAttempt.attempt.integritySignals || [];
                        const countMap = {};
                        sigs.forEach((s) => {
                          countMap[s.signalType] = (countMap[s.signalType] || 0) + 1;
                        });
                        return [
                          { label: 'Tab Switch', count: countMap['TAB_SWITCH'] || 0 },
                          { label: 'Fullscreen Exit', count: countMap['FULLSCREEN_EXIT'] || 0 },
                          { label: 'Face Absence', count: countMap['FACE_NOT_DETECTED'] || 0 },
                          { label: 'Multiple People', count: countMap['MULTIPLE_PERSON_DETECTED'] || 0 },
                          { label: 'Copy / Paste', count: (countMap['COPY_ATTEMPT'] || 0) + (countMap['PASTE_ATTEMPT'] || 0) },
                          { label: 'Unusual Timing', count: countMap['UNUSUAL_ANSWER_TIMING'] || 0 },
                        ].map((item, i) => (
                          <div key={i} className="p-2.5 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-center">
                            <span className="block font-black text-sm text-[var(--text-primary)]">{item.count}</span>
                            <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase">{item.label}</span>
                          </div>
                        ));
                      })()}
                    </div>

                    {/* Timeline */}
                    {reviewAttempt.attempt.integritySignals?.length > 0 ? (
                      <div className="space-y-2 pt-2">
                        <p className="font-bold text-[var(--text-primary)] text-[11px]">Signal Timeline</p>
                        <ul className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                          {reviewAttempt.attempt.integritySignals.map((sig, idx) => (
                            <li key={idx} className="p-2 rounded-lg bg-[var(--surface)] border border-[var(--border)] flex items-center justify-between text-[11px]">
                              <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-amber-500" />
                                <span className="font-bold text-[var(--text-primary)]">{sig.signalType}</span>
                                {sig.severity && (
                                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-[var(--background)] border border-[var(--border)] font-mono uppercase font-bold text-[var(--text-secondary)]">
                                    {sig.severity}
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] text-[var(--text-muted)] font-mono">
                                {new Date(sig.timestamp).toLocaleTimeString()}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : (
                      <p className="text-[11px] text-[var(--text-muted)] italic">No integrity signals were recorded during this attempt.</p>
                    )}

                    <p className="text-[10px] text-[var(--text-muted)] italic leading-tight pt-1">
                      Signals are indicators for instructor review and are not automatic proof of academic misconduct.
                    </p>

                    {/* Review Controls */}
                    <div className="pt-3 border-t border-[var(--border)] space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[11px] text-[var(--text-primary)]">Review Status:</span>
                        <Badge variant={reviewAttempt.attempt.integritySummary?.reviewStatus === 'REVIEWED' ? 'success' : reviewAttempt.attempt.integritySummary?.reviewStatus === 'FLAGGED' ? 'danger' : 'neutral'}>
                          {reviewAttempt.attempt.integritySummary?.reviewStatus || 'PENDING'}
                        </Badge>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 text-xs font-semibold"
                          onClick={async () => {
                            try {
                              await examService.updateReviewStatus(reviewAttempt.attempt._id || reviewAttempt.attempt.id, 'REVIEWED', 'Marked as reviewed by instructor');
                              setReviewAttempt({
                                ...reviewAttempt,
                                attempt: {
                                  ...reviewAttempt.attempt,
                                  integritySummary: { ...(reviewAttempt.attempt.integritySummary || {}), reviewStatus: 'REVIEWED' },
                                },
                              });
                              setSuccess('Review status marked as REVIEWED.');
                            } catch (e) {
                              setError('Failed to update review status.');
                            }
                          }}
                        >
                          Mark Reviewed
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          className="flex-1 text-xs font-semibold"
                          onClick={async () => {
                            try {
                              await examService.updateReviewStatus(reviewAttempt.attempt._id || reviewAttempt.attempt.id, 'FLAGGED', 'Flagged for further review');
                              setReviewAttempt({
                                ...reviewAttempt,
                                attempt: {
                                  ...reviewAttempt.attempt,
                                  integritySummary: { ...(reviewAttempt.attempt.integritySummary || {}), reviewStatus: 'FLAGGED' },
                                },
                              });
                              setSuccess('Attempt flagged for further review.');
                            } catch (e) {
                              setError('Failed to flag attempt.');
                            }
                          }}
                        >
                          Flag for Review
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-bold text-sm text-[var(--text-primary)]">Question Responses</h3>
                    {reviewAttempt.attempt.answers?.map((ans, idx) => (
                      <div key={idx} className={`p-4 rounded-xl border text-xs space-y-2 ${ans.isCorrect ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-red-500/30 bg-red-500/5'}`}>
                        <div className="flex justify-between items-start">
                          <span className="font-bold text-[var(--text-primary)]">Question {idx + 1}</span>
                          <Badge variant={ans.isCorrect ? 'success' : 'danger'}>
                            {ans.isCorrect ? '✓ Correct' : '✗ Incorrect'} ({ans.marksObtained} Marks)
                          </Badge>
                        </div>
                        {ans.questionId && ans.questionId.questionText && (
                          <p className="text-[var(--text-secondary)] pb-2 border-b border-[var(--border-subtle)]">{ans.questionId.questionText}</p>
                        )}
                        <div className="grid grid-cols-2 gap-4 mt-2">
                          <div>
                            <span className="block text-[10px] text-[var(--text-secondary)] uppercase font-bold">Student Answer</span>
                            <span className="font-medium text-[var(--text-primary)]">{ans.selectedOption || ans.textAnswer || '—'}</span>
                          </div>
                          {ans.questionId && (
                            <div>
                              <span className="block text-[10px] text-[var(--text-secondary)] uppercase font-bold">Correct Answer</span>
                              <span className="font-medium text-emerald-600 dark:text-emerald-400">{ans.questionId.correctAnswer || '—'}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
};
