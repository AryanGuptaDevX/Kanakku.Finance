import React, { useState, useEffect } from 'react';
import { Plus, ArrowUpRight, Trash2, Edit3, Tag } from 'lucide-react';
import { transactionAPI, categoryAPI } from '../services/api';
import { useCurrency } from '../context/CurrencyContext';
import { formatCurrency, formatDate } from '../utils/formatters';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { StatCard } from '../components/common/StatCard';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { EmptyState } from '../components/common/EmptyState';
import { TransactionModal } from '../components/common/TransactionModal';
import { Modal } from '../components/common/Modal';
import { ConfirmModal } from '../components/common/ConfirmModal';

export const Expenses = ({ selectedMonth, onRefresh }) => {
  const { currency } = useCurrency();
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [catError, setCatError] = useState('');

  const [deletingId, setDeletingId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, [selectedMonth]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [txRes, catRes] = await Promise.all([
        transactionAPI.getAll({ month: selectedMonth, type: 'expense' }),
        categoryAPI.getAll('expense')
      ]);
      setExpenses(txRes.data);
      setCategories(catRes.data);
    } catch (err) {
      console.error('Failed to load expense data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    try {
      await categoryAPI.create({
        name: newCatName.trim(),
        type: 'expense',
        color: '#ef4444'
      });
      setNewCatName('');
      setIsCategoryModalOpen(false);
      loadData();
    } catch (err) {
      setCatError(err.response?.data?.detail || 'Failed to create category');
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    setDeleteLoading(true);
    try {
      await transactionAPI.delete(deletingId);
      setDeletingId(null);
      loadData();
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error('Failed to delete expense:', err);
    } finally {
      setDeleteLoading(false);
    }
  };

  const totalExpense = expenses.reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Expenses Management</h2>
          <p className="text-xs text-slate-500 mt-1">Track groceries, rent, bills, shopping, and everyday spending</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setIsCategoryModalOpen(true)} icon={Tag}>
            Add Category
          </Button>
          <Button
            variant="danger"
            onClick={() => {
              setEditingTx(null);
              setIsTxModalOpen(true);
            }}
            icon={Plus}
          >
            Add Expense
          </Button>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Total Expenses"
          amount={totalExpense}
          icon={ArrowUpRight}
          color="rose"
          subtitle={`Total for ${selectedMonth}`}
        />
        <StatCard
          title="Expense Entries"
          amount={expenses.length}
          isCurrency={false}
          icon={ArrowUpRight}
          color="amber"
          subtitle="Expense records logged"
        />
        <StatCard
          title="Active Categories"
          amount={categories.length}
          isCurrency={false}
          icon={Tag}
          color="indigo"
          subtitle="Food, Rent, Bills, etc."
        />
      </div>

      {/* Expense Table */}
      <Card title={`Expense Records (${selectedMonth})`}>
        {loading ? (
          <LoadingSpinner label="Fetching expenses..." />
        ) : expenses.length === 0 ? (
          <EmptyState
            title="No Expenses Logged"
            description="No expense transactions recorded for this month yet."
            actionLabel="Add Expense"
            onAction={() => setIsTxModalOpen(true)}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4">Payee / Merchant</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Method</th>
                  <th className="py-3.5 px-4">Notes</th>
                  <th className="py-3.5 px-4 text-right">Amount</th>
                  <th className="py-3.5 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {expenses.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">{formatDate(tx.date)}</td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">{tx.source_or_payee}</td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                        {tx.category?.name}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">{tx.payment_method}</td>
                    <td className="py-3.5 px-4 text-slate-500">{tx.description || '-'}</td>
                    <td className="py-3.5 px-4 text-right font-black text-sm text-rose-600">
                      -{formatCurrency(tx.amount, currency)}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => {
                            setEditingTx(tx);
                            setIsTxModalOpen(true);
                          }}
                          className="p-1.5 rounded-xl text-slate-400 hover:text-blue-600 hover:bg-slate-100 transition"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeletingId(tx.id)}
                          className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-slate-100 transition"
                        >
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
      <TransactionModal
        isOpen={isTxModalOpen}
        onClose={() => {
          setIsTxModalOpen(false);
          setEditingTx(null);
        }}
        onSuccess={() => {
          loadData();
          if (onRefresh) onRefresh();
        }}
        initialType="expense"
        editingTransaction={editingTx}
      />

      {/* Category Modal */}
      <Modal isOpen={isCategoryModalOpen} onClose={() => setIsCategoryModalOpen(false)} title="Add Custom Expense Category">
        <form onSubmit={handleCreateCategory} className="space-y-4">
          {catError && <p className="text-xs text-rose-600 bg-rose-50 p-2 rounded-xl">{catError}</p>}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Category Name *</label>
            <input
              type="text"
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              placeholder="e.g. Pet Care, Gaming"
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
              required
            />
          </div>
          <div className="flex justify-end gap-2 pt-3">
            <Button variant="secondary" onClick={() => setIsCategoryModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="danger">
              Save Category
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={!!deletingId}
        onClose={() => setDeletingId(null)}
        onConfirm={handleDelete}
        title="Delete Expense Record"
        message="Are you sure you want to delete this expense record?"
        loading={deleteLoading}
      />
    </div>
  );
};
