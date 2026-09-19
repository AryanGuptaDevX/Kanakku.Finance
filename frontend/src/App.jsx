import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { CurrencyProvider } from './context/CurrencyContext';
import { ToastProvider } from './context/ToastContext';
import { MainLayout } from './components/layout/MainLayout';

import { Dashboard } from './pages/Dashboard';
import { Transactions } from './pages/Transactions';
import Accounts from './pages/Accounts';
import { Income } from './pages/Income';
import { Expenses } from './pages/Expenses';
import { Budgets } from './pages/Budgets';
import { Recurring } from './pages/Recurring';
import { EMI } from './pages/EMI';
import { SIP } from './pages/SIP';
import { SavingsGoals } from './pages/SavingsGoals';
import { Analytics } from './pages/Analytics';
import { Export } from './pages/Export';
import { Settings } from './pages/Settings';

export default function App() {
  const currentMonth = new Date().toISOString().substring(0, 7); // YYYY-MM
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleTriggerRefresh = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <CurrencyProvider>
      <ToastProvider>
        <BrowserRouter>
          <MainLayout
            selectedMonth={selectedMonth}
            onMonthChange={setSelectedMonth}
            onTransactionAdded={handleTriggerRefresh}
          >
            <Routes>
              <Route path="/" element={<Dashboard selectedMonth={selectedMonth} onRefresh={refreshTrigger} />} />
              <Route path="/transactions" element={<Transactions selectedMonth={selectedMonth} onRefresh={handleTriggerRefresh} />} />
              <Route path="/accounts" element={<Accounts />} />
              <Route path="/income" element={<Income selectedMonth={selectedMonth} onRefresh={handleTriggerRefresh} />} />
              <Route path="/expenses" element={<Expenses selectedMonth={selectedMonth} onRefresh={handleTriggerRefresh} />} />
              <Route path="/budgets" element={<Budgets selectedMonth={selectedMonth} />} />
              <Route path="/recurring" element={<Recurring selectedMonth={selectedMonth} onRefresh={handleTriggerRefresh} />} />
              <Route path="/emi" element={<EMI onRefresh={handleTriggerRefresh} />} />
              <Route path="/sip" element={<SIP />} />
              <Route path="/goals" element={<SavingsGoals />} />
              <Route path="/analytics" element={<Analytics selectedMonth={selectedMonth} />} />
              <Route path="/export" element={<Export />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </MainLayout>
        </BrowserRouter>
      </ToastProvider>
    </CurrencyProvider>
  );
}
