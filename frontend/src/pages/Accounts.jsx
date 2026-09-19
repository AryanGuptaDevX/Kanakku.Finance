import React, { useState, useEffect } from 'react';
import { Wallet, Landmark, CreditCard, Plus, ArrowRightLeft, Trash2, Edit2, Check } from 'lucide-react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { EmptyState } from '../components/common/EmptyState';
import { useCurrency } from '../context/CurrencyContext';
import { useToast } from '../context/ToastContext';
import api from '../services/api';

const Accounts = () => {
  const { currency } = useCurrency();
  const { addToast } = useToast();
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(null);

  // Form states
  const [accountForm, setAccountForm] = useState({
    name: '',
    type: 'bank',
    initial_balance: '',
    color: '#2563eb',
    is_default: false,
  });

  const [transferForm, setTransferForm] = useState({
    from_account_id: '',
    to_account_id: '',
    amount: '',
    description: 'Account Transfer',
  });

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const res = await api.get('/accounts');
      setAccounts(res.data);
    } catch (err) {
      addToast('Failed to load accounts data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const handleOpenAccountModal = (acc = null) => {
    if (acc) {
      setSelectedAccount(acc);
      setAccountForm({
        name: acc.name,
        type: acc.type,
        initial_balance: acc.initial_balance.toString(),
        color: acc.color || '#2563eb',
        is_default: acc.is_default || false,
      });
    } else {
      setSelectedAccount(null);
      setAccountForm({
        name: '',
        type: 'bank',
        initial_balance: '0',
        color: '#2563eb',
        is_default: false,
      });
    }
    setIsAccountModalOpen(true);
  };

  const handleSaveAccount = async (e) => {
    e.preventDefault();
    if (!accountForm.name.trim()) {
      addToast('Account name is required', 'warning');
      return;
    }

    try {
      const payload = {
        name: accountForm.name.trim(),
        type: accountForm.type,
        initial_balance: parseFloat(accountForm.initial_balance) || 0,
        color: accountForm.color,
        is_default: accountForm.is_default,
      };

      if (selectedAccount) {
        await api.put(`/accounts/${selectedAccount.id}`, payload);
        addToast('Account updated successfully', 'success');
      } else {
        await api.post('/accounts', payload);
        addToast('New account created successfully', 'success');
      }
      setIsAccountModalOpen(false);
      fetchAccounts();
    } catch (err) {
      addToast(err.response?.data?.detail || 'Failed to save account', 'error');
    }
  };

  const handleDeleteAccount = async (id) => {
    if (!window.confirm('Are you sure you want to delete this account?')) return;
    try {
      await api.delete(`/accounts/${id}`);
      addToast('Account deleted', 'success');
      fetchAccounts();
    } catch (err) {
      addToast(err.response?.data?.detail || 'Failed to delete account', 'error');
    }
  };

  const handleTransferSubmit = async (e) => {
    e.preventDefault();
    if (!transferForm.from_account_id || !transferForm.to_account_id) {
      addToast('Please select both source and destination accounts', 'warning');
      return;
    }
    if (transferForm.from_account_id === transferForm.to_account_id) {
      addToast('Source and destination accounts must be different', 'warning');
      return;
    }
    const amt = parseFloat(transferForm.amount);
    if (!amt || amt <= 0) {
      addToast('Enter a valid transfer amount', 'warning');
      return;
    }

    try {
      await api.post(
        `/accounts/transfer?from_account_id=${transferForm.from_account_id}&to_account_id=${transferForm.to_account_id}&amount=${amt}&description=${encodeURIComponent(
          transferForm.description || 'Account Transfer'
        )}`
      );
      addToast('Funds transferred successfully', 'success');
      setIsTransferModalOpen(false);
      setTransferForm({ from_account_id: '', to_account_id: '', amount: '', description: 'Account Transfer' });
      fetchAccounts();
    } catch (err) {
      addToast(err.response?.data?.detail || 'Transfer failed', 'error');
    }
  };

  const getAccountIcon = (type) => {
    switch (type) {
      case 'bank':
        return <Landmark className="w-6 h-6 text-blue-600" />;
      case 'credit_card':
        return <CreditCard className="w-6 h-6 text-purple-600" />;
      case 'cash':
        return <Wallet className="w-6 h-6 text-emerald-600" />;
      default:
        return <Wallet className="w-6 h-6 text-amber-600" />;
    }
  };

  const totalBalance = accounts.reduce((acc, a) => acc + (a.current_balance || 0), 0);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Accounts & Wallets</h1>
          <p className="text-sm text-slate-500">Track real-time balances across bank accounts, cash, and digital wallets</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => {
              if (accounts.length >= 2) {
                setTransferForm((prev) => ({
                  ...prev,
                  from_account_id: accounts[0].id,
                  to_account_id: accounts[1].id,
                }));
                setIsTransferModalOpen(true);
              } else {
                addToast('You need at least 2 accounts to perform a transfer', 'info');
              }
            }}
          >
            <ArrowRightLeft className="w-4 h-4 mr-2" />
            Transfer Funds
          </Button>
          <Button onClick={() => handleOpenAccountModal()}>
            <Plus className="w-4 h-4 mr-2" />
            Add Account
          </Button>
        </div>
      </div>

      {/* Summary Stat Banner */}
      <Card className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <p className="text-blue-100 text-sm font-medium">Total Liquid Capital</p>
            <h2 className="text-3xl font-extrabold mt-1">
              {currency} {totalBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </h2>
          </div>
          <div className="flex items-center gap-6 bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-lg">
            <div>
              <p className="text-xs text-blue-200">Active Accounts</p>
              <p className="text-lg font-bold text-white">{accounts.length}</p>
            </div>
            <div className="w-px h-8 bg-white/20" />
            <div>
              <p className="text-xs text-blue-200">Default Account</p>
              <p className="text-sm font-bold text-white truncate max-w-[120px]">
                {accounts.find((a) => a.is_default)?.name || 'None'}
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Account Cards Grid */}
      {accounts.length === 0 ? (
        <EmptyState
          title="No Accounts Found"
          description="Create your first bank account or digital wallet to start tracking balances."
          actionText="Add Account"
          onAction={() => handleOpenAccountModal()}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {accounts.map((acc) => (
            <Card key={acc.id} className="relative overflow-hidden border-t-4" style={{ borderTopColor: acc.color || '#2563eb' }}>
              <div className="p-5 space-y-4">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-slate-100 rounded-xl">{getAccountIcon(acc.type)}</div>
                    <div>
                      <h3 className="font-bold text-slate-800 text-base flex items-center gap-1.5">
                        {acc.name}
                        {acc.is_default && (
                          <span className="text-[10px] bg-blue-100 text-blue-700 font-semibold px-2 py-0.5 rounded-full">
                            Default
                          </span>
                        )}
                      </h3>
                      <p className="text-xs text-slate-400 capitalize">{acc.type.replace('_', ' ')} Account</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenAccountModal(acc)}
                      className="p-1.5 text-slate-400 hover:text-blue-600 rounded-md hover:bg-slate-100 transition-colors"
                      title="Edit Account"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteAccount(acc.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md hover:bg-slate-100 transition-colors"
                      title="Delete Account"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl space-y-1">
                  <p className="text-xs text-slate-500">Current Balance</p>
                  <p className={`text-2xl font-bold ${acc.current_balance >= 0 ? 'text-slate-800' : 'text-rose-600'}`}>
                    {currency} {acc.current_balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </p>
                </div>

                <div className="flex justify-between items-center text-xs text-slate-500 pt-2 border-t border-slate-100">
                  <span>Opening: {currency} {acc.initial_balance.toLocaleString('en-IN')}</span>
                  <button
                    onClick={() => {
                      setTransferForm({
                        from_account_id: acc.id,
                        to_account_id: accounts.find((a) => a.id !== acc.id)?.id || '',
                        amount: '',
                        description: 'Account Transfer',
                      });
                      setIsTransferModalOpen(true);
                    }}
                    className="text-blue-600 font-medium hover:underline flex items-center gap-1"
                  >
                    Transfer <ArrowRightLeft className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Account Modal */}
      <Modal
        isOpen={isAccountModalOpen}
        onClose={() => setIsAccountModalOpen(false)}
        title={selectedAccount ? 'Edit Account' : 'Add New Account'}
      >
        <form onSubmit={handleSaveAccount} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Account Name
            </label>
            <input
              type="text"
              required
              placeholder="e.g. HDFC Savings, Cash Wallet"
              value={accountForm.name}
              onChange={(e) => setAccountForm({ ...accountForm, name: e.target.value })}
              className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Account Type
              </label>
              <select
                value={accountForm.type}
                onChange={(e) => setAccountForm({ ...accountForm, type: e.target.value })}
                className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              >
                <option value="bank">Bank Account</option>
                <option value="cash">Cash</option>
                <option value="credit_card">Credit Card</option>
                <option value="wallet">Digital Wallet / UPI</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Initial Balance ({currency})
              </label>
              <input
                type="number"
                step="0.01"
                required
                placeholder="0.00"
                value={accountForm.initial_balance}
                onChange={(e) => setAccountForm({ ...accountForm, initial_balance: e.target.value })}
                className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={accountForm.color}
                onChange={(e) => setAccountForm({ ...accountForm, color: e.target.value })}
                className="w-8 h-8 rounded border-none cursor-pointer"
              />
              <span className="text-xs text-slate-600 font-medium">Card Badge Color</span>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={accountForm.is_default}
                onChange={(e) => setAccountForm({ ...accountForm, is_default: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
              />
              <span className="text-xs text-slate-700 font-medium">Set as Default Account</span>
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button variant="outline" type="button" onClick={() => setIsAccountModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Save Account</Button>
          </div>
        </form>
      </Modal>

      {/* Transfer Funds Modal */}
      <Modal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        title="Transfer Funds Between Accounts"
      >
        <form onSubmit={handleTransferSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                From Account
              </label>
              <select
                value={transferForm.from_account_id}
                onChange={(e) => setTransferForm({ ...transferForm, from_account_id: parseInt(e.target.value) })}
                className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              >
                <option value="">Select Source</option>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({currency} {a.current_balance.toFixed(2)})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                To Account
              </label>
              <select
                value={transferForm.to_account_id}
                onChange={(e) => setTransferForm({ ...transferForm, to_account_id: parseInt(e.target.value) })}
                className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              >
                <option value="">Select Destination</option>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({currency} {a.current_balance.toFixed(2)})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Transfer Amount ({currency})
            </label>
            <input
              type="number"
              step="0.01"
              required
              placeholder="0.00"
              value={transferForm.amount}
              onChange={(e) => setTransferForm({ ...transferForm, amount: e.target.value })}
              className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Description / Notes
            </label>
            <input
              type="text"
              placeholder="e.g. ATM cash withdrawal"
              value={transferForm.description}
              onChange={(e) => setTransferForm({ ...transferForm, description: e.target.value })}
              className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button variant="outline" type="button" onClick={() => setIsTransferModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Complete Transfer</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Accounts;
