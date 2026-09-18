import React, { useState, useEffect } from 'react';
import { Plus, Landmark, CheckCircle, CreditCard, Trash2, Edit3 } from 'lucide-react';
import { emiAPI } from '../services/api';
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

export const EMI = ({ onRefresh }) => {
  const { currency } = useCurrency();
  const [emis, setEmis] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmi, setEditingEmi] = useState(null);
  const [loanName, setLoanName] = useState('');
  const [principalAmount, setPrincipalAmount] = useState('');
  const [monthlyPayment, setMonthlyPayment] = useState('');
  const [interestRate, setInterestRate] = useState('10.5');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDay, setDueDay] = useState(5);
  const [totalPayments, setTotalPayments] = useState(12);

  const [modalError, setModalError] = useState('');
  const [saving, setSaving] = useState(false);

  const [deletingId, setDeletingId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    loadEMIs();
  }, []);

  const loadEMIs = async () => {
    setLoading(true);
    try {
      const res = await emiAPI.getAll();
      setEmis(res.data);
    } catch (err) {
      console.error('Failed to load EMI loans:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (emi = null) => {
    if (emi) {
      setEditingEmi(emi);
      setLoanName(emi.loan_name);
      setPrincipalAmount(emi.principal_amount.toString());
      setMonthlyPayment(emi.monthly_payment.toString());
      setInterestRate(emi.interest_rate.toString());
      setStartDate(emi.start_date);
      setDueDay(emi.due_day);
      setTotalPayments(emi.total_payments);
    } else {
      setEditingEmi(null);
      setLoanName('');
      setPrincipalAmount('');
      setMonthlyPayment('');
      setInterestRate('10.5');
      setStartDate(new Date().toISOString().split('T')[0]);
      setDueDay(5);
      setTotalPayments(12);
    }
    setModalError('');
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setModalError('');

    const pAmt = parseFloat(principalAmount);
    const mPay = parseFloat(monthlyPayment);
    const iRate = parseFloat(interestRate);
    const tPay = parseInt(totalPayments);

    if (!loanName.trim()) {
      setModalError('Loan name is required');
      return;
    }
    if (isNaN(pAmt) || pAmt <= 0) {
      setModalError('Principal amount must be > 0');
      return;
    }
    if (isNaN(mPay) || mPay <= 0) {
      setModalError('Monthly payment must be > 0');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        loan_name: loanName.trim(),
        principal_amount: pAmt,
        monthly_payment: mPay,
        interest_rate: isNaN(iRate) ? 0 : iRate,
        start_date: startDate,
        due_day: parseInt(dueDay),
        total_payments: tPay
      };

      if (editingEmi) {
        await emiAPI.update(editingEmi.id, payload);
      } else {
        await emiAPI.create(payload);
      }

      setSaving(false);
      setIsModalOpen(false);
      loadEMIs();
      if (onRefresh) onRefresh();
    } catch (err) {
      setSaving(false);
      setModalError(err.response?.data?.detail || 'Failed to save EMI loan');
    }
  };

  const handlePayInstallment = async (emiId) => {
    try {
      await emiAPI.pay(emiId);
      loadEMIs();
      if (onRefresh) onRefresh();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to record EMI payment');
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    setDeleteLoading(true);
    try {
      await emiAPI.delete(deletingId);
      setDeletingId(null);
      loadEMIs();
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error('Failed to delete EMI:', err);
    } finally {
      setDeleteLoading(false);
    }
  };

  const totalMonthlyEmi = emis.filter(e => !e.is_completed).reduce((a, c) => a + c.monthly_payment, 0);
  const totalOutstandingLoan = emis.reduce((a, c) => a + c.remaining_amount, 0);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">EMI & Loan Tracker</h2>
          <p className="text-xs text-slate-500 mt-1">Track active loans, remaining principal, monthly payment schedules, and repayment progress</p>
        </div>
        <Button onClick={() => handleOpenModal()} variant="primary" icon={Plus}>
          Add Loan / EMI
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Monthly EMI Outflow"
          amount={totalMonthlyEmi}
          icon={CreditCard}
          color="amber"
          subtitle="Active monthly EMI obligation"
        />
        <StatCard
          title="Total Outstanding Debt"
          amount={totalOutstandingLoan}
          icon={Landmark}
          color="rose"
          subtitle="Remaining principal across loans"
        />
        <StatCard
          title="Active EMI Loans"
          amount={emis.filter(e => !e.is_completed).length}
          isCurrency={false}
          icon={CheckCircle}
          color="sky"
          subtitle="Loans currently being paid off"
        />
      </div>

      {/* EMI Cards List */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Active & Completed Loans</h3>

        {loading ? (
          <LoadingSpinner label="Fetching EMI details..." />
        ) : emis.length === 0 ? (
          <EmptyState
            title="No EMI Loans Found"
            description="You have not created any loan or EMI entries."
            actionLabel="Add Loan / EMI"
            onAction={() => handleOpenModal()}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {emis.map((emi) => (
              <Card key={emi.id} className={`relative overflow-hidden ${emi.is_completed ? 'opacity-75 bg-slate-50' : ''}`}>
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-base font-bold text-slate-900">{emi.loan_name}</h4>
                    <p className="text-xs text-slate-500 mt-0.5">Start Date: {formatDate(emi.start_date)}</p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-[11px] font-extrabold ${emi.is_completed ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                    {emi.is_completed ? 'FULLY PAID' : 'ACTIVE'}
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 py-3 border-y border-slate-100 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[11px] font-semibold">Monthly EMI</span>
                    <span className="font-extrabold text-slate-900 text-base">{formatCurrency(emi.monthly_payment, currency)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px] font-semibold">Remaining Balance</span>
                    <span className="font-extrabold text-rose-600 text-base">{formatCurrency(emi.remaining_amount, currency)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px] font-semibold">Payments Done</span>
                    <span className="font-bold text-slate-700">{emi.payments_made} / {emi.total_payments} ({emi.payments_remaining} left)</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px] font-semibold">Next Due Date</span>
                    <span className="font-bold text-blue-600">{emi.next_due_date}</span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-4 space-y-1.5">
                  <div className="flex justify-between text-[11px] font-bold text-slate-600">
                    <span>Repayment Progress</span>
                    <span>{emi.progress_percentage}%</span>
                  </div>
                  <ProgressBar percentage={emi.progress_percentage} color={emi.is_completed ? 'emerald' : 'sky'} height="h-2.5" />
                </div>

                {/* Actions */}
                <div className="mt-5 flex items-center justify-between pt-3 border-t border-slate-100">
                  {!emi.is_completed ? (
                    <Button size="sm" variant="success" onClick={() => handlePayInstallment(emi.id)} icon={CreditCard}>
                      Record Payment
                    </Button>
                  ) : (
                    <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5" /> Paid Off
                    </span>
                  )}

                  <div className="flex gap-1">
                    <button onClick={() => handleOpenModal(emi)} className="p-1.5 rounded-xl text-slate-400 hover:text-blue-600 hover:bg-slate-100 transition">
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button onClick={() => setDeletingId(emi.id)} className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-slate-100 transition">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingEmi ? 'Edit Loan / EMI' : 'Add Loan / EMI'}>
        <form onSubmit={handleSave} className="space-y-4">
          {modalError && <p className="text-xs text-rose-600 bg-rose-50 p-2 rounded-xl">{modalError}</p>}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Loan Title *</label>
            <input
              type="text"
              value={loanName}
              onChange={(e) => setLoanName(e.target.value)}
              placeholder="e.g. Laptop Loan, Car Finance"
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Principal Amount ({currency}) *</label>
              <input
                type="number"
                step="0.01"
                value={principalAmount}
                onChange={(e) => setPrincipalAmount(e.target.value)}
                placeholder="42000"
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Monthly Payment ({currency}) *</label>
              <input
                type="number"
                step="0.01"
                value={monthlyPayment}
                onChange={(e) => setMonthlyPayment(e.target.value)}
                placeholder="3000"
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Interest (%)</label>
              <input
                type="number"
                step="0.1"
                value={interestRate}
                onChange={(e) => setInterestRate(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Installments</label>
              <input
                type="number"
                value={totalPayments}
                onChange={(e) => setTotalPayments(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Due Day</label>
              <input
                type="number"
                min="1"
                max="31"
                value={dueDay}
                onChange={(e) => setDueDay(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                required
              />
            </div>
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

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)} disabled={saving}>Cancel</Button>
            <Button type="submit" variant="primary" disabled={saving}>{saving ? 'Saving...' : 'Save EMI'}</Button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={!!deletingId}
        onClose={() => setDeletingId(null)}
        onConfirm={handleDelete}
        title="Delete Loan Entry"
        message="Are you sure you want to delete this loan record?"
        loading={deleteLoading}
      />
    </div>
  );
};
