import React from 'react';
import { Card } from './Card';

export const StepCard = ({ 
  stepNumber, 
  icon: Icon, 
  title, 
  description,
  isLast = false 
}) => {
  return (
    <div className="relative flex-1">
      <Card className="p-6 h-full flex flex-col justify-between hover:border-[var(--primary)] transition-all">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-3xl font-black text-[var(--primary)]/30 font-mono tracking-tighter">
              {stepNumber}
            </span>
            <div className="w-10 h-10 rounded-xl bg-[var(--primary-light)] text-[var(--primary)] flex items-center justify-center">
              {Icon && <Icon className="w-5 h-5" />}
            </div>
          </div>

          <h3 className="text-base font-bold text-[var(--text-primary)]">
            {title}
          </h3>

          <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
            {description}
          </p>
        </div>

        <div className="pt-4 mt-4 border-t border-[var(--border-subtle)] flex items-center gap-2 text-[10px] font-bold text-[var(--primary)] uppercase tracking-wider">
          <span>Phase {stepNumber}</span>
        </div>
      </Card>
    </div>
  );
};
