import React from 'react';
import { Sparkles } from 'lucide-react';

export const SectionHeader = ({ 
  badge, 
  title, 
  subtitle, 
  align = 'center',
  className = '' 
}) => {
  const alignClasses = align === 'left' ? 'text-left' : 'text-center max-w-3xl mx-auto';

  return (
    <div className={`space-y-4 mb-12 md:mb-16 ${alignClasses} ${className}`}>
      {badge && (
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--primary-light)] text-[var(--primary)] text-xs font-bold border border-[var(--primary-border)] shadow-xs">
          <Sparkles className="w-3.5 h-3.5" />
          <span>{badge}</span>
        </div>
      )}

      {title && (
        <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-[var(--text-primary)] leading-tight">
          {title}
        </h2>
      )}

      {subtitle && (
        <p className="text-base text-[var(--text-secondary)] leading-relaxed">
          {subtitle}
        </p>
      )}
    </div>
  );
};
