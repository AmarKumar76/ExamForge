import React, { useState } from 'react';
import { AppShell } from '../components/layout/AppShell';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Sparkles, BrainCircuit, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const GeneratePracticePage = () => {
  const navigate = useNavigate();
  const [topic, setTopic] = useState('DBMS');
  const [concept, setConcept] = useState('Normalization');
  const [questionCount, setQuestionCount] = useState(10);
  const [difficulty, setDifficulty] = useState('Medium');

  return (
    <AppShell title="Generate Practice Assessment">
      <div className="space-y-6 max-w-4xl mx-auto">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Create Practice Assessment</h1>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">Practice based on your learning gaps.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Form */}
          <div className="lg:col-span-7">
            <Card title="Practice Configuration">
              <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">Topic</label>
                  <select
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs bg-[var(--surface-muted)] border border-[var(--border)] rounded-[var(--radius-md)] text-[var(--text-primary)]"
                  >
                    <option>DBMS</option>
                    <option>Operating Systems</option>
                    <option>Computer Networks</option>
                    <option>Data Structures</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">Concept Focus</label>
                  <select
                    value={concept}
                    onChange={(e) => setConcept(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs bg-[var(--surface-muted)] border border-[var(--border)] rounded-[var(--radius-md)] text-[var(--text-primary)]"
                  >
                    <option>Normalization</option>
                    <option>CPU Scheduling</option>
                    <option>TCP/IP</option>
                    <option>Trees</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">Number of Questions</label>
                  <input
                    type="number"
                    value={questionCount}
                    onChange={(e) => setQuestionCount(Number(e.target.value))}
                    className="w-full px-3.5 py-2 text-xs bg-[var(--surface-muted)] border border-[var(--border)] rounded-[var(--radius-md)] text-[var(--text-primary)]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">Difficulty</label>
                  <div className="flex gap-2">
                    {['Easy', 'Medium', 'Hard'].map((diff) => (
                      <button
                        key={diff}
                        type="button"
                        onClick={() => setDifficulty(diff)}
                        className={`flex-1 py-1.5 text-xs font-bold rounded-[var(--radius-sm)] border transition-all ${
                          difficulty === diff
                            ? 'bg-[var(--primary)] text-white border-[var(--primary)]'
                            : 'bg-[var(--surface)] text-[var(--text-secondary)] border-[var(--border)]'
                        }`}
                      >
                        {diff}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-2">
                  <Button variant="primary" size="md" className="w-full" icon={Sparkles} onClick={() => navigate('/student/practice/result')}>
                    Generate with Gemini →
                  </Button>
                </div>
              </form>
            </Card>
          </div>

          {/* Right Column: AI Recommendation Box */}
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
                <li>10 questions</li>
                <li>Medium difficulty</li>
                <li>Focus: Normalization</li>
                <li>Generated using Gemini and course material</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
};
