import React from 'react';

export const ProgressBar = ({ percentage, color = 'sky', height = 'h-2', showLabel = false }) => {
  const clamped = Math.min(Math.max(percentage || 0, 0), 100);

  const colors = {
    sky: 'bg-sky-500',
    emerald: 'bg-emerald-500',
    amber: 'bg-amber-500',
    rose: 'bg-rose-500',
    indigo: 'bg-indigo-500',
    purple: 'bg-purple-500',
    dynamic: clamped >= 100 ? 'bg-rose-500' : clamped >= 80 ? 'bg-amber-500' : 'bg-emerald-500'
  };

  return (
    <div className="w-full">
      {showLabel && (
        <div className="flex justify-between items-center text-xs font-bold text-slate-600 mb-1">
          <span>Progress</span>
          <span>{clamped.toFixed(1)}%</span>
        </div>
      )}
      <div className={`w-full bg-slate-100 rounded-full overflow-hidden ${height}`}>
        <div
          className={`${colors[color] || colors.sky} ${height} rounded-full transition-all duration-500 ease-out`}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
};
