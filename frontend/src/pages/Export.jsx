import React from 'react';
import { Download, FileSpreadsheet, Receipt, ArrowDownLeft, ArrowUpRight, Landmark, TrendingUp, Target } from 'lucide-react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';

export const Export = () => {
  const handleDownload = (endpoint, filename) => {
    const link = document.createElement('a');
    link.href = `/api/export/${endpoint}`;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const exportOptions = [
    {
      title: 'All Transactions',
      description: 'Export complete historical record of income and expenses as CSV.',
      icon: Receipt,
      endpoint: 'transactions',
      filename: 'all_transactions.csv',
      color: 'sky'
    },
    {
      title: 'Income Only',
      description: 'Export salary, freelance, and business income records.',
      icon: ArrowDownLeft,
      endpoint: 'income',
      filename: 'income_transactions.csv',
      color: 'emerald'
    },
    {
      title: 'Expenses Only',
      description: 'Export detailed expense log with categories and payment methods.',
      icon: ArrowUpRight,
      endpoint: 'expenses',
      filename: 'expense_transactions.csv',
      color: 'rose'
    },
    {
      title: 'EMI Loans Data',
      description: 'Export active loan principals, monthly payments, and repayment progress.',
      icon: Landmark,
      endpoint: 'emis',
      filename: 'emi_loans.csv',
      color: 'amber'
    },
    {
      title: 'SIP Investments Portfolio',
      description: 'Export fund names, monthly investments, and valuation data.',
      icon: TrendingUp,
      endpoint: 'sips',
      filename: 'sip_investments.csv',
      color: 'indigo'
    },
    {
      title: 'Savings Goals',
      description: 'Export active savings targets, saved amounts, and completion status.',
      icon: Target,
      endpoint: 'goals',
      filename: 'savings_goals.csv',
      color: 'purple'
    },
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900">CSV Data Export</h2>
        <p className="text-xs text-slate-500 mt-1">Export financial data in standard CSV format for offline analysis in Excel, Google Sheets, or tax software</p>
      </div>

      {/* Export Options Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {exportOptions.map((opt) => {
          const Icon = opt.icon;
          return (
            <Card key={opt.endpoint} className="flex flex-col justify-between p-6">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-3 rounded-xl bg-blue-50 border border-blue-100 text-blue-600">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-800">{opt.title}</h3>
                </div>
                <p className="text-xs text-slate-500 mb-6 leading-relaxed">{opt.description}</p>
              </div>

              <Button
                variant="primary"
                onClick={() => handleDownload(opt.endpoint, opt.filename)}
                icon={Download}
                className="w-full"
              >
                Download CSV
              </Button>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
