import React from 'react';

export const StatCard = ({ title, value, icon: Icon, trend, color = 'primary', className = '' }) => {
  return (
    <div className={`bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-lg)] p-5 shadow-[var(--shadow-sm)] flex items-center justify-between ${className}`}>
      <div>
        <p className="text-xs font-medium text-[var(--text-secondary)]">{title}</p>
        <h4 className="text-2xl font-bold text-[var(--text-primary)] mt-1">{value}</h4>
        {trend && (
          <p className={`text-xs mt-1.5 font-medium ${trend.isPositive ? 'text-[var(--success)]' : 'text-[var(--accent)]'}`}>
            {trend.isPositive ? '↑' : '↓'} {trend.value}
          </p>
        )}
      </div>
      {Icon && (
        <div className="w-12 h-12 rounded-[var(--radius-md)] bg-[var(--primary-light)] text-[var(--primary)] flex items-center justify-center shrink-0">
          <Icon className="w-6 h-6" />
        </div>
      )}
    </div>
  );
};
