import React, { useState, useEffect, useRef } from 'react';
import { Menu, Plus, Calendar, ChevronLeft, ChevronRight, Bell, Home, AlertCircle, CalendarClock, CheckCircle } from 'lucide-react';
import { Button } from '../common/Button';
import { useCurrency } from '../../context/CurrencyContext';
import api from '../../services/api';

export const Header = ({
  onMenuClick,
  selectedMonth,
  onMonthChange,
  onOpenTransactionModal
}) => {
  const { currency } = useCurrency();
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const dropdownRef = useRef(null);

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

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const res = await api.get(`/dashboard?month=${selectedMonth || new Date().toISOString().substring(0, 7)}`);
        const data = res.data;
        const alerts = [];

        // EMI alerts
        if (data.upcoming_emis && data.upcoming_emis.length > 0) {
          data.upcoming_emis.forEach((emi) => {
            alerts.push({
              id: `emi-${emi.id}`,
              type: 'emi',
              title: `Upcoming EMI: ${emi.loan_name}`,
              message: `Payment of ${currency} ${emi.monthly_payment.toLocaleString()} due on day ${emi.due_day}`,
            });
          });
        }

        // Budget alerts
        if (data.budget_progress && data.budget_progress.percentage >= 75) {
          alerts.push({
            id: 'budget-alert',
            type: 'budget',
            title: `Budget Limit Alert (${data.budget_progress.percentage}%)`,
            message: `You spent ${currency} ${data.budget_progress.spent.toLocaleString()} out of ${currency} ${data.budget_progress.budget_limit.toLocaleString()}`,
          });
        }

        if (alerts.length === 0) {
          alerts.push({
            id: 'all-clear',
            type: 'info',
            title: 'All Systems Normal',
            message: 'No pending EMI alerts or budget warnings for this month.',
          });
        }

        setNotifications(alerts);
      } catch (err) {
        console.error('Failed to load notification alerts:', err);
      }
    };

    fetchAlerts();
  }, [selectedMonth, currency]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const hasActiveAlerts = notifications.some((n) => n.type !== 'info');

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

        {/* Notifications Icon with Interactive Popover */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-1.5 sm:p-2 rounded-xl text-slate-500 hover:bg-slate-100 transition relative"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
            {hasActiveAlerts && (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-amber-500 ring-2 ring-white animate-pulse" />
            )}
          </button>

          {/* Notifications Dropdown Popover */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-200 py-3 z-50 animate-in fade-in slide-in-from-top-2">
              <div className="px-4 pb-2 border-b border-slate-100 flex justify-between items-center">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Financial Alerts</h4>
                <span className="text-[10px] bg-slate-100 text-slate-600 font-semibold px-2 py-0.5 rounded-full">
                  {notifications.length}
                </span>
              </div>
              <div className="max-h-64 overflow-y-auto divide-y divide-slate-100">
                {notifications.map((n) => (
                  <div key={n.id} className="p-3 hover:bg-slate-50 transition flex items-start gap-2.5">
                    {n.type === 'emi' && <CalendarClock className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />}
                    {n.type === 'budget' && <AlertCircle className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" />}
                    {n.type === 'info' && <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />}
                    <div>
                      <h5 className="text-xs font-bold text-slate-800">{n.title}</h5>
                      <p className="text-[11px] text-slate-500 mt-0.5">{n.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
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
