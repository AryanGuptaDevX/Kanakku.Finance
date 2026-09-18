import React, { useState, useEffect } from 'react';
import { Plus, PieChart, Trash2, AlertTriangle, CheckCircle, ShieldAlert } from 'lucide-react';
import { budgetAPI, categoryAPI } from '../services/api';
import { useCurrency } from '../context/CurrencyContext';
import { formatCurrency } from '../utils/formatters';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { ProgressBar } from '../components/common/ProgressBar';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { Modal } from '../components/common/Modal';
import { ConfirmModal } from '../components/common/ConfirmModal';

export const Budgets = ({ selectedMonth }) => {
  const { currency } = useCurrency();
  const [budgets, setBudgets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [categoryId, setCategoryId] = useState('');
  const [amount, setAmount] = useState('');
  const [modalError, setModalError] = useState('');
  const [saving, setSaving] = useState(false);

  const [deletingId, setDeletingId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    loadBudgets();
  }, [selectedMonth]);

  const loadBudgets = async () => {
    setLoading(true);
    try {
      const [budRes, catRes] = await Promise.all([
        budgetAPI.getAll(selectedMonth),
        categoryAPI.getAll('expense')
      ]);
      setBudgets(budRes.data);
      setCategories(catRes.data);
    } catch (err) {
      console.error('Failed to load budgets:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveBudget = async (e) => {
    e.preventDefault();
    setModalError('');

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setModalError('Amount must be greater than 0');
      return;
    }

    setSaving(true);
    try {
      await budgetAPI.save({
        month: selectedMonth,
        category_id: categoryId ? parseInt(categoryId) : null,
        amount: parsedAmount
      });
      setSaving(false);
      setIsModalOpen(false);
      setAmount('');
      setCategoryId('');
      loadBudgets();
    } catch (err) {
      setSaving(false);
      setModalError(err.response?.data?.detail || 'Failed to set budget');
    }
  };

  const handleDeleteBudget = async () => {
    if (!deletingId) return;
    setDeleteLoading(true);
    try {
      await budgetAPI.delete(deletingId);
      setDeletingId(null);
      loadBudgets();
    } catch (err) {
      console.error('Failed to delete budget:', err);
    } finally {
      setDeleteLoading(false);
    }
  };

  const overallBudget = budgets.find((b) => b.category_id === null);
  const categoryBudgets = budgets.filter((b) => b.category_id !== null);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Monthly Budgets ({selectedMonth})</h2>
          <p className="text-xs text-slate-500 mt-1">Set spending limits and monitor budget utilization thresholds</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} variant="primary" icon={Plus}>
          Set Budget Limit
        </Button>
      </div>

      {/* Overall Total Budget Card */}
      {overallBudget ? (
        <Card className="p-6 border-l-4 border-l-blue-600">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <span className="p-2.5 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100">
                  <PieChart className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Overall Monthly Budget</h3>
                  <p className="text-xs text-slate-500">Total expenditure ceiling for {selectedMonth}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div>
                <span className="text-xs text-slate-400 font-semibold block">Limit</span>
                <p className="text-xl font-bold text-slate-900">{formatCurrency(overallBudget.amount, currency)}</p>
              </div>
              <div>
                <span className="text-xs text-slate-400 font-semibold block">Spent</span>
                <p className="text-xl font-bold text-rose-600">{formatCurrency(overallBudget.spent, currency)}</p>
              </div>
              <div>
                <span className="text-xs text-slate-400 font-semibold block">Remaining</span>
                <p className={`text-xl font-bold ${overallBudget.remaining < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                  {formatCurrency(overallBudget.remaining, currency)}
                </p>
              </div>
              <button
                onClick={() => setDeletingId(overallBudget.id)}
                className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-slate-100 transition"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="mt-4">
            <ProgressBar
              percentage={overallBudget.percentage}
              color={overallBudget.percentage >= 100 ? 'rose' : overallBudget.percentage >= 80 ? 'amber' : 'emerald'}
              height="h-3"
              showLabel={true}
            />
          </div>
        </Card>
      ) : (
        <Card className="p-6 bg-white border border-dashed border-slate-300 text-center">
          <p className="text-xs font-bold text-slate-700">No overall monthly budget limit defined for {selectedMonth}</p>
          <div className="mt-3">
            <Button size="sm" onClick={() => setIsModalOpen(true)}>Set Overall Monthly Budget</Button>
          </div>
        </Card>
      )}

      {/* Category Specific Budgets Grid */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Category Specific Budgets</h3>

        {loading ? (
          <LoadingSpinner label="Loading category budgets..." />
        ) : categoryBudgets.length === 0 ? (
          <Card className="p-8 text-center text-xs text-slate-400">
            No category-specific budgets created yet for {selectedMonth}.
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {categoryBudgets.map((b) => {
              const isOver = b.percentage >= 100;
              const isWarning = b.percentage >= 80 && !isOver;

              return (
                <Card key={b.id} className="relative overflow-hidden">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-800 border border-slate-200">
                        {b.category?.name || 'Category'}
                      </span>
                      <h4 className="text-xl font-black text-slate-900 mt-2">{formatCurrency(b.amount, currency)}</h4>
                    </div>

                    <div className="flex items-center gap-1">
                      {isOver ? (
                        <span className="p-1.5 rounded-full bg-rose-50 text-rose-600" title="Budget Exceeded!">
                          <ShieldAlert className="w-5 h-5" />
                        </span>
                      ) : isWarning ? (
                        <span className="p-1.5 rounded-full bg-amber-50 text-amber-600" title="Approaching Limit">
                          <AlertTriangle className="w-5 h-5" />
                        </span>
                      ) : (
                        <span className="p-1.5 rounded-full bg-emerald-50 text-emerald-600" title="On Track">
                          <CheckCircle className="w-5 h-5" />
                        </span>
                      )}
                      <button
                        onClick={() => setDeletingId(b.id)}
                        className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-slate-100 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2">
                    <div className="flex justify-between text-xs font-semibold text-slate-600">
                      <span>Spent: <strong className="text-slate-900">{formatCurrency(b.spent, currency)}</strong></span>
                      <span>Remaining: <strong className={b.remaining < 0 ? 'text-rose-600' : 'text-emerald-600'}>{formatCurrency(b.remaining, currency)}</strong></span>
                    </div>

                    <ProgressBar
                      percentage={b.percentage}
                      color={isOver ? 'rose' : isWarning ? 'amber' : 'emerald'}
                      height="h-2.5"
                    />

                    <div className="flex justify-between text-[11px] text-slate-400">
                      <span>Used: {b.percentage.toFixed(1)}%</span>
                      {isOver && <span className="text-rose-600 font-bold">EXCEEDED BY {formatCurrency(Math.abs(b.remaining), currency)}</span>}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Set Budget Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Set Budget Limit">
        <form onSubmit={handleSaveBudget} className="space-y-4">
          {modalError && <p className="text-xs text-rose-600 bg-rose-50 p-2 rounded-xl">{modalError}</p>}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Target Scope *</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
            >
              <option value="">Overall Total Monthly Budget</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  Category: {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Budget Limit ({currency}) *</label>
            <input
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g. 5000"
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-blue-500"
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={saving}>
              {saving ? 'Saving...' : 'Save Budget'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={!!deletingId}
        onClose={() => setDeletingId(null)}
        onConfirm={handleDeleteBudget}
        title="Delete Budget Limit"
        message="Are you sure you want to remove this budget target?"
        loading={deleteLoading}
      />
    </div>
  );
};
