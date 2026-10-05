import React from 'react';
import { Card } from './Card';

export const FeatureCard = ({ 
  icon: Icon, 
  title, 
  description, 
  badge,
  accentColor = 'var(--primary)' 
}) => {
  return (
    <Card className="p-6 transition-all duration-300 hover:shadow-[var(--shadow-lg)] hover:-translate-y-1 group">
      <div className="flex items-start justify-between mb-4">
        <div 
          className="w-12 h-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110"
          style={{ backgroundColor: 'var(--primary-light)', color: accentColor }}
        >
          {Icon && <Icon className="w-6 h-6" />}
        </div>
        {badge && (
          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[var(--primary-light)] text-[var(--primary)] border border-[var(--primary-border)]">
            {badge}
          </span>
        )}
      </div>

      <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2 group-hover:text-[var(--primary)] transition-colors">
        {title}
      </h3>

      <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
        {description}
      </p>
    </Card>
  );
};
