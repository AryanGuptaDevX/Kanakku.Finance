import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { TransactionModal } from '../common/TransactionModal';

export const MainLayout = ({
  children,
  selectedMonth,
  onMonthChange,
  onTransactionAdded
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState('expense');

  const handleOpenModal = (type = 'expense') => {
    setModalType(type);
    setModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar Navigation */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        <Header
          onMenuClick={() => setSidebarOpen(true)}
          selectedMonth={selectedMonth}
          onMonthChange={onMonthChange}
          onOpenTransactionModal={handleOpenModal}
        />

        <main className="flex-1 p-3 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Global Transaction Modal */}
      <TransactionModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={() => {
          if (onTransactionAdded) onTransactionAdded();
        }}
        initialType={modalType}
      />
    </div>
  );
};
