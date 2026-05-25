export const formatPrice = (amount) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

export const formatDiscount = (original, discountPct) => {
  const saved = Math.round(original * (discountPct / 100));
  return { saved, discountLabel: `${discountPct}% OFF` };
};
