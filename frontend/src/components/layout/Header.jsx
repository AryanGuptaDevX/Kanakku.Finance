import React from 'react';
import { Menu, Plus, Calendar, ChevronLeft, ChevronRight, Search, Bell, Home, ChevronDown } from 'lucide-react';
import { Button } from '../common/Button';
import { useCurrency } from '../../context/CurrencyContext';

export const Header = ({
  onMenuClick,
  selectedMonth,
  onMonthChange,
  onOpenTransactionModal
}) => {
  const { currency } = useCurrency();

  const handlePrevMonth = () => {
    if (!selectedMonth) return;
    const [year, month] = selectedMonth.split('-').map(Number);
    const date = new Date(year, month - 2, 1);
    const prevM = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    onMonthChange(prevM);
  };

  const handleNextMonth = () => {
    if (!selectedMonth) return;
    const [year, month] = selectedMonth.split('-').map(Number);
    const date = new Date(year, month, 1);
    const nextM = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    onMonthChange(nextM);
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-white border-b border-slate-200 px-3 sm:px-4 lg:px-8 flex items-center justify-between shadow-xs">
      <div className="flex items-center gap-2 sm:gap-4 min-w-0">
        <button
          onClick={onMenuClick}
          className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 lg:hidden shrink-0"
          aria-label="Open Navigation Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Kanakku Breadcrumb */}
        <div className="hidden md:flex items-center gap-2 text-xs text-slate-500 font-semibold truncate">
          <Home className="w-4 h-4 text-slate-400 shrink-0" />
          <span>Dashboard</span>
          <span className="text-slate-300">/</span>
          <span className="text-slate-800 font-bold">Kanakku MoneyManager</span>
        </div>

        {/* Month Picker Control */}
        {selectedMonth && (
          <div className="flex items-center bg-slate-50 rounded-xl p-0.5 sm:p-1 border border-slate-200 shrink-0">
            <button
              onClick={handlePrevMonth}
              className="p-1 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-200/60 transition"
              title="Previous Month"
            >
              <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
            <div className="flex items-center gap-1 px-1 sm:px-2.5 py-0.5 text-xs font-bold text-slate-800">
              <Calendar className="w-3.5 h-3.5 text-blue-600 hidden xs:inline-block" />
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => e.target.value && onMonthChange(e.target.value)}
                className="bg-transparent text-[11px] sm:text-xs font-bold text-slate-800 focus:outline-none cursor-pointer border-none p-0 w-[78px] xs:w-20 sm:w-auto"
              />
            </div>
            <button
              onClick={handleNextMonth}
              className="p-1 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-200/60 transition"
              title="Next Month"
            >
              <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          </div>
        )}
      </div>

      <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
        {/* Currency Indicator */}
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700">
          <span className="text-slate-400">Currency:</span>
          <span className="text-blue-600">{currency}</span>
        </div>

        {/* Notifications Icon */}
        <div className="relative">
          <button className="p-1.5 sm:p-2 rounded-xl text-slate-500 hover:bg-slate-100 transition relative" aria-label="Notifications">
            <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white"></span>
          </button>
        </div>

        {/* Quick Add Transaction Button */}
        <Button
          onClick={() => onOpenTransactionModal('expense')}
          variant="primary"
          size="sm"
          icon={Plus}
          className="text-xs px-2.5 sm:px-3"
        >
          <span className="hidden sm:inline">Create New</span>
          <span className="sm:hidden">New</span>
        </Button>
      </div>
    </header>
  );
};
