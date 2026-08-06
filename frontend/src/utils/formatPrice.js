export const formatPrice = (amount) => {
  const num = Number(amount);
  if (isNaN(num) || amount === null || amount === undefined) return '₹0';
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(num);
};

export const formatDiscount = (original, discountPct) => {
  const orig = Number(original) || 0;
  const pct = Number(discountPct) || 0;
  const saved = Math.round(orig * (pct / 100));
  return { saved, discountLabel: `${pct}% OFF` };
};
