import React from 'react';

export const LoadingSpinner = ({ label = 'Loading...' }) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-slate-400">
      <div className="w-8 h-8 border-3 border-sky-500/30 border-t-sky-500 rounded-full animate-spin mb-3"></div>
      <span className="text-xs font-medium tracking-wide">{label}</span>
    </div>
  );
};
