import React from 'react';

export const ProgressBar = ({ value = 0, max = 100, label, showPercentage = true, color = 'primary', className = '' }) => {
  const percentage = Math.min(100, Math.max(0, Math.round((value / max) * 100)));

  const colorClasses = {
    primary: 'bg-[var(--primary)]',
    secondary: 'bg-[var(--secondary)]',
    accent: 'bg-[var(--accent)]',
    warning: 'bg-[var(--warning)]',
    error: 'bg-[var(--error)]',
    success: 'bg-[var(--success)]',
  };

  return (
    <div className={`w-full ${className}`}>
      {(label || showPercentage) && (
        <div className="flex justify-between items-center text-xs text-[var(--text-secondary)] mb-1.5 font-medium">
          {label && <span>{label}</span>}
          {showPercentage && <span>{percentage}%</span>}
        </div>
      )}
      <div className="w-full h-2.5 bg-[var(--surface-muted)] rounded-[var(--radius-full)] overflow-hidden border border-[var(--border-subtle)]">
        <div
          className={`h-full transition-all duration-500 rounded-[var(--radius-full)] ${colorClasses[color] || colorClasses.primary}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

export const ProgressRing = ({ value = 0, size = 80, strokeWidth = 8, label, sublabel }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (value / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="var(--surface-muted)"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="var(--primary)"
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <div className="absolute text-center flex flex-col items-center justify-center">
        <span className="text-lg font-bold text-[var(--text-primary)]">{value}%</span>
        {sublabel && <span className="text-[10px] text-[var(--text-secondary)]">{sublabel}</span>}
      </div>
    </div>
  );
};
