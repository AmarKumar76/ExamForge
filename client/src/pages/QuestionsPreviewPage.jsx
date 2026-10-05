import React, { useState } from 'react';
import { AppShell } from '../components/layout/AppShell';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { aiQuestionStudioMockData } from '../mockData';
import { Check, Edit, RefreshCw, X, FolderKanban } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const QuestionsPreviewPage = () => {
  const navigate = useNavigate();
  const questions = aiQuestionStudioMockData.generatedQuestions;
  const [activeFilter, setActiveFilter] = useState('All');

  return (
    <AppShell title="Generated Questions Preview">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">Generated Questions</h1>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              Review and edit AI-generated questions before saving
            </p>
          </div>
          <Button variant="primary" size="md" icon={FolderKanban} onClick={() => navigate('/instructor/question-bank')}>
            Save All Approved to Bank
          </Button>
        </div>

        {/* Filter Badges */}
        <div className="flex items-center gap-2">
          {['All (10)', 'MCQ (6)', 'Short Answer (2)', 'Descriptive (2)'].map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter.split(' ')[0])}
              className={`px-3 py-1 text-xs font-semibold rounded-[var(--radius-sm)] border transition-all ${
                activeFilter === filter.split(' ')[0]
                  ? 'bg-[var(--primary)] text-white border-[var(--primary)]'
                  : 'bg-[var(--surface)] text-[var(--text-secondary)] border-[var(--border)] hover:bg-[var(--surface-muted)]'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>

        {/* Question Cards List */}
        <div className="space-y-4">
          {questions.map((q, index) => (
            <Card key={q.id} className="relative">
              <div className="flex flex-col md:flex-row items-start justify-between gap-4">
                {/* Question Details */}
                <div className="space-y-3 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[var(--primary)]">Question {index + 1}</span>
                    <Badge variant="neutral">{q.type}</Badge>
                  </div>

                  <p className="text-sm font-semibold text-[var(--text-primary)] leading-relaxed">{q.text}</p>

                  {/* Options for MCQ */}
                  {q.options && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      {q.options.map((opt, i) => (
                        <div
                          key={i}
                          className={`p-2.5 rounded-[var(--radius-md)] text-xs border ${
                            opt.startsWith(q.correctAnswer)
                              ? 'bg-[var(--primary-light)] border-[var(--primary-border)] font-semibold text-[var(--primary)]'
                              : 'bg-[var(--background)] border-[var(--border-subtle)] text-[var(--text-primary)]'
                          }`}
                        >
                          {opt}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-3">
                    <Button variant="primary" size="sm" icon={Check}>Accept</Button>
                    <Button variant="secondary" size="sm" icon={Edit}>Edit</Button>
                    <Button variant="outline" size="sm" icon={RefreshCw}>Regenerate</Button>
                    <Button variant="ghost" size="sm" icon={X} className="text-[var(--error)] hover:bg-[var(--error-light)]">Reject</Button>
                  </div>
                </div>

                {/* Metadata Sidebar */}
                <div className="md:w-56 p-3 bg-[var(--surface-muted)] rounded-[var(--radius-md)] border border-[var(--border-subtle)] space-y-2 text-xs shrink-0">
                  <div>
                    <span className="text-[var(--text-secondary)] block text-[10px]">Difficulty</span>
                    <span className="font-bold text-[var(--success)]">{q.difficulty}</span>
                  </div>
                  <div>
                    <span className="text-[var(--text-secondary)] block text-[10px]">Topic</span>
                    <span className="font-medium text-[var(--text-primary)]">{q.topic}</span>
                  </div>
                  {q.source && (
                    <div>
                      <span className="text-[var(--text-secondary)] block text-[10px]">Source</span>
                      <span className="font-medium text-[var(--text-primary)] truncate block">{q.source}</span>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </AppShell>
  );
};
