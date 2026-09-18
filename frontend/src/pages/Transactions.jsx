import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit3, Search, ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { transactionAPI, categoryAPI } from '../services/api';
import { useCurrency } from '../context/CurrencyContext';
import { formatCurrency, formatDate } from '../utils/formatters';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { EmptyState } from '../components/common/EmptyState';
import { TransactionModal } from '../components/common/TransactionModal';
import { ConfirmModal } from '../components/common/ConfirmModal';

export const Transactions = ({ selectedMonth, onRefresh }) => {
  const { currency } = useCurrency();
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [typeFilter, setTypeFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, [selectedMonth, typeFilter, categoryFilter]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [txRes, catRes] = await Promise.all([
        transactionAPI.getAll({
          month: selectedMonth,
          type: typeFilter || undefined,
          category_id: categoryFilter || undefined
        }),
        categoryAPI.getAll()
      ]);
      setTransactions(txRes.data);
      setCategories(catRes.data);
    } catch (err) {
      console.error('Failed to load transactions:', err);
    } finally {
      setLoading(false);
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
      console.error('Failed to delete transaction:', err);
    } finally {
      setDeleteLoading(false);
    }
  };

  const filteredTransactions = transactions.filter((t) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        t.source_or_payee.toLowerCase().includes(q) ||
        (t.description && t.description.toLowerCase().includes(q)) ||
        (t.category?.name && t.category.name.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Transactions Log</h2>
          <p className="text-xs text-slate-500 mt-1">Manage all cashflows and transaction history for {selectedMonth}</p>
        </div>
        <Button
          onClick={() => {
            setEditingTransaction(null);
            setIsModalOpen(true);
          }}
          variant="primary"
          icon={Plus}
        >
          Add Transaction
        </Button>
      </div>

      {/* Filter Toolbar Card */}
      <Card className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search by payee, notes, category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Type Filter */}
          <div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
            >
              <option value="">All Types (Income & Expense)</option>
              <option value="income">Income Only</option>
              <option value="expense">Expense Only</option>
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.type === 'income' ? ' [Income]' : ' [Expense]'} {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Transactions Data Table */}
      <Card>
        {loading ? (
          <LoadingSpinner label="Fetching transactions..." />
        ) : filteredTransactions.length === 0 ? (
          <EmptyState
            title="No Transactions Found"
            description="No transactions match your selected filters."
            actionLabel="Add Transaction"
            onAction={() => {
              setEditingTransaction(null);
              setIsModalOpen(true);
            }}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4">Type</th>
                  <th className="py-3.5 px-4">Source / Payee</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Method</th>
                  <th className="py-3.5 px-4">Notes</th>
                  <th className="py-3.5 px-4 text-right">Amount</th>
                  <th className="py-3.5 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">{formatDate(tx.date)}</td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                          tx.type === 'income' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {tx.type === 'income' ? <ArrowDownLeft className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                        {tx.type.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs">
                          {tx.source_or_payee.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-bold text-slate-900">{tx.source_or_payee}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                        {tx.category?.name}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">{tx.payment_method}</td>
                    <td className="py-3.5 px-4 text-slate-500 truncate max-w-xs">{tx.description || '-'}</td>
                    <td className={`py-3.5 px-4 text-right font-black text-sm ${tx.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount, currency)}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => {
                            setEditingTransaction(tx);
                            setIsModalOpen(true);
                          }}
                          className="p-1.5 rounded-xl text-slate-400 hover:text-blue-600 hover:bg-slate-100 transition"
                          title="Edit"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeletingId(tx.id)}
                          className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-slate-100 transition"
                          title="Delete"
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

      {/* Add / Edit Transaction Modal */}
      <TransactionModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingTransaction(null);
        }}
        onSuccess={() => {
          loadData();
          if (onRefresh) onRefresh();
        }}
        editingTransaction={editingTransaction}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deletingId}
        onClose={() => setDeletingId(null)}
        onConfirm={handleDelete}
        title="Delete Transaction"
        message="Are you sure you want to delete this transaction? This action will permanently remove it from your database and recalculate all financial metrics."
        loading={deleteLoading}
      />
    </div>
  );
};
