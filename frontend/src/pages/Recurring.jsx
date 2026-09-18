import React, { useState, useEffect } from 'react';
import { Plus, Repeat, Trash2, Edit3, PlayCircle, CheckCircle2, XCircle } from 'lucide-react';
import { recurringAPI, categoryAPI } from '../services/api';
import { useCurrency } from '../context/CurrencyContext';
import { formatCurrency, formatDate } from '../utils/formatters';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { EmptyState } from '../components/common/EmptyState';
import { Modal } from '../components/common/Modal';
import { ConfirmModal } from '../components/common/ConfirmModal';

export const Recurring = ({ selectedMonth, onRefresh }) => {
  const { currency } = useCurrency();
  const [recurringList, setRecurringList] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [title, setTitle] = useState('');
  const [type, setType] = useState('expense');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [frequency, setFrequency] = useState('monthly');
  const [dayOfMonth, setDayOfMonth] = useState(1);
  const [modalError, setModalError] = useState('');
  const [saving, setSaving] = useState(false);

  const [processing, setProcessing] = useState(false);
  const [processMsg, setProcessMsg] = useState('');

  const [deletingId, setDeletingId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [recRes, catRes] = await Promise.all([
        recurringAPI.getAll(),
        categoryAPI.getAll()
      ]);
      setRecurringList(recRes.data);
      setCategories(catRes.data);
    } catch (err) {
      console.error('Failed to load recurring list:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (item = null) => {
    if (item) {
      setEditingItem(item);
      setTitle(item.title);
      setType(item.type);
      setAmount(item.amount.toString());
      setCategoryId(item.category_id.toString());
      setFrequency(item.frequency);
      setDayOfMonth(item.day_of_month || 1);
    } else {
      setEditingItem(null);
      setTitle('');
      setType('expense');
      setAmount('');
      setCategoryId(categories.length > 0 ? categories[0].id.toString() : '');
      setFrequency('monthly');
      setDayOfMonth(1);
    }
    setModalError('');
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setModalError('');

    const parsedAmount = parseFloat(amount);
    if (!title.trim()) {
      setModalError('Title is required');
      return;
    }
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setModalError('Amount must be > 0');
      return;
    }
    if (!categoryId) {
      setModalError('Category is required');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        title: title.trim(),
        type,
        amount: parsedAmount,
        category_id: parseInt(categoryId),
        frequency,
        day_of_month: parseInt(dayOfMonth),
        is_active: editingItem ? editingItem.is_active : true
      };

      if (editingItem) {
        await recurringAPI.update(editingItem.id, payload);
      } else {
        await recurringAPI.create(payload);
      }

      setSaving(false);
      setIsModalOpen(false);
      loadData();
      if (onRefresh) onRefresh();
    } catch (err) {
      setSaving(false);
      setModalError(err.response?.data?.detail || 'Failed to save recurring item');
    }
  };

  const handleToggleActive = async (item) => {
    try {
      await recurringAPI.update(item.id, { is_active: !item.is_active });
      loadData();
    } catch (err) {
      console.error('Failed to toggle active status:', err);
    }
  };

  const handleRunSync = async () => {
    setProcessing(true);
    setProcessMsg('');
    try {
      const res = await recurringAPI.process(selectedMonth);
      setProcessMsg(`Sync Complete! ${res.data.created_count} new transaction(s) generated.`);
      loadData();
      if (onRefresh) onRefresh();
    } catch (err) {
      setProcessMsg('Failed to process recurring sync.');
    } finally {
      setProcessing(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    setDeleteLoading(true);
    try {
      await recurringAPI.delete(deletingId);
      setDeletingId(null);
      loadData();
    } catch (err) {
      console.error('Failed to delete recurring schedule:', err);
    } finally {
      setDeleteLoading(false);
    }
  };

  const filteredCategories = categories.filter((c) => c.type === type);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Recurring Transactions</h2>
          <p className="text-xs text-slate-500 mt-1">Automated income & subscription schedules with duplicate protection</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleRunSync} variant="secondary" icon={PlayCircle} disabled={processing}>
            {processing ? 'Processing...' : 'Run Sync Now'}
          </Button>
          <Button onClick={() => handleOpenModal()} variant="primary" icon={Plus}>
            New Schedule
          </Button>
        </div>
      </div>

      {processMsg && (
        <div className="p-3 rounded-xl bg-sky-50 border border-sky-200 text-sky-700 text-xs font-semibold flex items-center justify-between">
          <span>{processMsg}</span>
          <button onClick={() => setProcessMsg('')} className="text-slate-400 hover:text-slate-700 text-xs">Dismiss</button>
        </div>
      )}

      <Card title="Automated Schedules">
        {loading ? (
          <LoadingSpinner label="Loading recurring schedules..." />
        ) : recurringList.length === 0 ? (
          <EmptyState
            title="No Recurring Schedules"
            description="No automated recurring income or expenses created."
            actionLabel="Create Schedule"
            onAction={() => handleOpenModal()}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">Title</th>
                  <th className="py-3.5 px-4">Type</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Frequency</th>
                  <th className="py-3.5 px-4">Cycle Day</th>
                  <th className="py-3.5 px-4">Last Processed</th>
                  <th className="py-3.5 px-4 text-right">Amount</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {recurringList.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3.5 px-4 font-bold text-slate-900">{item.title}</td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${item.type === 'income' ? 'text-emerald-700 bg-emerald-50 border border-emerald-200' : 'text-rose-700 bg-rose-50 border border-rose-200'}`}>
                        {item.type.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-700">{item.category?.name}</td>
                    <td className="py-3.5 px-4 font-semibold text-slate-700 capitalize">{item.frequency}</td>
                    <td className="py-3.5 px-4 text-slate-500">Day {item.day_of_month || 1}</td>
                    <td className="py-3.5 px-4 text-slate-500">{item.last_processed_date ? formatDate(item.last_processed_date) : 'Never'}</td>
                    <td className={`py-3.5 px-4 text-right font-black ${item.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {formatCurrency(item.amount, currency)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => handleToggleActive(item)}
                        className={`px-2.5 py-1 rounded-full text-[11px] font-bold inline-flex items-center gap-1 ${
                          item.is_active ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-500 border border-slate-200'
                        }`}
                      >
                        {item.is_active ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                        {item.is_active ? 'Active' : 'Paused'}
                      </button>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => handleOpenModal(item)} className="p-1.5 rounded-xl text-slate-400 hover:text-blue-600 hover:bg-slate-100 transition">
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button onClick={() => setDeletingId(item.id)} className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-slate-100 transition">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingItem ? 'Edit Recurring Schedule' : 'New Recurring Schedule'}>
        <form onSubmit={handleSave} className="space-y-4">
          {modalError && <p className="text-xs text-rose-600 bg-rose-50 p-2 rounded-xl">{modalError}</p>}

          {!editingItem && (
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
              <button
                type="button"
                onClick={() => setType('expense')}
                className={`py-1.5 text-xs font-bold rounded-lg ${type === 'expense' ? 'bg-rose-600 text-white' : 'text-slate-600'}`}
              >
                Recurring Expense
              </button>
              <button
                type="button"
                onClick={() => setType('income')}
                className={`py-1.5 text-xs font-bold rounded-lg ${type === 'income' ? 'bg-emerald-600 text-white' : 'text-slate-600'}`}
              >
                Recurring Income
              </button>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Netflix Subscription, House Rent"
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Amount ({currency}) *</label>
              <input
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Category *</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                required
              >
                {filteredCategories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Frequency *</label>
              <select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
              >
                <option value="monthly">Monthly</option>
                <option value="weekly">Weekly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Day of Month (1-31)</label>
              <input
                type="number"
                min="1"
                max="31"
                value={dayOfMonth}
                onChange={(e) => setDayOfMonth(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)} disabled={saving}>Cancel</Button>
            <Button type="submit" variant="primary" disabled={saving}>{saving ? 'Saving...' : 'Save Schedule'}</Button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={!!deletingId}
        onClose={() => setDeletingId(null)}
        onConfirm={handleDelete}
        title="Delete Recurring Schedule"
        message="Are you sure you want to remove this recurring schedule?"
        loading={deleteLoading}
      />
    </div>
  );
};
