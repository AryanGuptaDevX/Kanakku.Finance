import React, { useState, useEffect } from 'react';
import { Plus, Target, CheckCircle2, Trash2, Edit3, PiggyBank } from 'lucide-react';
import { goalAPI } from '../services/api';
import { useCurrency } from '../context/CurrencyContext';
import { formatCurrency, formatDate } from '../utils/formatters';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { StatCard } from '../components/common/StatCard';
import { ProgressBar } from '../components/common/ProgressBar';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { EmptyState } from '../components/common/EmptyState';
import { Modal } from '../components/common/Modal';
import { ConfirmModal } from '../components/common/ConfirmModal';

export const SavingsGoals = () => {
  const { currency } = useCurrency();
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [goalName, setGoalName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentSavings, setCurrentSavings] = useState('');
  const [targetDate, setTargetDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [modalError, setModalError] = useState('');
  const [saving, setSaving] = useState(false);

  // Quick Top-up Modal State
  const [isTopUpOpen, setIsTopUpOpen] = useState(false);
  const [topUpGoal, setTopUpGoal] = useState(null);
  const [topUpAmount, setTopUpAmount] = useState('');

  const [deletingId, setDeletingId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    loadGoals();
  }, []);

  const loadGoals = async () => {
    setLoading(true);
    try {
      const res = await goalAPI.getAll();
      setGoals(res.data);
    } catch (err) {
      console.error('Failed to load savings goals:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (goal = null) => {
    if (goal) {
      setEditingGoal(goal);
      setGoalName(goal.goal_name);
      setTargetAmount(goal.target_amount.toString());
      setCurrentSavings(goal.current_savings.toString());
      setTargetDate(goal.target_date);
      setDescription(goal.description || '');
    } else {
      setEditingGoal(null);
      setGoalName('');
      setTargetAmount('');
      setCurrentSavings('0');
      setTargetDate(new Date().toISOString().split('T')[0]);
      setDescription('');
    }
    setModalError('');
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setModalError('');

    const tAmt = parseFloat(targetAmount);
    const cSav = parseFloat(currentSavings);

    if (!goalName.trim()) {
      setModalError('Goal name is required');
      return;
    }
    if (isNaN(tAmt) || tAmt <= 0) {
      setModalError('Target amount must be > 0');
      return;
    }
    if (isNaN(cSav) || cSav < 0) {
      setModalError('Current savings cannot be negative');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        goal_name: goalName.trim(),
        target_amount: tAmt,
        current_savings: cSav,
        target_date: targetDate,
        description: description.trim() || null
      };

      if (editingGoal) {
        await goalAPI.update(editingGoal.id, payload);
      } else {
        await goalAPI.create(payload);
      }

      setSaving(false);
      setIsModalOpen(false);
      loadGoals();
    } catch (err) {
      setSaving(false);
      setModalError(err.response?.data?.detail || 'Failed to save savings goal');
    }
  };

  const handleTopUpSubmit = async (e) => {
    e.preventDefault();
    if (!topUpGoal) return;
    const addAmt = parseFloat(topUpAmount);
    if (isNaN(addAmt) || addAmt <= 0) return;

    try {
      await goalAPI.topup(topUpGoal.id, { amount: addAmt, create_transaction: true });
      setIsTopUpOpen(false);
      setTopUpAmount('');
      loadGoals();
    } catch (err) {
      console.error('Failed to top up savings goal:', err);
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    setDeleteLoading(true);
    try {
      await goalAPI.delete(deletingId);
      setDeletingId(null);
      loadGoals();
    } catch (err) {
      console.error('Failed to delete goal:', err);
    } finally {
      setDeleteLoading(false);
    }
  };

  const totalTargetSum = goals.reduce((a, c) => a + c.target_amount, 0);
  const totalSavedSum = goals.reduce((a, c) => a + c.current_savings, 0);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Savings Goals</h2>
          <p className="text-xs text-slate-500 mt-1">Set, track, and achieve multiple financial savings targets (Emergency fund, Gaming PC, Vacation, etc.)</p>
        </div>
        <Button onClick={() => handleOpenModal()} variant="primary" icon={Plus}>
          New Savings Goal
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Total Saved Capital"
          amount={totalSavedSum}
          icon={PiggyBank}
          color="emerald"
          subtitle="Saved across all goals"
        />
        <StatCard
          title="Total Target Amount"
          amount={totalTargetSum}
          icon={Target}
          color="sky"
          subtitle="Cumulative savings target"
        />
        <StatCard
          title="Active Goals"
          amount={goals.filter(g => !g.is_completed).length}
          isCurrency={false}
          icon={CheckCircle2}
          color="purple"
          subtitle="Goals in progress"
        />
      </div>

      {/* Goals Grid */}
      <div className="space-y-4">
        <h3 className="text-base font-bold text-slate-800">Active & Completed Goals</h3>

        {loading ? (
          <LoadingSpinner label="Loading savings goals..." />
        ) : goals.length === 0 ? (
          <EmptyState
            title="No Savings Goals"
            description="Create your first savings target to start tracking progress."
            actionLabel="New Savings Goal"
            onAction={() => handleOpenModal()}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {goals.map((g) => (
              <Card key={g.id} className={`relative overflow-hidden ${g.is_completed ? 'border-emerald-200 bg-emerald-50/40' : ''}`}>
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-lg font-bold text-slate-800">{g.goal_name}</h4>
                    <p className="text-xs text-slate-500 mt-0.5">Target Date: {formatDate(g.target_date)}</p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-[11px] font-extrabold ${g.is_completed ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-blue-50 text-blue-600 border border-blue-200'}`}>
                    {g.is_completed ? 'GOAL ACHIEVED 🎉' : 'IN PROGRESS'}
                  </span>
                </div>

                {g.description && <p className="text-xs text-slate-500 mt-2 italic">{g.description}</p>}

                <div className="mt-4 grid grid-cols-2 gap-3 py-3 border-y border-slate-100 text-xs">
                  <div>
                    <span className="text-slate-500 block text-[11px]">Saved Amount</span>
                    <span className="font-extrabold text-emerald-600 text-base">{formatCurrency(g.current_savings, currency)}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Target Amount</span>
                    <span className="font-extrabold text-slate-800 text-base">{formatCurrency(g.target_amount, currency)}</span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-4 space-y-1.5">
                  <div className="flex justify-between text-[11px] font-semibold text-slate-600">
                    <span>Remaining: {formatCurrency(g.remaining_amount, currency)}</span>
                    <span>{g.progress_percentage}%</span>
                  </div>
                  <ProgressBar percentage={g.progress_percentage} color={g.is_completed ? 'emerald' : 'sky'} height="h-3" />
                </div>

                {/* Actions */}
                <div className="mt-5 flex items-center justify-between pt-3 border-t border-slate-100">
                  {!g.is_completed ? (
                    <Button
                      size="sm"
                      variant="success"
                      onClick={() => {
                        setTopUpGoal(g);
                        setTopUpAmount('');
                        setIsTopUpOpen(true);
                      }}
                      icon={PiggyBank}
                    >
                      + Add Savings
                    </Button>
                  ) : (
                    <span className="text-xs font-bold text-emerald-600">100% Completed</span>
                  )}

                  <div className="flex gap-1">
                    <button onClick={() => handleOpenModal(g)} className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-slate-100 transition">
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button onClick={() => setDeletingId(g.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 transition">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Goal Add / Edit Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingGoal ? 'Edit Savings Goal' : 'New Savings Goal'}>
        <form onSubmit={handleSave} className="space-y-4">
          {modalError && <p className="text-xs text-rose-600 bg-rose-50 p-2 rounded border border-rose-200">{modalError}</p>}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Goal Name *</label>
            <input
              type="text"
              value={goalName}
              onChange={(e) => setGoalName(e.target.value)}
              placeholder="e.g. Gaming PC, Emergency Fund, Tokyo Vacation"
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Target Amount ({currency}) *</label>
              <input
                type="number"
                step="0.01"
                value={targetAmount}
                onChange={(e) => setTargetAmount(e.target.value)}
                placeholder="100000"
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Current Saved ({currency})</label>
              <input
                type="number"
                step="0.01"
                value={currentSavings}
                onChange={(e) => setCurrentSavings(e.target.value)}
                placeholder="42000"
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Target Date *</label>
            <input
              type="date"
              value={targetDate}
              min={new Date().toISOString().split('T')[0]}
              onChange={(e) => setTargetDate(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Description (Optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Why are you saving for this?"
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)} disabled={saving}>Cancel</Button>
            <Button type="submit" variant="primary" disabled={saving}>{saving ? 'Saving...' : 'Save Goal'}</Button>
          </div>
        </form>
      </Modal>

      {/* Quick Add Savings Top-up Modal */}
      <Modal isOpen={isTopUpOpen} onClose={() => setIsTopUpOpen(false)} title={`Add Savings to: ${topUpGoal?.goal_name}`}>
        <form onSubmit={handleTopUpSubmit} className="space-y-4">
          <p className="text-xs text-slate-500">Current Saved: <strong className="text-emerald-600">{formatCurrency(topUpGoal?.current_savings || 0, currency)}</strong> of {formatCurrency(topUpGoal?.target_amount || 0, currency)}</p>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Additional Amount to Deposit ({currency}) *</label>
            <input
              type="number"
              step="0.01"
              value={topUpAmount}
              onChange={(e) => setTopUpAmount(e.target.value)}
              placeholder="e.g. 5000"
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              required
              autoFocus
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button variant="secondary" onClick={() => setIsTopUpOpen(false)}>Cancel</Button>
            <Button type="submit" variant="success">Add Contribution</Button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={!!deletingId}
        onClose={() => setDeletingId(null)}
        onConfirm={handleDelete}
        title="Delete Savings Goal"
        message="Are you sure you want to remove this savings goal?"
        loading={deleteLoading}
      />
    </div>
  );
};
