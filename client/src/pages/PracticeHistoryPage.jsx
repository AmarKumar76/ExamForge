import React, { useState, useEffect } from 'react';
import { AppShell } from '../components/layout/AppShell';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Target, Search, RefreshCw, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { examService } from '../services/examService';

export const PracticeHistoryPage = () => {
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setIsLoading(true);
        const res = await examService.getPracticeHistory();
        if (res.success) {
          setHistory(res.data || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchHistory();
  }, []);

  return (
    <AppShell title="Practice History">
      <div className="space-y-6 max-w-5xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">Practice History</h1>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">Your practice assessments and improvement over time.</p>
          </div>
          <Button variant="primary" size="sm" onClick={() => navigate('/student/ai-prep')}>
             AI Preparation Hub
          </Button>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-xs text-[var(--text-secondary)]">
            <RefreshCw className="w-8 h-8 text-[var(--primary)] animate-spin mx-auto mb-4" />
            Loading history...
          </div>
        ) : history.length === 0 ? (
          <div className="p-16 text-center bg-[var(--surface)] border border-[var(--border)] rounded-2xl">
            <Target className="w-12 h-12 text-[var(--primary)] mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2">No Practice History</h3>
            <p className="text-xs text-[var(--text-secondary)] mb-6 max-w-md mx-auto">
              You haven't generated any AI practice assessments yet. Practice helps reinforce concepts identified as weak in your official exams.
            </p>
            <Button variant="primary" onClick={() => navigate('/student/dashboard')}>
              View Dashboard
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {history.map(item => (
               <div key={item._id} className="p-5 bg-[var(--surface)] border border-[var(--border)] rounded-2xl flex flex-col gap-4 shadow-sm hover:border-[var(--primary-border)] transition-colors">
                 <div className="flex justify-between items-start">
                   <div>
                     <h3 className="font-bold text-[var(--text-primary)]">{item.title}</h3>
                     <p className="text-xs text-[var(--text-secondary)] mt-1">{item.courseId?.code} — {item.courseId?.name}</p>
                   </div>
                   <Badge variant="success">Completed</Badge>
                 </div>
                 <div className="flex justify-between items-end mt-2">
                   <div>
                     <span className="text-2xl font-black text-[var(--primary)]">{item.percentage}%</span>
                     <span className="text-[10px] text-[var(--text-secondary)] block uppercase font-bold tracking-wider">Score</span>
                   </div>
                   <div className="text-right">
                     <span className="text-xs text-[var(--text-secondary)] block mb-2">{new Date(item.createdAt).toLocaleDateString()}</span>
                     <Button variant="outline" size="sm" icon={ArrowRight} onClick={() => alert("Practice detailed view coming soon.")}>
                       View Result
                     </Button>
                   </div>
                 </div>
               </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
};
