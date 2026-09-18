import React, { useState, useEffect } from 'react';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Landmark,
  TrendingUp,
  Wallet,
  PiggyBank,
  ArrowRight,
  TrendingDown,
  CheckCircle2,
  FileText
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line, CartesianGrid
} from 'recharts';

import { dashboardAPI } from '../services/api';
import { useCurrency } from '../context/CurrencyContext';
import { formatCurrency, formatDate } from '../utils/formatters';
import { StatCard } from '../components/common/StatCard';
import { Card } from '../components/common/Card';
import { ProgressBar } from '../components/common/ProgressBar';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

export const Dashboard = ({ selectedMonth, onRefresh }) => {
  const { currency } = useCurrency();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, [selectedMonth, onRefresh]);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const res = await dashboardAPI.getSummary(selectedMonth);
      setData(res.data);
    } catch (err) {
      console.error('Failed to load dashboard summary:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner label="Loading Kanakku dashboard..." />;
  if (!data) return <div className="p-8 text-slate-500">Failed to load dashboard data.</div>;

  const COLORS = ['#2563eb', '#0284c7', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#14b8a6', '#64748b'];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* 1. Kanakku Hero Revenue & Balance Banner Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Kanakku Gradient Hero Card */}
        <div className="lg:col-span-5 bg-kanakku-gradient rounded-3xl p-6 text-white shadow-xl flex flex-col justify-between relative overflow-hidden">
          <div className="z-10">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase font-extrabold tracking-wider text-blue-200">Total Net Balance</span>
              <span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-white flex items-center gap-1">
                ↑ 20% Growth
              </span>
            </div>
            <h2 className="text-3xl font-black mt-3 tracking-tight">{formatCurrency(data.available_balance, currency)}</h2>
            <p className="text-xs text-blue-100 mt-1">Available Net Capital for {selectedMonth}</p>
          </div>

          <div className="my-6 z-10 pt-4 border-t border-white/10 grid grid-cols-2 gap-4">
            <div>
              <p className="text-[11px] font-semibold text-blue-200 uppercase">Monthly Income</p>
              <p className="text-lg font-bold text-white mt-0.5">{formatCurrency(data.total_income, currency)}</p>
            </div>
            <div>
              <p className="text-[11px] font-semibold text-blue-200 uppercase">Savings Rate</p>
              <p className="text-lg font-bold text-white mt-0.5">{data.savings_rate}% Achieved</p>
            </div>
          </div>

          <div className="z-10">
            <div className="flex justify-between items-center text-xs font-bold mb-1.5 text-blue-100">
              <span>Savings Rate Target</span>
              <span>{data.savings_rate}%</span>
            </div>
            <div className="w-full bg-black/20 rounded-full h-2 overflow-hidden mb-4">
              <div className="bg-white h-2 rounded-full transition-all duration-500" style={{ width: `${Math.min(data.savings_rate, 100)}%` }} />
            </div>
          </div>

          {/* Background Decorative Rings */}
          <div className="absolute -right-8 -bottom-8 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        </div>

        {/* 3 Cashflow Quick Action Widgets (Inflow, Outflow, Net) */}
        <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="card-kanakku p-5 rounded-2xl bg-emerald-50/40 border border-emerald-100 flex flex-col justify-between">
            <div>
              <div className="p-2.5 rounded-xl bg-emerald-500 text-white w-fit mb-3 shadow-xs">
                <ArrowDownLeft className="w-5 h-5" />
              </div>
              <p className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Total Inflow</p>
              <h3 className="text-2xl font-black text-emerald-950 mt-1">{formatCurrency(data.total_income, currency)}</h3>
            </div>
            <span className="text-[11px] font-semibold text-emerald-700 mt-4 block">Received Income</span>
          </div>

          <div className="card-kanakku p-5 rounded-2xl bg-rose-50/40 border border-rose-100 flex flex-col justify-between">
            <div>
              <div className="p-2.5 rounded-xl bg-rose-500 text-white w-fit mb-3 shadow-xs">
                <ArrowUpRight className="w-5 h-5" />
              </div>
              <p className="text-xs font-bold text-rose-800 uppercase tracking-wider">Total Outflow</p>
              <h3 className="text-2xl font-black text-rose-950 mt-1">{formatCurrency(data.total_expenses, currency)}</h3>
            </div>
            <span className="text-[11px] font-semibold text-rose-700 mt-4 block">Expenses Logged</span>
          </div>

          <div className="card-kanakku p-5 rounded-2xl bg-amber-50/40 border border-amber-100 flex flex-col justify-between">
            <div>
              <div className="p-2.5 rounded-xl bg-amber-500 text-white w-fit mb-3 shadow-xs">
                <Landmark className="w-5 h-5" />
              </div>
              <p className="text-xs font-bold text-amber-800 uppercase tracking-wider">EMI & SIP Obligations</p>
              <h3 className="text-2xl font-black text-amber-950 mt-1">{formatCurrency(data.total_emi + data.total_sip, currency)}</h3>
            </div>
            <span className="text-[11px] font-semibold text-amber-700 mt-4 block">Monthly Obligations</span>
          </div>
        </div>
      </div>

      {/* 2. Summary Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard title="Total Income" amount={data.total_income} icon={ArrowDownLeft} color="emerald" />
        <StatCard title="Total Expenses" amount={data.total_expenses} icon={ArrowUpRight} color="rose" />
        <StatCard title="Total EMI" amount={data.total_emi} icon={Landmark} color="amber" />
        <StatCard title="Total SIP" amount={data.total_sip} icon={TrendingUp} color="indigo" />
        <StatCard title="Available Balance" amount={data.available_balance} icon={Wallet} color={data.available_balance >= 0 ? 'sky' : 'rose'} />
        <StatCard title="Savings Rate" amount={`${data.savings_rate}%`} isCurrency={false} icon={PiggyBank} color="purple" />
      </div>

      {/* 3. Charts Row: Monthly Cashflow & Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <Card title="Revenue & Expenses Breakdown" className="lg:col-span-7">
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.income_vs_expense_chart} margin={{ top: 20, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="category" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} tickFormatter={(val) => `${currency}${val}`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', color: '#0f172a', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(value) => [formatCurrency(value, currency), 'Amount']}
                />
                <Bar dataKey="amount" radius={[8, 8, 0, 0]}>
                  {data.income_vs_expense_chart.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Expense Category Breakdown" className="lg:col-span-5">
          {data.expense_category_breakdown.length === 0 ? (
            <div className="h-72 flex items-center justify-center text-xs text-slate-400">
              No expense records logged for this month.
            </div>
          ) : (
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.expense_category_breakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={4}
                    dataKey="amount"
                    nameKey="category_name"
                  >
                    {data.expense_category_breakdown.map((entry, index) => (
                      <Cell key={`pie-cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', color: '#0f172a', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    formatter={(val) => [formatCurrency(val, currency), 'Spent']}
                  />
                  <Legend formatter={(val) => <span className="text-xs font-semibold text-slate-700">{val}</span>} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
      </div>

      {/* 4. Monthly Trend & Widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <Card title="6-Month Financial Trend" className="lg:col-span-8">
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.monthly_trend} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} tickFormatter={(val) => `${currency}${val}`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', color: '#0f172a', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(val) => formatCurrency(val, currency)}
                />
                <Line type="monotone" dataKey="income" name="Income" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="expenses" name="Expenses" stroke="#ef4444" strokeWidth={3} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="savings" name="Net Savings" stroke="#2563eb" strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Overall Monthly Budget Progress Widget */}
        <Card title="Monthly Budget Progress" className="lg:col-span-4">
          {data.budget_progress ? (
            <div className="space-y-4">
              <div className="flex justify-between items-baseline">
                <div>
                  <span className="text-xs text-slate-500 font-semibold">Total Spent</span>
                  <p className="text-xl font-bold text-slate-900">{formatCurrency(data.budget_progress.spent, currency)}</p>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-500 font-semibold">Limit</span>
                  <p className="text-sm font-bold text-slate-700">{formatCurrency(data.budget_progress.budget_limit, currency)}</p>
                </div>
              </div>
              <ProgressBar
                percentage={data.budget_progress.percentage}
                color={data.budget_progress.percentage >= 100 ? 'rose' : data.budget_progress.percentage >= 80 ? 'amber' : 'emerald'}
                height="h-3"
                showLabel={true}
              />
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
                <span className="text-slate-500">Remaining Budget: </span>
                <span className={`font-bold ${data.budget_progress.remaining < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                  {formatCurrency(data.budget_progress.remaining, currency)}
                </span>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-slate-400">
              No total budget defined for {data.month}.
            </div>
          )}
        </Card>
      </div>

      {/* 5. Kanakku Recent Transactions Table */}
      <Card title="Recent Transactions">
        {data.recent_transactions.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            No recent transactions found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Source / Payee</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Method</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {data.recent_transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">{formatDate(tx.date)}</td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs">
                          {tx.source_or_payee.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-bold text-slate-900">{tx.source_or_payee}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                        {tx.category?.name}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">{tx.payment_method}</td>
                    <td className={`py-3.5 px-4 text-right font-black ${tx.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount, currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};
