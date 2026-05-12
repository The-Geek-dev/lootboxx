// Activation discount promo: ₦4,500 instead of ₦7,000 for 28 days.
export const PROMO = {
  enabled: true,
  originalAmount: 7000,
  discountedAmount: 4500,
  // Promo end date — 28 days from May 12, 2026
  endDate: new Date("2026-06-09T23:59:59+01:00"),
  label: "Launch Promo",
  headline: "Activate for ₦4,500 — save ₦2,500",
  subheadline: "Limited-time launch offer. Ends in",
};

export const isPromoActive = () => PROMO.enabled && Date.now() < PROMO.endDate.getTime();

export const getActivationAmount = () =>
  isPromoActive() ? PROMO.discountedAmount : PROMO.originalAmount;

/** Inline text label for activation price, used inside string descriptions. */
export const getActivationPriceText = () =>
  isPromoActive()
    ? `₦${PROMO.discountedAmount.toLocaleString()} (Promo — was ₦${PROMO.originalAmount.toLocaleString()})`
    : `₦${PROMO.originalAmount.toLocaleString()}`;

export const getPromoTimeLeft = () => {
  const diff = PROMO.endDate.getTime() - Date.now();
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, ended: true };
  return {
    days: Math.floor(diff / 86_400_000),
    hours: Math.floor((diff / 3_600_000) % 24),
    minutes: Math.floor((diff / 60_000) % 60),
    seconds: Math.floor((diff / 1000) % 60),
    ended: false,
  };
};
