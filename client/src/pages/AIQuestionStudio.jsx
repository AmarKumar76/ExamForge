import React from 'react';
import { AppShell } from '../components/layout/AppShell';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { aiQuestionStudioMockData } from '../mockData';
import { UploadCloud, FileText, CheckCircle2, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const AIQuestionStudio = () => {
  const navigate = useNavigate();
  const files = aiQuestionStudioMockData.uploadedFiles;

  const steps = [
    { number: 1, label: 'Upload Material', active: true, completed: false },
    { number: 2, label: 'Configure', active: false, completed: false },
    { number: 3, label: 'Preview & Edit', active: false, completed: false },
    { number: 4, label: 'Save to Bank', active: false, completed: false },
  ];

  return (
    <AppShell title="AI Question Studio">
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">AI Question Studio</h1>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            Generate high-quality questions from your course material using AI
          </p>
        </div>

        {/* Stepper Bar */}
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-lg)] p-4 flex items-center justify-between overflow-x-auto">
          {steps.map((s, index) => (
            <React.Fragment key={s.number}>
              <div className="flex items-center gap-2 shrink-0">
                <div
                  className={`w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center ${
                    s.active
                      ? 'bg-[var(--primary)] text-white shadow-sm'
                      : s.completed
                      ? 'bg-[var(--success-light)] text-[var(--success)]'
                      : 'bg-[var(--surface-muted)] text-[var(--text-muted)]'
                  }`}
                >
                  {s.number}
                </div>
                <span
                  className={`text-xs font-semibold ${
                    s.active ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)]'
                  }`}
                >
                  {s.label}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div className="w-12 h-0.5 bg-[var(--border)] shrink-0 hidden sm:block" />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Upload Content Area */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          {/* Upload Dropzone */}
          <div className="md:col-span-6">
            <Card className="h-full">
              <div className="border-2 border-dashed border-[var(--border)] rounded-[var(--radius-lg)] p-8 text-center bg-[var(--background)] flex flex-col items-center justify-center min-h-[300px]">
                <div className="w-14 h-14 rounded-full bg-[var(--primary-light)] text-[var(--primary)] flex items-center justify-center mb-4">
                  <UploadCloud className="w-7 h-7" />
                </div>
                <h3 className="text-sm font-bold text-[var(--text-primary)]">Upload Course Material</h3>
                <p className="text-xs text-[var(--text-secondary)] mt-1 mb-4">
                  Supports PDF, DOC, PPT (Max 50MB)
                </p>
                <Button variant="primary" size="md" icon={UploadCloud}>
                  Upload File
                </Button>
                <p className="text-[11px] text-[var(--text-muted)] mt-3">or drag and drop files here</p>
              </div>
            </Card>
          </div>

          {/* Uploaded Files List */}
          <div className="md:col-span-6">
            <Card title="Uploaded Files" subtitle={`${files.length} documents ready for AI processing`}>
              <div className="space-y-3">
                {files.map((file) => (
                  <div
                    key={file.id}
                    className="p-3.5 bg-[var(--background)] rounded-[var(--radius-md)] border border-[var(--border-subtle)] flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-[var(--radius-sm)] bg-red-100 text-red-600 flex items-center justify-center font-bold text-xs">
                        PDF
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-[var(--text-primary)]">{file.name}</h4>
                        <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                          {file.size} • {file.status}
                        </p>
                      </div>
                    </div>
                    <Badge variant="success">
                      <CheckCircle2 className="w-3 h-3" /> Ready
                    </Badge>
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-4 border-t border-[var(--border-subtle)] flex justify-end">
                <Button variant="primary" size="md" icon={ArrowRight} onClick={() => navigate('/instructor/ai-studio/config')}>
                  Next: Configure Generation
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </AppShell>
  );
};
