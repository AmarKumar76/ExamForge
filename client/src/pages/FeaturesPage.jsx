import React from 'react';
import { featureCardsMockData } from '../mockData';
import { Sparkles, FolderKanban, ShieldCheck, GraduationCap, BarChart3, ScanFace, BrainCircuit, ArrowRight } from 'lucide-react';
import { Button } from '../components/ui/Button';

export const FeaturesPage = () => {
  const iconMap = {
    Sparkles,
    FolderKanban,
    ShieldCheck,
    GraduationCap,
    BarChart3,
    ScanFace,
    BrainCircuit,
  };

  return (
    <div id="features" className="py-16 bg-[var(--background)]">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-3xl font-bold text-[var(--text-primary)]">Everything you need for modern assessments</h2>
          <p className="text-sm text-[var(--text-secondary)] mt-2">
            Powerful features to create, conduct, grade and analyze exams efficiently.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {featureCardsMockData.map((feat) => {
            const Icon = iconMap[feat.icon] || Sparkles;
            return (
              <div
                key={feat.id}
                className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-lg)] p-6 hover:shadow-[var(--shadow-md)] hover:border-[var(--primary-border)] transition-all duration-200 flex flex-col justify-between"
              >
                <div>
                  <div className="w-12 h-12 rounded-[var(--radius-md)] bg-[var(--primary-light)] text-[var(--primary)] flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-[var(--text-primary)] mb-2">{feat.title}</h3>
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{feat.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
