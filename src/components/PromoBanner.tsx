import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { PROMO, getPromoTimeLeft, isPromoActive } from "@/config/promo";

const PromoBanner = () => {
  const [t, setT] = useState(getPromoTimeLeft());

  useEffect(() => {
    if (!isPromoActive()) return;
    const i = setInterval(() => setT(getPromoTimeLeft()), 1000);
    return () => clearInterval(i);
  }, []);

  if (!isPromoActive() || t.ended) return null;

  return (
    <Link
      to="/deposit"
      className="block w-full bg-gradient-to-r from-amber-500 via-orange-500 to-pink-500 text-white text-center py-2 px-3 text-xs sm:text-sm font-medium hover:opacity-95 transition-opacity"
    >
      <span className="inline-flex items-center gap-2 flex-wrap justify-center">
        <Sparkles className="w-4 h-4" />
        <span className="font-bold">{PROMO.label}:</span>
        <span>Activate for ₦{PROMO.discountedAmount.toLocaleString()} (was ₦{PROMO.originalAmount.toLocaleString()})</span>
        <span className="font-mono bg-black/25 rounded px-1.5 py-0.5">
          {t.days}d {String(t.hours).padStart(2, "0")}:{String(t.minutes).padStart(2, "0")}:{String(t.seconds).padStart(2, "0")}
        </span>
      </span>
    </Link>
  );
};

export default PromoBanner;
