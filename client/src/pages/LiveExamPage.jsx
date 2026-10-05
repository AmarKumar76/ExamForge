import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { examService } from '../services/examService';
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  X,
  FileText,
  Send,
  HelpCircle,
  RefreshCw,
} from 'lucide-react';

export const LiveExamPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [attempt, setAttempt] = useState(location.state?.attempt || null);
  const [exam, setExam] = useState(location.state?.exam || null);
  const [isLoadingSession, setIsLoadingSession] = useState(false);

  const [userAnswers, setUserAnswers] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Remaining time calculation in seconds
  const [timeLeft, setTimeLeft] = useState((exam?.duration || 60) * 60);

  useEffect(() => {
    const examIdFromUrl = searchParams.get('examId') || (exam?._id || exam?.id);

    if ((!exam || !attempt) && examIdFromUrl) {
      const resumeSession = async () => {
        try {
          setIsLoadingSession(true);
          setError(null);
          const res = await examService.startAttempt(examIdFromUrl);
          if (res.success && res.data?.attempt) {
            setAttempt(res.data.attempt);
            setExam(res.data.exam);
            const durationMins = res.data.exam.duration || 60;
            const startedAt = res.data.attempt.startedAt ? new Date(res.data.attempt.startedAt).getTime() : Date.now();
            const elapsedSeconds = Math.floor((Date.now() - startedAt) / 1000);
            const remainingSeconds = Math.max(durationMins * 60 - elapsedSeconds, 10);
            setTimeLeft(remainingSeconds);
          }
        } catch (err) {
          setError(err.message || 'Failed to resume exam session.');
        } finally {
          setIsLoadingSession(false);
        }
      };
      resumeSession();
    }
  }, [searchParams]);

  useEffect(() => {
    if (!exam || !attempt) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [exam, attempt]);

  useEffect(() => {
    if (attempt && attempt.answers && Array.isArray(attempt.answers)) {
      const initialAnswers = {};
      attempt.answers.forEach(ans => {
        initialAnswers[ans.questionId] = {
          selectedOption: ans.selectedOption || '',
          textAnswer: ans.textAnswer || ''
        };
      });
      setUserAnswers(prev => Object.keys(prev).length === 0 ? initialAnswers : prev);
    }
  }, [attempt]);

  const [saveTimeout, setSaveTimeout] = useState(null);

  const saveAnswersToBackend = async (answersObj) => {
    if (!attempt) return;
    try {
      const formattedAnswers = Object.entries(answersObj).map(([qId, val]) => ({
        questionId: qId,
        selectedOption: val.selectedOption || '',
        textAnswer: val.textAnswer || '',
      }));
      await examService.saveProgress(attempt.id || attempt._id, formattedAnswers);
    } catch (err) {
      console.error('Failed to auto-save answers:', err);
    }
  };

  const debouncedSave = (newAnswers) => {
    if (saveTimeout) clearTimeout(saveTimeout);
    setSaveTimeout(setTimeout(() => {
      saveAnswersToBackend(newAnswers);
    }, 1500));
  };

  const handleOptionSelect = (qId, option) => {
    setUserAnswers((prev) => {
      const updated = { ...prev, [qId]: { ...prev[qId], selectedOption: option } };
      debouncedSave(updated);
      return updated;
    });
  };

  const handleTextAnswerChange = (qId, text) => {
    setUserAnswers((prev) => {
      const updated = { ...prev, [qId]: { ...prev[qId], textAnswer: text } };
      debouncedSave(updated);
      return updated;
    });
  };

  const handleAutoSubmit = () => {
    handleSubmit();
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!attempt || !exam) return;

    try {
      setIsSubmitting(true);
      setError(null);

      const formattedAnswers = Object.entries(userAnswers).map(([qId, val]) => ({
        questionId: qId,
        selectedOption: val.selectedOption || '',
        textAnswer: val.textAnswer || '',
      }));

      const res = await examService.submitAttempt(attempt.id || attempt._id, formattedAnswers);
      if (res.success && res.data?.attempt) {
        navigate('/student/exam/submitted', { state: { attempt: res.data.attempt, exam } });
      }
    } catch (err) {
      setError(err.message || 'Failed to submit exam attempt.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  if (isLoadingSession) {
    return (
      <AppShell title="Live Examination">
        <div className="p-12 text-center max-w-md mx-auto space-y-4 bg-[var(--surface)] rounded-2xl border border-[var(--border)] mt-8">
          <RefreshCw className="w-8 h-8 text-[var(--primary)] animate-spin mx-auto" />
          <h3 className="text-base font-bold text-[var(--text-primary)]">Initializing Exam Session</h3>
          <p className="text-xs text-[var(--text-secondary)]">Loading your persisted questions from database...</p>
        </div>
      </AppShell>
    );
  }

  if (error && (!exam || !attempt)) {
    return (
      <AppShell title="Live Examination">
        <div className="p-12 text-center max-w-md mx-auto space-y-4 bg-[var(--surface)] rounded-2xl border border-[var(--border)] mt-8">
          <AlertCircle className="w-8 h-8 text-red-500 mx-auto" />
          <h3 className="text-base font-bold text-[var(--text-primary)]">Exam Session Error</h3>
          <p className="text-xs text-[var(--text-secondary)]">{error}</p>
          <Button variant="primary" size="sm" onClick={() => navigate('/student/dashboard')}>
            Back to Dashboard
          </Button>
        </div>
      </AppShell>
    );
  }

  const questions = exam?.questionIds || [];

  return (
    <AppShell title={exam?.title || 'Live Examination'}>
      <div className="space-y-6 max-w-4xl pb-16">
        {/* Sticky Exam Banner */}
        <div className="sticky top-16 z-20 bg-[var(--surface)] p-5 rounded-2xl border border-[var(--border)] shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-lg font-bold text-[var(--text-primary)]">{exam?.title}</h1>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              {exam?.courseId?.code} — {exam?.courseId?.name} • Total Questions: {questions.length}
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3.5 py-1.5 bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 rounded-xl font-mono text-sm font-bold">
              <Clock className="w-4 h-4 animate-pulse" />
              <span>Time Left: {formatTime(timeLeft)}</span>
            </div>
            <Button variant="primary" size="sm" icon={Send} loading={isSubmitting} onClick={handleSubmit}>
              Submit Exam
            </Button>
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

        {/* Exam Questions List */}
        <div className="space-y-6">
          {questions.map((q, idx) => {
            const qId = q.id || q._id;
            const currentAns = userAnswers[qId] || {};

            return (
              <div key={qId} className="bg-[var(--surface)] p-6 rounded-2xl border border-[var(--border)] shadow-xs space-y-4 text-xs">
                <div className="flex items-start justify-between gap-3 border-b border-[var(--border-subtle)] pb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-[var(--primary-light)] text-[var(--primary)] flex items-center justify-center font-bold text-xs shrink-0">
                      {idx + 1}
                    </span>
                    <Badge variant="primary">{q.type}</Badge>
                    <Badge variant="neutral">{q.difficulty}</Badge>
                  </div>
                  <span className="text-[11px] font-semibold text-[var(--text-secondary)]">Topic: {q.topic || 'General'}</span>
                </div>

                <p className="text-sm font-bold text-[var(--text-primary)] leading-relaxed">{q.questionText}</p>

                {/* Question Options */}
                {(q.type === 'MCQ' || q.type === 'TRUE_FALSE') && (
                  <div className="space-y-2 pt-2">
                    {(q.options?.length > 0 ? q.options : ['True', 'False']).map((opt, oIdx) => {
                      const isSelected = currentAns.selectedOption === opt;
                      return (
                        <label
                          key={oIdx}
                          className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center gap-3 text-xs font-semibold ${
                            isSelected
                              ? 'bg-[var(--primary-light)]/30 border-[var(--primary)] text-[var(--primary)]'
                              : 'bg-[var(--background)] border-[var(--border-subtle)] hover:border-[var(--primary-border)] text-[var(--text-primary)]'
                          }`}
                        >
                          <input
                            type="radio"
                            name={`q_${qId}`}
                            value={opt}
                            checked={isSelected}
                            onChange={() => handleOptionSelect(qId, opt)}
                            className="w-4 h-4 text-[var(--primary)] focus:ring-[var(--primary)]"
                          />
                          <span>{opt}</span>
                        </label>
                      );
                    })}
                  </div>
                )}

                {q.type === 'SHORT_ANSWER' && (
                  <div className="pt-2">
                    <textarea
                      rows={3}
                      placeholder="Write your short answer response here..."
                      value={currentAns.textAnswer || ''}
                      onChange={(e) => handleTextAnswerChange(qId, e.target.value)}
                      className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-xl text-xs text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex justify-end pt-4">
          <Button variant="primary" size="md" icon={Send} loading={isSubmitting} onClick={handleSubmit}>
            Submit Official Exam
          </Button>
        </div>
      </div>
    </AppShell>
  );
};
