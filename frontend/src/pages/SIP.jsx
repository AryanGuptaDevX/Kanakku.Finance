import React, { useState, useEffect } from 'react';
import { Plus, TrendingUp, TrendingDown, Trash2, Edit3, DollarSign, Wallet } from 'lucide-react';
import { sipAPI } from '../services/api';
import { useCurrency } from '../context/CurrencyContext';
import { formatCurrency, formatDate } from '../utils/formatters';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { StatCard } from '../components/common/StatCard';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { EmptyState } from '../components/common/EmptyState';
import { Modal } from '../components/common/Modal';
import { ConfirmModal } from '../components/common/ConfirmModal';

export const SIP = () => {
  const { currency } = useCurrency();
  const [sips, setSips] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSip, setEditingSip] = useState(null);
  const [fundName, setFundName] = useState('');
  const [monthlyAmount, setMonthlyAmount] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [totalInvested, setTotalInvested] = useState('');
  const [currentValue, setCurrentValue] = useState('');
  const [modalError, setModalError] = useState('');
  const [saving, setSaving] = useState(false);

  const [deletingId, setDeletingId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    loadSIPs();
  }, []);

  const loadSIPs = async () => {
    setLoading(true);
    try {
      const res = await sipAPI.getAll();
      setSips(res.data);
    } catch (err) {
      console.error('Failed to load SIP investments:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (sip = null) => {
    if (sip) {
      setEditingSip(sip);
      setFundName(sip.fund_name);
      setMonthlyAmount(sip.monthly_amount.toString());
      setStartDate(sip.start_date);
      setTotalInvested(sip.total_invested.toString());
      setCurrentValue(sip.current_value.toString());
    } else {
      setEditingSip(null);
      setFundName('');
      setMonthlyAmount('');
      setStartDate(new Date().toISOString().split('T')[0]);
      setTotalInvested('');
      setCurrentValue('');
    }
    setModalError('');
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setModalError('');

    const mAmt = parseFloat(monthlyAmount);
    const tInv = parseFloat(totalInvested);
    const cVal = parseFloat(currentValue);

    if (!fundName.trim()) {
      setModalError('Fund name is required');
      return;
    }
    if (isNaN(mAmt) || mAmt <= 0) {
      setModalError('Monthly SIP amount must be > 0');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        fund_name: fundName.trim(),
        monthly_amount: mAmt,
        start_date: startDate,
        total_invested: tInv,
        current_value: cVal
      };

      if (editingSip) {
        await sipAPI.update(editingSip.id, payload);
      } else {
        await sipAPI.create(payload);
      }

      setSaving(false);
      setIsModalOpen(false);
      loadSIPs();
    } catch (err) {
      setSaving(false);
      setModalError(err.response?.data?.detail || 'Failed to save SIP investment');
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    setDeleteLoading(true);
    try {
      await sipAPI.delete(deletingId);
      setDeletingId(null);
      loadSIPs();
    } catch (err) {
      console.error('Failed to delete SIP:', err);
    } finally {
      setDeleteLoading(false);
    }
  };

  const totalMonthlySip = sips.reduce((a, c) => a + c.monthly_amount, 0);
  const totalInvestedSum = sips.reduce((a, c) => a + c.total_invested, 0);
  const totalCurrentValueSum = sips.reduce((a, c) => a + c.current_value, 0);
  const overallPL = totalCurrentValueSum - totalInvestedSum;
  const overallROI = totalInvestedSum > 0 ? (overallPL / totalInvestedSum * 100) : 0;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">SIP Investment Tracker</h2>
          <p className="text-xs text-slate-500 mt-1">Track systematic investment plans, portfolio valuation, profit/loss, and overall ROI</p>
        </div>
        <Button onClick={() => handleOpenModal()} variant="primary" icon={Plus}>
          Add SIP Fund
        </Button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Monthly SIP Outflow"
          amount={totalMonthlySip}
          icon={Wallet}
          color="indigo"
          subtitle="Total active monthly SIPs"
        />
        <StatCard
          title="Total Capital Invested"
          amount={totalInvestedSum}
          icon={DollarSign}
          color="sky"
          subtitle="Cumulative invested amount"
        />
        <StatCard
          title="Current Portfolio Value"
          amount={totalCurrentValueSum}
          icon={TrendingUp}
          color="purple"
          subtitle="Current valuation"
        />
        <StatCard
          title="Overall Profit / Loss"
          amount={overallPL}
          icon={overallPL >= 0 ? TrendingUp : TrendingDown}
          color={overallPL >= 0 ? 'emerald' : 'rose'}
          subtitle={`Overall Return: ${overallROI.toFixed(2)}%`}
        />
      </div>

      {/* SIP Portfolio Table */}
      <Card title="SIP Fund Portfolio">
        {loading ? (
          <LoadingSpinner label="Fetching portfolio..." />
        ) : sips.length === 0 ? (
          <EmptyState
            title="No SIP Funds Added"
            description="You have not added any systematic investment plan funds."
            actionLabel="Add SIP Fund"
            onAction={() => handleOpenModal()}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">Fund Name</th>
                  <th className="py-3.5 px-4">Monthly SIP</th>
                  <th className="py-3.5 px-4">Start Date</th>
                  <th className="py-3.5 px-4">Total Invested</th>
                  <th className="py-3.5 px-4">Current Value</th>
                  <th className="py-3.5 px-4 text-right">Profit / Loss</th>
                  <th className="py-3.5 px-4 text-center">Return (%)</th>
                  <th className="py-3.5 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {sips.map((sip) => (
                  <tr key={sip.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3.5 px-4 font-bold text-slate-900">{sip.fund_name}</td>
                    <td className="py-3.5 px-4 font-bold text-blue-600">{formatCurrency(sip.monthly_amount, currency)}</td>
                    <td className="py-3.5 px-4 text-slate-500">{formatDate(sip.start_date)}</td>
                    <td className="py-3.5 px-4 text-slate-700">{formatCurrency(sip.total_invested, currency)}</td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">{formatCurrency(sip.current_value, currency)}</td>
                    <td className={`py-3.5 px-4 text-right font-black ${sip.profit_loss >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {sip.profit_loss >= 0 ? '+' : ''}{formatCurrency(sip.profit_loss, currency)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${sip.return_percentage >= 0 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}>
                        {sip.return_percentage >= 0 ? '+' : ''}{sip.return_percentage}%
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => handleOpenModal(sip)} className="p-1.5 rounded-xl text-slate-400 hover:text-blue-600 hover:bg-slate-100 transition">
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button onClick={() => setDeletingId(sip.id)} className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-slate-100 transition">
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
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingSip ? 'Edit SIP Investment' : 'Add SIP Fund'}>
        <form onSubmit={handleSave} className="space-y-4">
          {modalError && <p className="text-xs text-rose-600 bg-rose-50 p-2 rounded-xl">{modalError}</p>}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Fund Name *</label>
            <input
              type="text"
              value={fundName}
              onChange={(e) => setFundName(e.target.value)}
              placeholder="e.g. Parag Parikh Flexi Cap"
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Monthly SIP ({currency}) *</label>
              <input
                type="number"
                step="0.01"
                value={monthlyAmount}
                onChange={(e) => setMonthlyAmount(e.target.value)}
                placeholder="500"
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Start Date *</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Total Invested ({currency}) *</label>
              <input
                type="number"
                step="0.01"
                value={totalInvested}
                onChange={(e) => setTotalInvested(e.target.value)}
                placeholder="6000"
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Current Value ({currency}) *</label>
              <input
                type="number"
                step="0.01"
                value={currentValue}
                onChange={(e) => setCurrentValue(e.target.value)}
                placeholder="6800"
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                required
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)} disabled={saving}>Cancel</Button>
            <Button type="submit" variant="primary" disabled={saving}>{saving ? 'Saving...' : 'Save SIP'}</Button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={!!deletingId}
        onClose={() => setDeletingId(null)}
        onConfirm={handleDelete}
        title="Delete SIP Fund"
        message="Are you sure you want to remove this SIP record?"
        loading={deleteLoading}
      />
    </div>
  );
};
