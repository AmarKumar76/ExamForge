import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import { examService } from '../services/examService';
import {
  Award,
  CheckCircle2,
  XCircle,
  Sparkles,
  ArrowRight,
  RefreshCw,
  Clock,
  AlertCircle,
  FileText
} from 'lucide-react';

export const StudentResultPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [attempt, setAttempt] = useState(location.state?.attempt || null);
  const [exam, setExam] = useState(location.state?.exam || null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const attemptId = searchParams.get('attemptId') || attempt?._id || attempt?.id;
    if (attemptId) {
      const fetchResult = async () => {
        try {
          setLoading(true);
          const res = await examService.getAttemptDetails(attemptId);
          if (res.data?.attempt) {
            setAttempt(res.data.attempt);
            if (res.data.attempt.examId) {
                setExam(res.data.attempt.examId);
            }
          }
        } catch (err) {
          setError('Failed to load result details.');
        } finally {
          setLoading(false);
        }
      };
      fetchResult();
    } else {
      const fetchHistory = async () => {
         try {
           setLoading(true);
           const res = await examService.getStudentExams();
           if (res.success && res.data?.exams) {
              const completed = res.data.exams.filter(e => e.myAttempt && ['SUBMITTED', 'GRADED', 'PUBLISHED'].includes(e.myAttempt.status));
              setHistory(completed);
           }
         } catch(err) {
           setError('Failed to load history.');
         } finally {
           setLoading(false);
         }
      };
      fetchHistory();
    }
  }, [searchParams]);

  if (loading) {
    return (
      <AppShell title="Exam Results">
        <div className="p-12 text-center max-w-md mx-auto space-y-4">
          <RefreshCw className="w-8 h-8 text-[var(--primary)] animate-spin mx-auto" />
          <p className="text-xs">Loading result...</p>
        </div>
      </AppShell>
    );
  }

  if (error) {
    return (
      <AppShell title="Exam Results">
        <div className="p-12 text-center max-w-md mx-auto space-y-4 bg-[var(--surface)] rounded-2xl border mt-8">
          <AlertCircle className="w-8 h-8 text-red-500 mx-auto" />
          <h3 className="text-base font-bold text-[var(--text-primary)]">{error}</h3>
          <Button variant="primary" size="sm" onClick={() => navigate('/student/dashboard')}>
            Back to Dashboard
          </Button>
        </div>
      </AppShell>
    );
  }

  // If no attempt is explicitly opened, show list
  if (!attempt) {
     return (
       <AppShell title="Exam Results">
         <div className="space-y-6 max-w-4xl mx-auto">
           <div>
             <h1 className="text-2xl font-bold text-[var(--text-primary)]">Exam Results & History</h1>
             <p className="text-xs text-[var(--text-secondary)] mt-0.5">View your past submissions and AI performance analysis.</p>
           </div>

           {history.length === 0 ? (
             <div className="p-12 text-center max-w-md mx-auto space-y-4 bg-[var(--surface)] rounded-2xl border mt-8 shadow-sm">
               <FileText className="w-12 h-12 text-[var(--text-muted)] mx-auto" />
               <h3 className="text-xl font-bold text-[var(--text-primary)]">No Exams Attempted</h3>
               <p className="text-sm text-[var(--text-secondary)]">You haven't completed any exams yet.</p>
             </div>
           ) : (
             <div className="space-y-4">
               {history.map(examItem => {
                 const att = examItem.myAttempt;
                 const isPublished = att.status === 'PUBLISHED';
                 return (
                   <div key={examItem._id || examItem.id} className="p-5 bg-[var(--surface)] border border-[var(--border)] rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm hover:border-[var(--primary-border)] transition-colors">
                     <div>
                       <h3 className="font-bold text-[var(--text-primary)]">{examItem.title}</h3>
                       <p className="text-xs text-[var(--text-secondary)] mt-1">{examItem.courseId?.code} — {examItem.courseId?.name}</p>
                       <p className="text-xs text-[var(--text-secondary)] mt-1 font-mono">Submitted: {new Date(att.submittedAt).toLocaleString()}</p>
                     </div>
                     <div className="flex flex-col items-end gap-2 shrink-0">
                       {isPublished ? (
                          <>
                             <Badge variant={att.passed ? 'success' : 'danger'}>{att.passed ? 'Passed' : 'Needs Practice'}</Badge>
                             <div className="text-right">
                               <span className="text-xl font-black text-[var(--primary)]">{att.percentage}%</span>
                               <span className="text-[10px] text-[var(--text-secondary)] block uppercase tracking-wider font-bold">Score</span>
                             </div>
                          </>
                       ) : (
                          <>
                             <Badge variant="warning">Under Instructor Review</Badge>
                             <span className="text-xs text-[var(--text-secondary)] italic">Result not yet published</span>
                          </>
                       )}
                       <Button variant="outline" size="sm" icon={ArrowRight} onClick={() => setAttempt(att)}>
                         View Details
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
  }

  // Attempt detail view
  if (attempt.status !== 'PUBLISHED') {
    return (
      <AppShell title="Exam Results">
        <div className="p-12 text-center max-w-md mx-auto space-y-4 bg-[var(--surface)] rounded-2xl border mt-8 shadow-sm">
          <Clock className="w-12 h-12 text-amber-500 mx-auto" />
          <h3 className="text-xl font-bold text-[var(--text-primary)]">Under Instructor Review</h3>
          <p className="text-sm text-[var(--text-secondary)]">Your exam was submitted successfully and is awaiting instructor grading/publication.</p>
          <Button variant="outline" size="sm" onClick={() => setAttempt(null)}>
            Back to History
          </Button>
        </div>
      </AppShell>
    );
  }

  const aiAnalysis = attempt.aiAnalysis || {};

  return (
    <AppShell title="Exam Performance & AI Analysis">
      <div className="space-y-6 max-w-4xl pb-12">
        <Button variant="ghost" size="sm" onClick={() => setAttempt(null)} className="mb-2">
           &larr; Back to History
        </Button>

        <div className="bg-[var(--surface)] p-6 rounded-2xl border border-[var(--border)] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant={attempt.passed ? 'success' : 'danger'}>
                {attempt.passed ? 'PASSED' : 'NEEDS PRACTICE'}
              </Badge>
              <span className="text-xs text-[var(--text-secondary)] font-semibold">
                Published: {attempt.resultPublishedAt ? new Date(attempt.resultPublishedAt).toLocaleString() : new Date().toLocaleString()}
              </span>
            </div>
            <h1 className="text-xl font-bold text-[var(--text-primary)]">{exam?.title || attempt.examId?.title || 'Course Examination'}</h1>
          </div>

          <div className="flex items-center gap-4 bg-[var(--surface-muted)] p-4 rounded-xl border border-[var(--border-subtle)] text-center shrink-0">
            <div>
              <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase block">Score</span>
              <span className="text-2xl font-black text-[var(--primary)]">{attempt.totalScore}</span>
            </div>
            <div className="h-8 w-px bg-[var(--border)]" />
            <div>
              <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase block">Percentage</span>
              <span className="text-2xl font-black text-[var(--text-primary)]">{attempt.percentage}%</span>
            </div>
          </div>
        </div>

        <div className="bg-[var(--surface)] p-6 rounded-2xl border border-[var(--primary-border)] shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[var(--primary)]" />
            AI Personalized Performance Analysis & Preparation Strategy
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 bg-[var(--background)] rounded-xl border border-[var(--border-subtle)] space-y-2">
              <span className="font-bold text-emerald-600 dark:text-emerald-400 block flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                Demonstrated Topic Strengths
              </span>
              <ul className="space-y-1 text-[var(--text-secondary)] list-disc list-inside">
                {(aiAnalysis.strengths?.length > 0 ? aiAnalysis.strengths : ['Solid comprehension of exam topics.']).map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>

            <div className="p-4 bg-[var(--background)] rounded-xl border border-[var(--border-subtle)] space-y-2">
              <span className="font-bold text-amber-600 dark:text-amber-400 block flex items-center gap-1.5">
                <XCircle className="w-4 h-4" />
                Topics Requiring Revision
              </span>
              <ul className="space-y-1 text-[var(--text-secondary)] list-disc list-inside">
                {(aiAnalysis.weakTopics?.length > 0 ? aiAnalysis.weakTopics : ['None identified. Excellent performance!']).map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="p-4 bg-[var(--primary-light)]/20 rounded-xl border border-[var(--primary-light)] text-xs space-y-2">
            <span className="font-bold text-[var(--primary)] block">AI Practice Recommendations:</span>
            <ul className="space-y-1 text-[var(--text-primary)] list-disc list-inside">
              {(aiAnalysis.recommendations?.length > 0 ? aiAnalysis.recommendations : ['Continue maintaining your study schedule.']).map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
          </div>
        </div>

        {attempt.answers?.length > 0 && (
          <Card title="Detailed Question Breakdown">
            <div className="space-y-4 text-xs">
              {attempt.answers.map((ans, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-xl border space-y-2 ${
                    ans.isCorrect ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-red-500/5 border-red-500/20'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[var(--text-primary)]">Question {idx + 1}</span>
                    <Badge variant={ans.isCorrect ? 'success' : 'danger'}>
                      {ans.isCorrect ? `+${ans.marksObtained} Marks` : '0 Marks'}
                    </Badge>
                  </div>
                  <div className="text-[11px] text-[var(--text-secondary)]">
                    <span>Your Answer: <strong>{ans.selectedOption || ans.textAnswer || 'Not Answered'}</strong></span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="ghost" size="sm" onClick={() => setAttempt(null)}>
            Return to History
          </Button>
          <Button variant="primary" size="sm" icon={Sparkles} onClick={() => navigate('/student/practice/generate', { state: { attempt } })}>
            Generate Practice Set
          </Button>
        </div>
      </div>
    </AppShell>
  );
};
