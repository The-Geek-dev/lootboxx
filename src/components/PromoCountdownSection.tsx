import { useEffect, useState } from "react";
import { Sparkles, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { PROMO, getPromoTimeLeft, isPromoActive } from "@/config/promo";
import { Button } from "@/components/ui/button";

const PromoCountdownSection = () => {
  const [t, setT] = useState(getPromoTimeLeft());

  useEffect(() => {
    if (!isPromoActive()) return;
    const i = setInterval(() => setT(getPromoTimeLeft()), 1000);
    return () => clearInterval(i);
  }, []);

  if (!isPromoActive() || t.ended) return null;

  return (
    <section className="relative bg-black py-16">
      <div className="container px-4">
        <div className="max-w-3xl mx-auto rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-950/30 via-slate-900 to-pink-950/30 p-8 text-center text-white shadow-[0_0_40px_rgba(251,146,60,0.15)]">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 text-amber-300 text-xs font-semibold uppercase tracking-wider mb-4">
            <Sparkles className="w-4 h-4" />
            {PROMO.label} — 28 days only
          </div>
          <h2 className="text-3xl md:text-5xl font-bold mb-3">{PROMO.headline}</h2>
          <p className="text-white/60 mb-6">
            <span className="line-through mr-2">₦{PROMO.originalAmount.toLocaleString()}</span>
            <span className="text-amber-400 font-bold text-xl">₦{PROMO.discountedAmount.toLocaleString()}</span>
            <span className="ml-2 text-sm">one-time activation</span>
          </p>

          <div className="flex justify-center gap-2 sm:gap-4 mb-7 font-mono">
            {[
              { v: t.days, l: "Days" },
              { v: t.hours, l: "Hours" },
              { v: t.minutes, l: "Min" },
              { v: t.seconds, l: "Sec" },
            ].map((u) => (
              <div
                key={u.l}
                className="bg-black/50 border border-amber-500/30 rounded-xl px-3 sm:px-5 py-3 min-w-[70px]"
              >
                <div className="text-3xl sm:text-4xl font-bold text-amber-300">
                  {String(u.v).padStart(2, "0")}
                </div>
                <div className="text-[10px] sm:text-xs text-white/60 uppercase mt-1">{u.l}</div>
              </div>
            ))}
          </div>

          <Link to="/deposit">
            <Button size="lg" className="button-gradient">
              Activate for ₦{PROMO.discountedAmount.toLocaleString()}
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default PromoCountdownSection;
