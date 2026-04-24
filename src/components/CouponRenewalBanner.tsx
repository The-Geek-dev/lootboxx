import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, Clock, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

type Wallet = {
  is_activated: boolean;
  coupon_expires_at: string | null;
};

const DISMISS_KEY = "lb_renewal_banner_dismissed_until";

const formatRemaining = (ms: number) => {
  const totalMinutes = Math.max(0, Math.floor(ms / 60000));
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
};

const formatExpiryDate = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

const CouponRenewalBanner = () => {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [now, setNow] = useState<number>(Date.now());
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    try {
      const until = localStorage.getItem(DISMISS_KEY);
      if (until && Number(until) > Date.now()) setDismissed(true);
    } catch {}
  }, []);

  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;

    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      setUserId(session.user.id);

      const { data } = await supabase
        .from("user_wallets")
        .select("is_activated, coupon_expires_at")
        .eq("user_id", session.user.id)
        .single();

      if (data) setWallet(data as Wallet);

      channel = supabase
        .channel(`wallet-banner-${session.user.id}`)
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "user_wallets",
            filter: `user_id=eq.${session.user.id}`,
          },
          (payload) => {
            const next = payload.new as Wallet;
            setWallet({
              is_activated: next.is_activated,
              coupon_expires_at: next.coupon_expires_at,
            });
          }
        )
        .subscribe();
    };

    load();
    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(id);
  }, []);

  if (!userId || !wallet || !wallet.is_activated || dismissed) return null;

  const expiresAt = wallet.coupon_expires_at ? new Date(wallet.coupon_expires_at).getTime() : null;
  const msLeft = expiresAt ? expiresAt - now : null;

  const WARN_THRESHOLD_MS = 48 * 60 * 60 * 1000;
  const isMissing = expiresAt === null;
  const isExpired = msLeft !== null && msLeft <= 0;
  const isExpiringSoon = msLeft !== null && msLeft > 0 && msLeft <= WARN_THRESHOLD_MS;

  if (!isMissing && !isExpired && !isExpiringSoon) return null;

  const dismiss = () => {
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now() + 6 * 60 * 60 * 1000));
    } catch {}
    setDismissed(true);
  };

  let title = "";
  let body = "";
  let urgent = false;

  if (isMissing) {
    title = "Renewal info syncing";
    body = "We couldn't find your coupon expiry. Please renew now to make sure you don't lose access to games.";
    urgent = true;
  } else if (isExpired) {
    title = "Your coupon has expired";
    body = `It expired on ${formatExpiryDate(wallet.coupon_expires_at!)}. Renew now to keep playing.`;
    urgent = true;
  } else if (isExpiringSoon && msLeft !== null) {
    title = `Renew in ${formatRemaining(msLeft)}`;
    body = `Your weekly access ends on ${formatExpiryDate(wallet.coupon_expires_at!)}. Renew before then to keep playing without interruption.`;
    urgent = msLeft <= 6 * 60 * 60 * 1000;
  }

  return (
    <div
      className={`fixed top-16 left-1/2 -translate-x-1/2 z-40 w-[calc(100%-1.5rem)] max-w-2xl rounded-xl border shadow-lg px-4 py-3 backdrop-blur-md ${
        urgent
          ? "bg-destructive/15 border-destructive/40 text-destructive-foreground"
          : "bg-primary/10 border-primary/40 text-foreground"
      }`}
      role="alert"
    >
      <div className="flex items-start gap-3">
        <div className={`shrink-0 mt-0.5 ${urgent ? "text-destructive" : "text-primary"}`}>
          {urgent ? <AlertTriangle className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm sm:text-base text-foreground">{title}</p>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">{body}</p>
          <div className="mt-2 flex gap-2">
            <Link to="/deposit">
              <Button size="sm" className="button-gradient h-8 text-xs">
                Renew Now
              </Button>
            </Link>
          </div>
        </div>
        <button
          onClick={dismiss}
          aria-label="Dismiss"
          className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default CouponRenewalBanner;
