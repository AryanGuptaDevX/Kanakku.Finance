import React, { useState } from 'react';
import { Settings as SettingsIcon, DollarSign, Database, RefreshCw, AlertTriangle, ShieldCheck } from 'lucide-react';
import { useCurrency } from '../context/CurrencyContext';
import { settingsAPI } from '../services/api';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { ConfirmModal } from '../components/common/ConfirmModal';

export const Settings = () => {
  const { currency, setCurrency } = useCurrency();
  const [selectedSymbol, setSelectedSymbol] = useState(currency);
  const [savedMsg, setSavedMsg] = useState('');

  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [resetMsg, setResetMsg] = useState('');

  const currencies = [
    { symbol: '₹', name: 'Indian Rupee (INR)' },
    { symbol: '$', name: 'US Dollar (USD)' },
    { symbol: '€', name: 'Euro (EUR)' },
    { symbol: '£', name: 'British Pound (GBP)' },
    { symbol: '¥', name: 'Japanese Yen (JPY)' },
    { symbol: 'A$', name: 'Australian Dollar (AUD)' },
    { symbol: 'C$', name: 'Canadian Dollar (CAD)' },
  ];

  const handleSaveCurrency = async (e) => {
    e.preventDefault();
    await setCurrency(selectedSymbol);
    setSavedMsg('Currency preference updated successfully!');
    setTimeout(() => setSavedMsg(''), 3000);
  };

  const handleResetData = async () => {
    setResetting(true);
    try {
      await settingsAPI.resetData();
      setResetMsg('Database reset completely. Default categories re-seeded.');
      setIsResetModalOpen(false);
      setTimeout(() => window.location.reload(), 1500);
    } catch (err) {
      console.error('Failed to reset database:', err);
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl animate-fadeIn">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Application Settings</h2>
        <p className="text-xs text-slate-500 mt-1">Configure currency preference, view app metadata, or reset application data</p>
      </div>

      {savedMsg && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
          {savedMsg}
        </div>
      )}

      {resetMsg && (
        <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold">
          {resetMsg}
        </div>
      )}

      {/* Currency Settings Card */}
      <Card title="Display Currency Preference">
        <form onSubmit={handleSaveCurrency} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">Select Primary Currency Symbol</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {currencies.map((c) => (
                <button
                  key={c.symbol}
                  type="button"
                  onClick={() => setSelectedSymbol(c.symbol)}
                  className={`p-3 rounded-xl border text-left transition ${
                    selectedSymbol === c.symbol
                      ? 'bg-blue-50 border-blue-600 text-blue-700 font-bold shadow-sm'
                      : 'bg-white border-slate-200 text-slate-700 hover:border-blue-400 hover:bg-slate-50'
                  }`}
                >
                  <span className="text-lg font-bold block">{c.symbol}</span>
                  <span className="text-[11px] text-slate-500 block mt-0.5">{c.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button type="submit" variant="primary">
              Save Preferences
            </Button>
          </div>
        </form>
      </Card>

      {/* Architecture & Security Overview Card */}
      <Card title="System Information & Security">
        <div className="space-y-3 text-xs text-slate-600">
          <div className="flex items-center gap-2 text-emerald-600 font-semibold">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Pure Local Algorithmic Software Architecture</span>
          </div>
          <p className="text-slate-500 leading-relaxed">
            MoneyManager operates 100% locally without external AI APIs or financial market integrations. All calculations (Available Balance, Savings Rate, Budget remaining, EMI schedules, SIP ROI) are computed algorithmically on your local FastAPI server.
          </p>
          <div className="pt-3 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px]">
            <div>
              <span className="text-slate-500 block">Backend Framework</span>
              <span className="font-bold text-slate-800">FastAPI + SQLAlchemy</span>
            </div>
            <div>
              <span className="text-slate-500 block">Database</span>
              <span className="font-bold text-slate-800">SQLite (money_manager.db)</span>
            </div>
            <div>
              <span className="text-slate-500 block">Frontend Stack</span>
              <span className="font-bold text-slate-800">React + Vite + Tailwind</span>
            </div>
            <div>
              <span className="text-slate-500 block">Charts Engine</span>
              <span className="font-bold text-slate-800">Recharts</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Danger Zone Card */}
      <Card title="Danger Zone" className="border-rose-200 bg-rose-50/50">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h4 className="text-sm font-bold text-rose-700">Reset Application Database</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-lg">
              Wipe all transactions, budgets, EMI loans, SIP investments, and custom categories. Restores default database seeds.
            </p>
          </div>
          <Button variant="danger" onClick={() => setIsResetModalOpen(true)} icon={AlertTriangle}>
            Reset All Data
          </Button>
        </div>
      </Card>

      {/* Reset Confirmation Modal */}
      <ConfirmModal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        onConfirm={handleResetData}
        title="Wipe Database & Reset Data?"
        message="This action will permanently delete all logged transactions, budgets, EMI loans, and SIP investments. Default categories will be re-seeded."
        confirmText="Reset Entire DB"
        loading={resetting}
      />
    </div>
  );
};
