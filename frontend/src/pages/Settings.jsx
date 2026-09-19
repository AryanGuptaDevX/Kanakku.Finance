import React, { useState, useRef } from 'react';
import { Settings as SettingsIcon, DollarSign, Database, RefreshCw, AlertTriangle, ShieldCheck, Download, Upload } from 'lucide-react';
import { useCurrency } from '../context/CurrencyContext';
import { useToast } from '../context/ToastContext';
import { settingsAPI } from '../services/api';
import api from '../services/api';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';

export const Settings = () => {
  const { currency, setCurrency } = useCurrency();
  const { addToast } = useToast();
  const [selectedSymbol, setSelectedSymbol] = useState(currency);
  const [savedMsg, setSavedMsg] = useState('');
  const fileInputRef = useRef(null);

  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [confirmInput, setConfirmInput] = useState('');
  const [resetting, setResetting] = useState(false);
  const [resetMsg, setResetMsg] = useState('');
  const [resetError, setResetError] = useState('');

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
    addToast('Display currency updated successfully', 'success');
  };

  const handleExportBackup = async () => {
    try {
      const res = await api.get('/settings/backup');
      const jsonStr = JSON.stringify(res.data, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `kanakku_backup_${new Date().toISOString().substring(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      addToast('Backup JSON downloaded successfully', 'success');
    } catch (err) {
      addToast('Failed to export backup JSON', 'error');
    }
  };

  const handleRestoreBackup = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const backupData = JSON.parse(event.target.result);
        await api.post('/settings/restore', backupData);
        addToast('Database restored successfully from backup!', 'success');
        setTimeout(() => window.location.reload(), 1500);
      } catch (err) {
        addToast(err.response?.data?.detail || 'Invalid or corrupted backup file', 'error');
      }
    };
    reader.readAsText(file);
  };

  const handleResetData = async (e) => {
    e.preventDefault();
    setResetError('');
    if (confirmInput.trim() !== 'RESET') {
      setResetError('You must type "RESET" exactly to confirm.');
      return;
    }

    setResetting(true);
    try {
      await settingsAPI.resetData('RESET');
      addToast('Database reset completely.', 'info');
      setIsResetModalOpen(false);
      setConfirmInput('');
      setTimeout(() => window.location.reload(), 1500);
    } catch (err) {
      console.error('Failed to reset database:', err);
      setResetError(err.response?.data?.detail || 'Failed to reset database');
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl animate-fadeIn">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Application Settings</h2>
        <p className="text-xs text-slate-500 mt-1">Configure currency preference, view app metadata, backup/restore data, or reset application state</p>
      </div>

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

      {/* Backup & Restore Card */}
      <Card title="Database Backup & Restoration">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h4 className="text-sm font-bold text-slate-800">Export or Restore Data Snapshots</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-lg">
              Export your full financial dataset (transactions, accounts, budgets, EMI loans, SIPs) as a JSON file or import a previous snapshot to restore system state.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={handleExportBackup}>
              <Download className="w-4 h-4 mr-2" /> Export JSON
            </Button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleRestoreBackup}
              accept=".json"
              className="hidden"
            />
            <Button onClick={() => fileInputRef.current?.click()}>
              <Upload className="w-4 h-4 mr-2" /> Restore JSON
            </Button>
          </div>
        </div>
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
          <Button variant="danger" onClick={() => { setConfirmInput(''); setResetError(''); setIsResetModalOpen(true); }} icon={AlertTriangle}>
            Reset All Data
          </Button>
        </div>
      </Card>

      {/* Protected Reset Confirmation Modal */}
      <Modal isOpen={isResetModalOpen} onClose={() => setIsResetModalOpen(false)} title="Wipe Database & Reset Data">
        <form onSubmit={handleResetData} className="space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed">
            This action will <strong className="text-rose-600">permanently delete all logged transactions, budgets, EMI loans, and SIP investments</strong>.
          </p>

          {resetError && (
            <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-xs font-semibold">
              {resetError}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Type <span className="font-black text-rose-600">RESET</span> to confirm *
            </label>
            <input
              type="text"
              value={confirmInput}
              onChange={(e) => setConfirmInput(e.target.value)}
              placeholder="RESET"
              className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-rose-500"
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button variant="secondary" onClick={() => setIsResetModalOpen(false)} disabled={resetting}>Cancel</Button>
            <Button
              type="submit"
              variant="danger"
              disabled={resetting || confirmInput.trim() !== 'RESET'}
            >
              {resetting ? 'Resetting...' : 'Wipe & Reset Database'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
