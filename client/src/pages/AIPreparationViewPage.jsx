import React, { useState, useEffect } from 'react';
import { AppShell } from '../components/layout/AppShell';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Sparkles, BrainCircuit, ArrowRight, RefreshCw, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { examService } from '../services/examService';

export const AIPreparationViewPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('Overview');
  const [completedExams, setCompletedExams] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchExams = async () => {
      try {
        setIsLoading(true);
        const res = await examService.getStudentExams();
        if (res.success && Array.isArray(res.data?.exams)) {
          const completed = res.data.exams.filter(
            (e) => e.myAttempt && (e.myAttempt.status === 'SUBMITTED' || e.myAttempt.status === 'GRADED')
          );
          setCompletedExams(completed);
        }
      } catch (err) {
        setError('Failed to load performance data.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchExams();
  }, []);

  if (isLoading) {
    return (
      <AppShell title="AI Preparation">
        <div className="p-12 text-center text-xs text-[var(--text-secondary)]">
          <RefreshCw className="w-8 h-8 text-[var(--primary)] animate-spin mx-auto mb-4" />
          Loading your AI preparation analysis...
        </div>
      </AppShell>
    );
  }

  if (error) {
    return (
      <AppShell title="AI Preparation">
        <div className="p-12 text-center text-xs text-red-500">
          <AlertCircle className="w-8 h-8 mx-auto mb-4" />
          {error}
        </div>
      </AppShell>
    );
  }

  if (completedExams.length === 0) {
    return (
      <AppShell title="AI Preparation">
        <div className="space-y-6 max-w-6xl mx-auto">
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">AI Preparation</h1>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">Personalized preparation based on your exam performance.</p>
          </div>
          <div className="p-12 text-center bg-[var(--surface)] border border-[var(--border)] rounded-2xl">
            <Sparkles className="w-12 h-12 text-[var(--primary)] mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2">Awaiting Assessment Data</h3>
            <p className="text-xs text-[var(--text-secondary)] mb-6 max-w-md mx-auto">
              You haven't completed any official exams yet. The AI needs actual result data to analyze your strengths and weaknesses.
            </p>
            <Button variant="primary" onClick={() => navigate('/student/courses')}>
              View Available Courses
            </Button>
          </div>
        </div>
      </AppShell>
    );
  }

  const latestExam = completedExams[0];
  const attempt = latestExam.myAttempt || {};
  const aiAnalysis = attempt.aiAnalysis || {};
  
  const weakTopics = aiAnalysis.weakTopics || [];
  const strengths = aiAnalysis.strengths || [];
  const recommendations = aiAnalysis.recommendations || [];

  return (
    <AppShell title="AI Preparation">
      <div className="space-y-6 max-w-6xl mx-auto">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">AI Preparation</h1>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">Personalized preparation based on your exam performance.</p>
        </div>

        {/* Overview Navigation Tabs */}
        <div className="flex border-b border-[var(--border)] gap-6 text-xs font-semibold text-[var(--text-secondary)]">
          {['Overview', 'Learning Analysis', 'Study Plan', 'Practice', 'Progress'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-2.5 transition-all ${activeTab === tab ? 'border-b-2 border-[var(--primary)] text-[var(--primary)] font-bold' : 'hover:text-[var(--text-primary)]'}`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* 2-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Learning Overview */}
          <div className="lg:col-span-7 space-y-6">
            <Card title="Learning Overview">
              <div className="grid grid-cols-3 gap-2 text-center p-3 bg-[var(--surface-muted)] rounded-[var(--radius-lg)] mb-4">
                <div><span className="text-xl font-bold text-[var(--primary)]">{attempt.percentage}%</span><span className="text-[10px] text-[var(--text-secondary)] block">Latest Score</span></div>
                <div><span className="text-xl font-bold text-[var(--error)]">{weakTopics.length}</span><span className="text-[10px] text-[var(--text-secondary)] block">Weak Areas</span></div>
                <div><span className="text-xl font-bold text-[var(--success)]">{strengths.length}</span><span className="text-[10px] text-[var(--text-secondary)] block">Strong Areas</span></div>
              </div>

              <h4 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2">AI Learning Analysis</h4>
              <div className="space-y-2">
                {weakTopics.map((t, i) => (
                  <div key={`weak-${i}`} className="flex items-center justify-between p-3 bg-[var(--background)] rounded-[var(--radius-md)] border border-[var(--border-subtle)]">
                    <div>
                      <h5 className="text-xs font-bold text-[var(--text-primary)]">{t}</h5>
                      <span className="text-[11px] font-bold text-[var(--error)]">Needs Revision</span>
                    </div>
                    <Badge variant="error">Weak</Badge>
                  </div>
                ))}
                {strengths.map((t, i) => (
                  <div key={`strong-${i}`} className="flex items-center justify-between p-3 bg-[var(--background)] rounded-[var(--radius-md)] border border-[var(--border-subtle)]">
                    <div>
                      <h5 className="text-xs font-bold text-[var(--text-primary)]">{t}</h5>
                      <span className="text-[11px] font-bold text-[var(--success)]">Solid Knowledge</span>
                    </div>
                    <Badge variant="success">Strong</Badge>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Right Column: Gemini Recommendation Card */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-[var(--primary-light)] border border-[var(--primary-border)] rounded-[var(--radius-lg)] p-6 space-y-4">
              <div className="flex items-center gap-2 text-[var(--primary)]">
                <Sparkles className="w-5 h-5" />
                <h3 className="text-sm font-bold">Gemini Recommendation</h3>
              </div>

              <p className="text-xs text-[var(--primary)] leading-relaxed">
                Based on your recent performance, here are your personalized AI recommendations:
              </p>

              <ul className="text-xs font-semibold text-[var(--primary)] space-y-1.5 pl-4 list-disc">
                {recommendations.length > 0 ? (
                  recommendations.map((rec, i) => <li key={i}>{rec}</li>)
                ) : (
                  <li>Maintain current study habits.</li>
                )}
              </ul>

              <Button variant="primary" size="md" className="w-full" icon={ArrowRight} onClick={() => navigate('/student/practice/generate')}>
                Generate Practice Assessment →
              </Button>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
};
