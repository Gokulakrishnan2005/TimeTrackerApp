export const formatIndianCurrency = (amount: number): string => {
  if (amount >= 10000000) {
    const crore = amount / 10000000;
    return `₹ ${crore.toFixed(2)} cr`;
  }
  if (amount >= 100000) {
    const lakh = amount / 100000;
    return `₹ ${lakh.toFixed(2)} lakh`;
  }
  if (amount >= 1000) {
    const thousand = amount / 1000;
    return `₹ ${thousand.toFixed(1)}k`;
  }
  return `₹ ${amount}`;
};
