import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import {
  Award,
  CheckCircle2,
  XCircle,
  Sparkles,
  ArrowRight,
  BookOpen,
  RotateCcw,
} from 'lucide-react';

export const StudentResultPage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const attempt = location.state?.attempt || null;
  const exam = location.state?.exam || null;

  if (!attempt) {
    return (
      <AppShell title="Exam Results">
        <div className="p-12 text-center max-w-md mx-auto space-y-4 bg-[var(--surface)] rounded-2xl border border-[var(--border)] mt-8">
          <Award className="w-8 h-8 text-[var(--primary)] mx-auto" />
          <h3 className="text-base font-bold text-[var(--text-primary)]">No Exam Submission Selected</h3>
          <p className="text-xs text-[var(--text-secondary)]">Please select a completed exam from your dashboard to view full analysis.</p>
          <Button variant="primary" size="sm" onClick={() => navigate('/student/dashboard')}>
            Back to Student Portal
          </Button>
        </div>
      </AppShell>
    );
  }

  const aiAnalysis = attempt.aiAnalysis || {};

  return (
    <AppShell title="Exam Performance & AI Analysis">
      <div className="space-y-6 max-w-4xl pb-12">
        {/* Result Header Banner */}
        <div className="bg-[var(--surface)] p-6 rounded-2xl border border-[var(--border)] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant={attempt.passed ? 'success' : 'danger'}>
                {attempt.passed ? 'PASSED' : 'NEEDS PRACTICE'}
              </Badge>
              <span className="text-xs text-[var(--text-secondary)] font-semibold">
                Submitted: {new Date(attempt.submittedAt || Date.now()).toLocaleString()}
              </span>
            </div>
            <h1 className="text-xl font-bold text-[var(--text-primary)]">{exam?.title || 'Course Examination'}</h1>
            <p className="text-xs text-[var(--text-secondary)]">
              {exam?.courseId?.code || 'CS301'} — {exam?.courseId?.name || 'Academic Course'}
            </p>
          </div>

          <div className="flex items-center gap-4 bg-[var(--surface-muted)] p-4 rounded-xl border border-[var(--border-subtle)] text-center shrink-0">
            <div>
              <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase block">Score</span>
              <span className="text-2xl font-black text-[var(--primary)]">{attempt.totalScore}</span>
              <span className="text-[10px] text-[var(--text-secondary)]">/ {exam?.totalMarks || 100}</span>
            </div>
            <div className="h-8 w-px bg-[var(--border)]" />
            <div>
              <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase block">Percentage</span>
              <span className="text-2xl font-black text-[var(--text-primary)]">{attempt.percentage}%</span>
            </div>
          </div>
        </div>

        {/* AI Performance Breakdown Card */}
        <div className="bg-[var(--surface)] p-6 rounded-2xl border border-[var(--primary-border)] shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[var(--primary)]" />
            AI Personalized Performance Analysis & Preparation Strategy
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* Strengths */}
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

            {/* Weak Topics */}
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

          {/* AI Preparation Recommendations */}
          <div className="p-4 bg-[var(--primary-light)]/20 rounded-xl border border-[var(--primary-light)] text-xs space-y-2">
            <span className="font-bold text-[var(--primary)] block">AI Practice Recommendations:</span>
            <ul className="space-y-1 text-[var(--text-primary)] list-disc list-inside">
              {(aiAnalysis.recommendations?.length > 0 ? aiAnalysis.recommendations : ['Continue maintaining your study schedule.']).map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* Detailed Question Answers Breakdown */}
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
          <Button variant="ghost" size="sm" onClick={() => navigate('/student/dashboard')}>
            Return to Dashboard
          </Button>
          <Button variant="primary" size="sm" icon={Sparkles} onClick={() => navigate('/student/ai-prep')}>
            Generate Practice Set
          </Button>
        </div>
      </div>
    </AppShell>
  );
};
