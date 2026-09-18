import React from 'react';
import { useCurrency } from '../../context/CurrencyContext';
import { formatCurrency } from '../../utils/formatters';

export const StatCard = ({
  title,
  amount,
  isCurrency = true,
  subtitle,
  icon: Icon,
  color = 'sky',
  trend,
  className = ''
}) => {
  const { currency } = useCurrency();

  const colorStyles = {
    sky: 'bg-sky-50 text-sky-600 border-sky-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    rose: 'bg-rose-50 text-rose-600 border-rose-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    purple: 'bg-purple-50 text-purple-600 border-purple-100',
  };

  return (
    <div className={`card-kanakku bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-start justify-between relative overflow-hidden transition-all duration-200 hover:shadow-md ${className}`}>
      <div className="z-10">
        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{title}</p>
        <h3 className="text-2xl font-black text-slate-900 mt-1.5 tracking-tight">
          {isCurrency ? formatCurrency(amount, currency) : amount}
        </h3>
        {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
        {trend !== undefined && (
          <div className="flex items-center gap-1 mt-2 text-xs font-semibold">
            <span className={`px-2 py-0.5 rounded-full text-[11px] ${trend >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
              {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
            </span>
            <span className="text-slate-400 text-[11px]">vs last month</span>
          </div>
        )}
      </div>

      {Icon && (
        <div className={`p-3 rounded-2xl border ${colorStyles[color] || colorStyles.sky}`}>
          <Icon className="w-5 h-5" />
        </div>
      )}
    </div>
  );
};
