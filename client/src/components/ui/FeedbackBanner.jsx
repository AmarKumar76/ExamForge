import React from 'react';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

export const FeedbackBanner = ({ type, message, onClose }) => {
  if (!message) return null;

  const isSuccess = type === 'success';

  return (
    <div className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center justify-between transition-all animate-in fade-in slide-in-from-top-2 duration-300 ${
      isSuccess 
        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-400'
        : 'bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400'
    }`}>
      <div className="flex items-center gap-2">
        {isSuccess ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
        <span>{message}</span>
      </div>
      {onClose && (
        <button onClick={onClose} className="cursor-pointer ml-4 shrink-0 hover:opacity-70 transition-opacity">
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
