import React, { useState } from 'react';
import { liveExamMockData } from '../mockData';
import { Clock, ShieldCheck, ArrowRight, ArrowLeft, Bookmark } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useNavigate } from 'react-router-dom';

export const LiveExamPage = () => {
  const navigate = useNavigate();
  const data = liveExamMockData;
  const [selectedOption, setSelectedOption] = useState(data.question.selectedOption);

  return (
    <div className="min-h-screen bg-[var(--background)] flex flex-col">
      {/* Top Header Runner Bar */}
      <header className="h-16 bg-[var(--surface)] border-b border-[var(--border)] px-6 flex items-center justify-between sticky top-0 z-30">
        <div>
          <h2 className="text-base font-bold text-[var(--text-primary)]">{data.examTitle}</h2>
          <p className="text-xs text-[var(--text-secondary)]">{data.courseCode}</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 text-red-600 rounded-[var(--radius-md)] border border-red-200 font-bold text-sm">
            <Clock className="w-4 h-4" />
            <span>{data.remainingTime}</span>
          </div>

          <Button variant="danger" size="md" onClick={() => navigate('/student/exam/submitted')}>
            Submit Exam
          </Button>
        </div>
      </header>

      {/* Main Examination Grid */}
      <div className="flex-1 p-6 max-w-7xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Question Palette Sidebar */}
        <div className="lg:col-span-4 bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-lg)] p-5 space-y-4">
          <h3 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Question Palette</h3>
          
          <div className="grid grid-cols-5 gap-2">
            {data.palette.map((item) => (
              <button
                key={item.number}
                className={`w-9 h-9 rounded-[var(--radius-sm)] text-xs font-bold transition-all ${
                  item.number === data.currentQuestionIndex
                    ? 'bg-[var(--primary)] text-white ring-2 ring-offset-1 ring-[var(--primary)]'
                    : item.status === 'Answered'
                    ? 'bg-[var(--primary-light)] text-[var(--primary)] border border-[var(--primary-border)]'
                    : item.status === 'Marked'
                    ? 'bg-amber-100 text-amber-700 border border-amber-300'
                    : 'bg-[var(--surface-muted)] text-[var(--text-secondary)] border border-[var(--border)]'
                }`}
              >
                {item.number}
              </button>
            ))}
          </div>

          <div className="pt-3 border-t border-[var(--border-subtle)] space-y-1.5 text-xs text-[var(--text-secondary)] font-medium">
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-[var(--primary-light)] border border-[var(--primary-border)]" /> Answered</div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-amber-100 border border-amber-300" /> Marked for Review</div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-[var(--surface-muted)] border border-[var(--border)]" /> Not Answered</div>
          </div>
        </div>

        {/* Active Question Display Card */}
        <div className="lg:col-span-8 bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-lg)] p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-4">
            <span className="text-xs font-bold text-[var(--primary)]">Question {data.question.number} of {data.totalQuestions}</span>
            <Button variant="ghost" size="sm" icon={Bookmark}>Mark for Review</Button>
          </div>

          <h3 className="text-base font-bold text-[var(--text-primary)] leading-relaxed">
            {data.question.text}
          </h3>

          {/* Options */}
          <div className="space-y-3">
            {data.question.options.map((opt, i) => {
              const letter = opt.charAt(0);
              const isSelected = selectedOption === letter;
              return (
                <div
                  key={i}
                  onClick={() => setSelectedOption(letter)}
                  className={`p-4 rounded-[var(--radius-md)] text-xs font-medium border cursor-pointer transition-all flex items-center justify-between ${
                    isSelected
                      ? 'bg-[var(--primary-light)] border-[var(--primary)] text-[var(--primary)] shadow-sm'
                      : 'bg-[var(--background)] border-[var(--border)] text-[var(--text-primary)] hover:border-[var(--primary-border)]'
                  }`}
                >
                  <span>{opt}</span>
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${isSelected ? 'border-[var(--primary)] bg-[var(--primary)]' : 'border-[var(--border)]'}`}>
                    {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom Bar */}
          <div className="pt-4 border-t border-[var(--border-subtle)] flex justify-between">
            <Button variant="secondary" size="md" icon={ArrowLeft}>Previous</Button>
            <Button variant="primary" size="md" icon={ArrowRight}>Next Question</Button>
          </div>
        </div>
      </div>
    </div>
  );
};
