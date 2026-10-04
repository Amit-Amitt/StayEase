const configuredCurrency = import.meta.env.VITE_CURRENCY?.toUpperCase();
const currency = ['USD', 'INR'].includes(configuredCurrency) ? configuredCurrency : 'USD';
export const currencyCode = currency;

export const formatCurrency = (value) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(value);
