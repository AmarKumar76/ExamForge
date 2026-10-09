import React, { useState, useEffect } from 'react';
import { AppShell } from '../components/layout/AppShell';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Sparkles, BrainCircuit, ArrowRight, RefreshCw, AlertCircle } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { examService } from '../services/examService';

export const GeneratePracticePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const attempt = location.state?.attempt;

  const [topic, setTopic] = useState('');
  const [courseId, setCourseId] = useState('');
  const [weakTopics, setWeakTopics] = useState([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const init = async () => {
       setIsLoading(true);
       try {
          if (attempt && attempt.aiAnalysis && attempt.examId) {
             setWeakTopics(attempt.aiAnalysis.weakTopics || []);
             setCourseId(attempt.examId.courseId?._id || attempt.examId.courseId || attempt.courseId);
             if (attempt.aiAnalysis.weakTopics?.length > 0) {
                setTopic(attempt.aiAnalysis.weakTopics[0]);
             }
          } else {
             const res = await examService.getStudentExams();
             if (res.success && res.data?.exams) {
                const completed = res.data.exams.filter(e => e.myAttempt && e.myAttempt.status === 'PUBLISHED');
                if (completed.length > 0) {
                   const latest = completed[0];
                   setWeakTopics(latest.myAttempt.aiAnalysis?.weakTopics || []);
                   setCourseId(latest.courseId?._id || latest.courseId);
                   if (latest.myAttempt.aiAnalysis?.weakTopics?.length > 0) {
                      setTopic(latest.myAttempt.aiAnalysis.weakTopics[0]);
                   }
                }
             }
          }
       } catch (err) {
         console.error(err);
       } finally {
         setIsLoading(false);
       }
    };
    init();
  }, [attempt]);

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!topic || !courseId) {
      setError('Select a valid topic from your weak areas.');
      return;
    }
    
    try {
      setIsGenerating(true);
      const res = await examService.generatePractice(topic, courseId);
      if (res.success) {
         navigate('/student/practice');
      }
    } catch (err) {
      console.error(err);
      setError('Failed to generate practice assessment.');
    } finally {
      setIsGenerating(false);
    }
  };

  if (isLoading) {
     return (
       <AppShell title="Generate Practice Assessment">
         <div className="p-12 text-center text-xs text-[var(--text-secondary)]">
           <RefreshCw className="w-8 h-8 text-[var(--primary)] animate-spin mx-auto mb-4" />
           Loading...
         </div>
       </AppShell>
     );
  }
  
  if (weakTopics.length === 0) {
     return (
       <AppShell title="Generate Practice Assessment">
         <div className="p-16 text-center bg-[var(--surface)] border border-[var(--border)] rounded-2xl max-w-4xl mx-auto mt-8">
           <BrainCircuit className="w-12 h-12 text-[var(--primary)] mx-auto mb-4 opacity-50" />
           <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2">No Weak Topics Identified</h3>
           <p className="text-xs text-[var(--text-secondary)] mb-6 max-w-md mx-auto">
             You need a published exam result with identified weak areas to generate a personalized practice assessment.
           </p>
           <Button variant="primary" onClick={() => navigate('/student/dashboard')}>
             Back to Dashboard
           </Button>
         </div>
       </AppShell>
     );
  }

  return (
    <AppShell title="Generate Practice Assessment">
      <div className="space-y-6 max-w-4xl mx-auto">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Create Practice Assessment</h1>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">Practice based on your learning gaps.</p>
        </div>

        {error && (
          <div className="p-3.5 bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 rounded-xl text-xs font-semibold flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              <span>{error}</span>
            </div>
            <button onClick={() => setError(null)} className="cursor-pointer">✕</button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-7">
            <Card title="Practice Configuration">
              <form onSubmit={handleGenerate} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">Concept Focus (Weak Areas)</label>
                  <select
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs bg-[var(--surface-muted)] border border-[var(--border)] rounded-[var(--radius-md)] text-[var(--text-primary)]"
                  >
                    {weakTopics.map((wt, idx) => (
                       <option key={idx} value={wt}>{wt}</option>
                    ))}
                  </select>
                </div>

                <div className="pt-2">
                  <Button variant="primary" size="md" className="w-full" icon={Sparkles} onClick={handleGenerate} loading={isGenerating}>
                    Generate with Gemini →
                  </Button>
                </div>
              </form>
            </Card>
          </div>

          <div className="lg:col-span-5">
            <div className="bg-[var(--primary-light)] border border-[var(--primary-border)] rounded-[var(--radius-lg)] p-5 space-y-3">
              <div className="flex items-center gap-2 text-[var(--primary)]">
                <BrainCircuit className="w-5 h-5" />
                <h4 className="text-xs font-bold">AI Recommendation</h4>
              </div>

              <p className="text-xs text-[var(--primary)] leading-relaxed">
                Based on your previous official performance:
              </p>

              <ul className="text-xs font-medium text-[var(--primary)] space-y-1.5 pl-4 list-disc">
                <li>Focusing on: {topic}</li>
                <li>Generated using Gemini and official course material</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
};
