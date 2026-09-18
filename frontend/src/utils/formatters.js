export const formatCurrency = (amount, currencySymbol = '₹') => {
  if (amount === undefined || amount === null || isNaN(amount)) return `${currencySymbol}0`;
  const formatted = new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0
  }).format(amount);
  return `${currencySymbol}${formatted}`;
};

export const formatPercentage = (val) => {
  if (val === undefined || val === null || isNaN(val)) return '0%';
  return `${val.toFixed(1)}%`;
};

export const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

export const getMonthName = (monthStr) => {
  if (!monthStr) return '';
  const [year, month] = monthStr.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1, 1);
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
};
