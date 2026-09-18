import React from 'react';
import { FolderOpen } from 'lucide-react';
import { Button } from './Button';

export const EmptyState = ({
  title = 'No Data Found',
  description = 'There are no records to display for this view.',
  actionLabel,
  onAction,
  icon: Icon = FolderOpen
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-10 text-center card-glass rounded-xl border border-slate-800">
      <div className="p-4 rounded-full bg-slate-800/80 text-slate-400 mb-4 border border-slate-700/50">
        <Icon className="w-8 h-8" />
      </div>
      <h4 className="text-base font-bold text-slate-200">{title}</h4>
      <p className="text-xs text-slate-400 mt-1 max-w-sm">{description}</p>
      {actionLabel && onAction && (
        <div className="mt-5">
          <Button onClick={onAction} size="sm">
            {actionLabel}
          </Button>
        </div>
      )}
    </div>
  );
};
