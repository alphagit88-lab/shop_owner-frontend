export const formatCurrency = (amount: number | string, currency: string = 'LKR') => {
  const value = Number(amount) || 0;
  
  if (currency === 'LKR') {
    return `Rs. ${new Intl.NumberFormat('en-LK', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value)}`;
  }
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(value);
};

export const formatUsd = (amount: number | string) => formatCurrency(amount, 'USD');
export const formatLkr = (amount: number | string) => formatCurrency(amount, 'LKR');
