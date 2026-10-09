import React, { useEffect } from 'react';
import { Button } from './Button';
import { AlertTriangle } from 'lucide-react';

export const ConfirmModal = ({ isOpen, message, onConfirm, onCancel, title = "Confirm Action", isDestructive = false, showCancel = true }) => {
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape' && isOpen && showCancel && onCancel) {
        onCancel();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onCancel, showCancel]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] p-4 backdrop-blur-xs animate-in fade-in duration-200" onClick={showCancel ? onCancel : undefined}>
      <div 
        className="bg-[var(--surface)] p-6 rounded-2xl max-w-sm w-full shadow-2xl border border-[var(--border)] space-y-4 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          {isDestructive && (
            <div className="p-2 bg-red-500/10 text-red-500 rounded-full shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
          )}
          <div className="space-y-1 pt-1">
            <h3 className="text-base font-bold text-[var(--text-primary)]">{title}</h3>
            <p className="text-sm font-medium text-[var(--text-secondary)]">{message}</p>
          </div>
        </div>
        <div className="flex gap-3 justify-end pt-2">
          {showCancel && <Button variant="ghost" size="sm" onClick={onCancel}>Cancel</Button>}
          <Button variant={isDestructive ? 'danger' : 'primary'} size="sm" onClick={onConfirm}>
            {showCancel ? 'Confirm' : 'OK'}
          </Button>
        </div>
      </div>
    </div>
  );
};
