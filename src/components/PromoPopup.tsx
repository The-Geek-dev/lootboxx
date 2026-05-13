import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PROMO, getPromoTimeLeft, isPromoActive } from "@/config/promo";
import { requestPushSubscription } from "@/components/PushAutoPrompt";

const STORAGE_KEY = "lootboxx_promo_popup_dismissed_v1";

const PromoPopup = () => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [t, setT] = useState(getPromoTimeLeft());

  useEffect(() => {
    if (!isPromoActive()) return;
    const dismissed = localStorage.getItem(STORAGE_KEY);
    // Re-show every 24h after dismissal
    if (dismissed && Date.now() - Number(dismissed) < 24 * 3600 * 1000) return;
    const timer = setTimeout(() => setOpen(true), 1200);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!open) return;
    const i = setInterval(() => setT(getPromoTimeLeft()), 1000);
    return () => clearInterval(i);
  }, [open]);

  const close = () => {
    localStorage.setItem(STORAGE_KEY, String(Date.now()));
    setOpen(false);
  };

  if (!open || !isPromoActive() || t.ended) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in" onClick={close}>
      <div
        className="relative max-w-md w-full rounded-2xl overflow-hidden border border-amber-500/40 shadow-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-amber-950/40"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={close}
          className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center text-white"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-pink-500 text-white px-5 py-3 flex items-center gap-2">
          <Sparkles className="w-5 h-5" />
          <span className="font-bold uppercase tracking-wide text-sm">{PROMO.label}</span>
        </div>

        <div className="p-6 text-center text-white">
          <h2 className="text-2xl sm:text-3xl font-bold mb-2">{PROMO.headline}</h2>
          <p className="text-white/70 mb-4 text-sm">
            For 28 days only — get full account activation at a launch-special price.
          </p>

          <div className="flex items-center justify-center gap-3 mb-5">
            <span className="text-white/50 line-through text-xl">₦{PROMO.originalAmount.toLocaleString()}</span>
            <span className="text-4xl font-extrabold text-amber-400">₦{PROMO.discountedAmount.toLocaleString()}</span>
          </div>

          <div className="text-xs uppercase text-white/60 mb-2">{PROMO.subheadline}</div>
          <div className="flex justify-center gap-2 mb-6 font-mono">
            {[
              { v: t.days, l: "Days" },
              { v: t.hours, l: "Hrs" },
              { v: t.minutes, l: "Min" },
              { v: t.seconds, l: "Sec" },
            ].map((u) => (
              <div key={u.l} className="bg-black/40 rounded-lg px-3 py-2 min-w-[58px]">
                <div className="text-2xl font-bold">{String(u.v).padStart(2, "0")}</div>
                <div className="text-[10px] text-white/60">{u.l}</div>
              </div>
            ))}
          </div>

          <Button
            className="w-full button-gradient text-base font-semibold"
            onClick={() => {
              close();
              requestPushSubscription();
              navigate("/deposit");
            }}
          >
            Claim ₦4,500 Activation
          </Button>
          <button onClick={close} className="mt-3 text-xs text-white/50 hover:text-white/80">
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
};

export default PromoPopup;
