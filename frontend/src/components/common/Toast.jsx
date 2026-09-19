import React from 'react';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

const Toast = ({ toast, onClose }) => {
  const { message, type } = toast;

  const typeStyles = {
    success: 'bg-emerald-600 text-white shadow-emerald-500/20',
    error: 'bg-rose-600 text-white shadow-rose-500/20',
    info: 'bg-blue-600 text-white shadow-blue-500/20',
    warning: 'bg-amber-500 text-white shadow-amber-500/20',
  };

  const icons = {
    success: <CheckCircle className="w-5 h-5 flex-shrink-0" />,
    error: <AlertCircle className="w-5 h-5 flex-shrink-0" />,
    info: <Info className="w-5 h-5 flex-shrink-0" />,
    warning: <AlertCircle className="w-5 h-5 flex-shrink-0" />,
  };

  return (
    <div
      className={`pointer-events-auto flex items-center justify-between gap-3 px-4 py-3 rounded-lg shadow-lg border border-white/10 transition-all duration-300 animate-in fade-in slide-in-from-bottom-5 max-w-md ${
        typeStyles[type] || typeStyles.info
      }`}
    >
      <div className="flex items-center gap-2.5">
        {icons[type] || icons.info}
        <p className="text-sm font-medium leading-snug">{message}</p>
      </div>
      <button
        onClick={onClose}
        className="p-1 hover:bg-white/20 rounded-md transition-colors"
        aria-label="Close Toast"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

export default Toast;
