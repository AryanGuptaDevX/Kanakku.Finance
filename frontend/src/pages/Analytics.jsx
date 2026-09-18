import React, { useState, useEffect } from 'react';
import { Filter, BarChart3, TrendingUp, ArrowDownLeft, ArrowUpRight, PiggyBank } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line, CartesianGrid
} from 'recharts';

import { analyticsAPI, categoryAPI } from '../services/api';
import { useCurrency } from '../context/CurrencyContext';
import { formatCurrency } from '../utils/formatters';
import { Card } from '../components/common/Card';
import { StatCard } from '../components/common/StatCard';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

export const Analytics = ({ selectedMonth }) => {
  const { currency } = useCurrency();
  const [data, setData] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [filterMonth, setFilterMonth] = useState(selectedMonth);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [transactionType, setTransactionType] = useState('');

  useEffect(() => {
    setFilterMonth(selectedMonth);
  }, [selectedMonth]);

  useEffect(() => {
    loadAnalytics();
  }, [filterMonth, startDate, endDate, categoryId, transactionType]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const [anaRes, catRes] = await Promise.all([
        analyticsAPI.get({
          month: startDate && endDate ? undefined : filterMonth,
          start_date: startDate || undefined,
          end_date: endDate || undefined,
          category_id: categoryId || undefined,
          transaction_type: transactionType || undefined
        }),
        categoryAPI.getAll()
      ]);
      setData(anaRes.data);
      setCategories(catRes.data);
    } catch (err) {
      console.error('Failed to load analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleResetFilters = () => {
    setFilterMonth(selectedMonth);
    setStartDate('');
    setEndDate('');
    setCategoryId('');
    setTransactionType('');
  };

  const COLORS = ['#f97316', '#0284c7', '#ec4899', '#eab308', '#8b5cf6', '#ef4444', '#14b8a6', '#64748b'];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Financial Analytics & Insights</h2>
        <p className="text-xs text-slate-500 mt-1">Deep analytics across cashflows, expense distributions, savings trends, and budget utilization</p>
      </div>

      {/* Interactive Filter Control Panel */}
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-3 text-xs font-bold text-slate-700">
          <Filter className="w-4 h-4 text-blue-600" />
          <span>Analytics Filters</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
          {/* Target Month */}
          <div>
            <label className="block text-[11px] font-medium text-slate-600 mb-1">Month</label>
            <input
              type="month"
              value={filterMonth}
              onChange={(e) => {
                setFilterMonth(e.target.value);
                setStartDate('');
                setEndDate('');
              }}
              className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          {/* Custom Date Range Start */}
          <div>
            <label className="block text-[11px] font-medium text-slate-600 mb-1">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          {/* Custom Date Range End */}
          <div>
            <label className="block text-[11px] font-medium text-slate-600 mb-1">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          {/* Category Filter */}
          <div>
            <label className="block text-[11px] font-medium text-slate-600 mb-1">Category</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Reset Filters */}
          <div className="flex items-end">
            <button
              onClick={handleResetFilters}
              className="w-full bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 text-xs py-1.5 px-3 rounded-lg font-semibold transition"
            >
              Reset Filters
            </button>
          </div>
        </div>
      </Card>

      {loading || !data ? (
        <LoadingSpinner label="Calculating financial analytics..." />
      ) : (
        <>
          {/* Metrics Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Total Income"
              amount={data.total_income}
              icon={ArrowDownLeft}
              color="emerald"
            />
            <StatCard
              title="Total Expenses"
              amount={data.total_expense}
              icon={ArrowUpRight}
              color="rose"
            />
            <StatCard
              title="Net Savings"
              amount={data.net_savings}
              icon={PiggyBank}
              color={data.net_savings >= 0 ? 'sky' : 'rose'}
            />
            <StatCard
              title="Savings Rate"
              amount={`${data.savings_rate}%`}
              isCurrency={false}
              icon={TrendingUp}
              color="purple"
            />
          </div>

          {/* Charts Row 1: Trend & Category Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* 6-Month Trend */}
            <Card title="Multi-Month Income vs Expense Trend" className="lg:col-span-7">
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.monthly_trend} margin={{ top: 20, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.8} />
                    <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
                    <YAxis stroke="#64748b" fontSize={12} tickFormatter={(val) => `${currency}${val}`} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', color: '#0f172a', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                      formatter={(val) => formatCurrency(val, currency)}
                    />
                    <Legend />
                    <Bar dataKey="income" name="Income" fill="#10b981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="expenses" name="Expenses" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* Category Breakdown */}
            <Card title="Expense Category Breakdown" className="lg:col-span-5">
              {data.category_breakdown.length === 0 ? (
                <div className="h-72 flex items-center justify-center text-xs text-slate-500">
                  No expense records match selected criteria.
                </div>
              ) : (
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data.category_breakdown}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={3}
                        dataKey="value"
                        nameKey="name"
                      >
                        {data.category_breakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', color: '#0f172a', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                        formatter={(val) => [formatCurrency(val, currency), 'Amount']}
                      />
                      <Legend formatter={(val) => <span className="text-xs text-slate-700 font-medium">{val}</span>} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Card>
          </div>

          {/* Savings Rate Evolution Line Chart */}
          <Card title="Net Savings Evolution Over Time">
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.monthly_trend} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.8} />
                  <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
                  <YAxis stroke="#64748b" fontSize={12} tickFormatter={(val) => `${currency}${val}`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', color: '#0f172a', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                    formatter={(val) => [formatCurrency(val, currency), 'Net Savings']}
                  />
                  <Line type="monotone" dataKey="savings" name="Net Savings" stroke="#2563eb" strokeWidth={3} dot={{ r: 5, fill: '#2563eb' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </>
      )}
    </div>
  );
};
