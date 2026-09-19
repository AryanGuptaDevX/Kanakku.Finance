import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { categoryAPI, transactionAPI } from '../../services/api';
import api from '../../services/api';

export const TransactionModal = ({
  isOpen,
  onClose,
  onSuccess,
  initialType = 'expense',
  editingTransaction = null
}) => {
  const [type, setType] = useState(initialType);
  const [amount, setAmount] = useState('');
  const [sourceOrPayee, setSourceOrPayee] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [accountId, setAccountId] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [categories, setCategories] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadAccounts();
      if (editingTransaction) {
        setType(editingTransaction.type);
        setAmount(editingTransaction.amount.toString());
        setSourceOrPayee(editingTransaction.source_or_payee);
        setCategoryId(editingTransaction.category_id ? editingTransaction.category_id.toString() : '');
        setAccountId(editingTransaction.account_id ? editingTransaction.account_id.toString() : '');
        setDescription(editingTransaction.description || '');
        setDate(editingTransaction.date);
        setPaymentMethod(editingTransaction.payment_method || 'Cash');
      } else {
        setType(initialType);
        setAmount('');
        setSourceOrPayee('');
        setCategoryId('');
        setAccountId('');
        setDescription('');
        setDate(new Date().toISOString().split('T')[0]);
        setPaymentMethod('Cash');
      }
      setError('');
    }
  }, [isOpen, initialType, editingTransaction]);

  useEffect(() => {
    if (isOpen) {
      loadCategories(type);
    }
  }, [type, isOpen]);

  const loadCategories = async (selectedType) => {
    try {
      const res = await categoryAPI.getAll(selectedType);
      setCategories(res.data);
      if (res.data.length > 0 && !editingTransaction) {
        setCategoryId(res.data[0].id.toString());
      }
    } catch (err) {
      console.error('Failed to load categories:', err);
    }
  };

  const loadAccounts = async () => {
    try {
      const res = await api.get('/accounts');
      setAccounts(res.data);
      if (res.data.length > 0 && !accountId && !editingTransaction) {
        setAccountId(res.data[0].id.toString());
      }
    } catch (err) {
      console.error('Failed to load accounts:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Amount must be greater than 0');
      return;
    }
    if (!sourceOrPayee.trim()) {
      setError(type === 'income' ? 'Source name is required' : 'Payee/Item name is required');
      return;
    }
    if (!categoryId) {
      setError('Please select a valid category');
      return;
    }
    if (!date) {
      setError('Date is required');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        type,
        amount: parsedAmount,
        source_or_payee: sourceOrPayee.trim(),
        category_id: parseInt(categoryId),
        account_id: accountId ? parseInt(accountId) : null,
        description: description.trim() || null,
        date,
        payment_method: paymentMethod
      };

      if (editingTransaction) {
        await transactionAPI.update(editingTransaction.id, payload);
      } else {
        await transactionAPI.create(payload);
      }

      setLoading(false);
      onSuccess();
      onClose();
    } catch (err) {
      setLoading(false);
      const errMsg = err.response?.data?.detail || 'Failed to save transaction';
      setError(typeof errMsg === 'string' ? errMsg : JSON.stringify(errMsg));
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingTransaction ? 'Edit Transaction' : `Add ${type === 'income' ? 'Income' : 'Expense'}`}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-xs font-semibold">
            {error}
          </div>
        )}

        {/* Transaction Type Selector */}
        {!editingTransaction && (
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-2xl border border-slate-200">
            <button
              type="button"
              onClick={() => setType('expense')}
              className={`py-2 text-xs font-bold rounded-xl transition-all ${
                type === 'expense' ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Expense
            </button>
            <button
              type="button"
              onClick={() => setType('income')}
              className={`py-2 text-xs font-bold rounded-xl transition-all ${
                type === 'income' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Income
            </button>
          </div>
        )}

        {/* Amount */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Amount *</label>
          <input
            type="number"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            required
          />
        </div>

        {/* Source / Payee */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            {type === 'income' ? 'Source * (e.g. Salary, Client A)' : 'Payee / Item * (e.g. Supermarket)'}
          </label>
          <input
            type="text"
            value={sourceOrPayee}
            onChange={(e) => setSourceOrPayee(e.target.value)}
            placeholder={type === 'income' ? 'e.g. Monthly Salary' : 'e.g. Grocery Store'}
            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* Category */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Category *</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              required
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Account / Wallet */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Account / Wallet</label>
            <select
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-blue-500"
            >
              <option value="">None / Unspecified</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* Date */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Date *</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-blue-500"
              required
            />
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Payment Method</label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-blue-500"
            >
              <option value="Cash">Cash</option>
              <option value="UPI">UPI / Digital Wallet</option>
              <option value="Credit Card">Credit Card</option>
              <option value="Debit Card">Debit Card</option>
              <option value="Bank Transfer">Bank Transfer</option>
            </select>
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Notes (Optional)</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            placeholder="Additional notes..."
            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant={type === 'income' ? 'success' : 'danger'}
            disabled={loading}
          >
            {loading ? 'Saving...' : editingTransaction ? 'Update Transaction' : `Save ${type === 'income' ? 'Income' : 'Expense'}`}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
