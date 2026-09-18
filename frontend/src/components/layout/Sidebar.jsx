import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Receipt,
  ArrowDownLeft,
  ArrowUpRight,
  PieChart,
  Repeat,
  Landmark,
  TrendingUp,
  Target,
  BarChart3,
  Download,
  Settings as SettingsIcon,
  Wallet,
  X,
  UserCheck
} from 'lucide-react';

const menuSections = [
  {
    title: 'MAIN',
    items: [
      { name: 'Dashboard', path: '/', icon: LayoutDashboard },
      { name: 'Transactions', path: '/transactions', icon: Receipt },
    ]
  },
  {
    title: 'FINANCE & CASHFLOW',
    items: [
      { name: 'Income', path: '/income', icon: ArrowDownLeft },
      { name: 'Expenses', path: '/expenses', icon: ArrowUpRight },
      { name: 'Budgets', path: '/budgets', icon: PieChart },
      { name: 'Recurring', path: '/recurring', icon: Repeat },
    ]
  },
  {
    title: 'TRACKERS & GOALS',
    items: [
      { name: 'EMI Tracker', path: '/emi', icon: Landmark },
      { name: 'SIP Tracker', path: '/sip', icon: TrendingUp },
      { name: 'Savings Goals', path: '/goals', icon: Target },
    ]
  },
  {
    title: 'REPORTS & SYSTEM',
    items: [
      { name: 'Analytics', path: '/analytics', icon: BarChart3 },
      { name: 'CSV Export', path: '/export', icon: Download },
      { name: 'Settings', path: '/settings', icon: SettingsIcon },
    ]
  }
];

export const Sidebar = ({ isOpen, onClose }) => {
  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs lg:hidden"
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-white border-r border-slate-200 transition-transform duration-300 ease-in-out flex flex-col shadow-xs ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Kanakku Brand Header */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-blue-600 to-sky-500 text-white shadow-sm shadow-blue-500/30">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-black tracking-tight text-slate-900">
                Kanakku<span className="text-blue-600">.Finance</span>
              </h1>
              <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400">MoneyManager Pro</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Menu with Section Titles */}
        <nav className="flex-1 px-4 py-4 space-y-5 overflow-y-auto">
          {menuSections.map((section) => (
            <div key={section.title}>
              <p className="px-3 text-[10px] font-extrabold tracking-wider text-slate-400 uppercase mb-1.5">
                {section.title}
              </p>
              <div className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={onClose}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-150 ${
                          isActive
                            ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                        }`
                      }
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.name}</span>
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Kanakku Profile Footer Card */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs border border-blue-200">
              <UserCheck className="w-4 h-4" />
            </div>
            <div className="overflow-hidden">
              <h5 className="text-xs font-bold text-slate-800 truncate">Jafna Cremson</h5>
              <p className="text-[11px] text-slate-500 truncate">Administrator</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
