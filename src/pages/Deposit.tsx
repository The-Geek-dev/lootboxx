import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import Navigation from "@/components/Navigation";
import AppSidebar from "@/components/AppSidebar";
import Footer from "@/components/Footer";
import { Rocket, CreditCard, Smartphone, Building2, CheckCircle2, Loader2, RefreshCw, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useLaunchStatus } from "@/hooks/useLaunchStatus";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const DEPOSIT_TIERS = [
  { label: "Activation", amount: 7000, bonus: 1000, points: 500, type: "activation", description: "One-time account activation" },
  { label: "Weekly Renewal", amount: 2000, bonus: 200, points: 150, type: "renewal", description: "Renew your weekly access" },
  { label: "Top-up ₦5,000", amount: 5000, bonus: 500, points: 300, type: "topup", description: "Add funds to your wallet" },
  { label: "Top-up ₦10,000", amount: 10000, bonus: 1500, points: 700, type: "topup", description: "Best value top-up" },
];

const ComingSoonView = () => (
  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-md mx-auto">
    <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-6">
      <Rocket className="w-10 h-10 text-primary animate-bounce" />
    </div>
    <h1 className="text-3xl font-bold mb-3">Coming Soon!</h1>
    <p className="text-muted-foreground mb-6">
      Deposits and payments are not yet available. LootBoxx is launching very soon — sign up now so you're ready when we go live!
    </p>
    <div className="flex gap-3 justify-center">
      <Link to="/signup"><Button className="button-gradient">Sign Up Now</Button></Link>
      <Link to="/"><Button variant="outline">Back to Home</Button></Link>
    </div>
  </motion.div>
);

const LiveDepositView = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedTier, setSelectedTier] = useState<typeof DEPOSIT_TIERS[0] | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"flutterwave">("flutterwave");
  const [loading, setLoading] = useState(false);
  const [isActivated, setIsActivated] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState<null | { success: boolean; message: string; depositType?: string }>(null);
  const [failedTier, setFailedTier] = useState<typeof DEPOSIT_TIERS[0] | null>(null);
  const [polling, setPolling] = useState(false);
  const [pollSecondsLeft, setPollSecondsLeft] = useState(0);
  const pollTimerRef = useRef<number | null>(null);

  // Persist last attempted tier so we can retry after a failed/cancelled redirect
  useEffect(() => {
    if (selectedTier) {
      try { sessionStorage.setItem("lb_last_tier", JSON.stringify(selectedTier)); } catch {}
    }
  }, [selectedTier]);

  useEffect(() => {
    const checkActivation = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const { data: wallet } = await supabase
        .from("user_wallets")
        .select("is_activated")
        .eq("user_id", session.user.id)
        .single();
      if (wallet?.is_activated) setIsActivated(true);
    };
    checkActivation();
  }, []);

  // Polling fallback: re-check wallet activation/coupon for up to 60s after verification
  const startActivationPolling = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    setPolling(true);
    setPollSecondsLeft(60);
    let attempts = 0;
    const maxAttempts = 30; // 30 * 2s = 60s

    if (pollTimerRef.current) window.clearInterval(pollTimerRef.current);
    pollTimerRef.current = window.setInterval(() => {
      setPollSecondsLeft((s) => Math.max(0, s - 2));
    }, 2000);

    const poll = async (): Promise<void> => {
      attempts++;
      const { data: wallet } = await supabase
        .from("user_wallets")
        .select("is_activated, coupon_expires_at")
        .eq("user_id", session.user.id)
        .single();

      const hasActiveCoupon =
        wallet?.is_activated &&
        wallet?.coupon_expires_at &&
        new Date(wallet.coupon_expires_at) > new Date();

      if (hasActiveCoupon) {
        setIsActivated(true);
        setPolling(false);
        if (pollTimerRef.current) window.clearInterval(pollTimerRef.current);
        return;
      }

      if (attempts >= maxAttempts) {
        setPolling(false);
        if (pollTimerRef.current) window.clearInterval(pollTimerRef.current);
        return;
      }

      await new Promise((r) => setTimeout(r, 2000));
      return poll();
    };

    poll();
  };

  useEffect(() => {
    return () => {
      if (pollTimerRef.current) window.clearInterval(pollTimerRef.current);
    };
  }, []);

  // Handle Flutterwave redirect callback (?status=...&tx_ref=...&transaction_id=...)
  useEffect(() => {
    const status = searchParams.get("status");
    const transactionId = searchParams.get("transaction_id");
    const txRef = searchParams.get("tx_ref");

    // Try to recover the tier the user was paying for
    let recoveredTier: typeof DEPOSIT_TIERS[0] | null = null;
    try {
      const raw = sessionStorage.getItem("lb_last_tier");
      if (raw) recoveredTier = JSON.parse(raw);
    } catch {}

    if (status === "cancelled" || status === "failed" || (status && !transactionId)) {
      setFailedTier(recoveredTier);
      toast({ title: "Payment not completed", description: "Your payment was cancelled or failed. You can retry below.", variant: "destructive" });
      setSearchParams({}, { replace: true });
      return;
    }

    if (!status || !transactionId) return;

    const verify = async () => {
      setVerifying(true);
      try {
        const { data, error } = await supabase.functions.invoke("flutterwave-verify", {
          body: { transaction_id: transactionId, tx_ref: txRef },
        });
        if (error) throw error;

        if (data?.success) {
          setVerifyResult({
            success: true,
            message: `₦${Number(data.totalCredit).toLocaleString()} credited to your wallet.`,
            depositType: data.depositType,
          });
          setIsActivated(true);
          toast({ title: "Payment confirmed! 🎉", description: "Your wallet has been credited." });
          try { sessionStorage.removeItem("lb_last_tier"); } catch {}
          // Start polling fallback to ensure activation flag is visible
          startActivationPolling();
        } else {
          setVerifyResult({ success: false, message: data?.error || "Verification failed" });
          setFailedTier(recoveredTier);
          toast({ title: "Verification failed", description: data?.error || "Please contact support.", variant: "destructive" });
        }
      } catch (err: any) {
        const msg = err?.message || "";
        if (msg.includes("already processed")) {
          setVerifyResult({ success: true, message: "Payment already confirmed. You're good to go!" });
          setIsActivated(true);
          try { sessionStorage.removeItem("lb_last_tier"); } catch {}
          startActivationPolling();
        } else {
          setVerifyResult({ success: false, message: msg || "Verification error" });
          setFailedTier(recoveredTier);
          toast({ title: "Error verifying payment", description: msg, variant: "destructive" });
        }
      } finally {
        setVerifying(false);
        setSearchParams({}, { replace: true });
      }
    };

    verify();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const availableTiers = DEPOSIT_TIERS.filter(
    (tier) => !(tier.type === "activation" && isActivated)
  );

  const handleDeposit = async (tierOverride?: typeof DEPOSIT_TIERS[0]) => {
    const tier = tierOverride || selectedTier;
    if (!tier) return;
    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({ title: "Please log in first", variant: "destructive" });
        return;
      }

      try { sessionStorage.setItem("lb_last_tier", JSON.stringify(tier)); } catch {}

      const fnName = "flutterwave-initialize";
      const { data, error } = await supabase.functions.invoke(fnName, {
        body: {
          amount: tier.amount,
          email: session.user.email,
          metadata: {
            user_id: session.user.id,
            deposit_type: tier.type,
            bonus: tier.bonus,
            points_reward: tier.points,
            callback_url: window.location.origin + "/deposit?status=success",
          },
        },
      });

      if (error) throw error;
      if (data?.authorization_url) {
        window.location.href = data.authorization_url;
      } else {
        toast({ title: "Payment initialization failed", variant: "destructive" });
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (verifying) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center max-w-md mx-auto">
        <Loader2 className="w-12 h-12 mx-auto mb-4 text-primary animate-spin" />
        <h1 className="text-2xl font-bold mb-2">Confirming your payment…</h1>
        <p className="text-muted-foreground">Please wait while we verify the transaction with Flutterwave.</p>
      </motion.div>
    );
  }

  // Failed/cancelled view with retry button
  if (failedTier && !verifyResult?.success) {
    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-md mx-auto">
        <XCircle className="w-16 h-16 mx-auto mb-4 text-destructive" />
        <h1 className="text-3xl font-bold mb-2">Payment Not Completed</h1>
        <p className="text-muted-foreground mb-2">
          Your <span className="font-semibold text-foreground">{failedTier.label}</span> payment of{" "}
          <span className="font-semibold text-foreground">₦{failedTier.amount.toLocaleString()}</span> was not completed.
        </p>
        <p className="text-sm text-muted-foreground mb-6">No money was charged. You can retry instantly below.</p>
        <div className="flex gap-3 justify-center flex-wrap">
          <Button className="button-gradient" onClick={() => handleDeposit(failedTier)} disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
            Retry Payment
          </Button>
          <Button variant="outline" onClick={() => { setFailedTier(null); setVerifyResult(null); }}>
            Choose Different Plan
          </Button>
        </div>
      </motion.div>
    );
  }

  if (verifyResult?.success) {
    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-md mx-auto">
        <CheckCircle2 className="w-16 h-16 mx-auto mb-4 text-primary" />
        <h1 className="text-3xl font-bold mb-2">Payment Successful! 🎉</h1>
        <p className="text-muted-foreground mb-4">{verifyResult.message}</p>
        {polling && (
          <div className="flex items-center justify-center gap-2 mb-6 p-3 rounded-lg bg-muted/30 border border-border">
            <Loader2 className="w-4 h-4 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">
              Syncing access… {pollSecondsLeft}s
            </p>
          </div>
        )}
        <div className="flex gap-3 justify-center">
          <Button className="button-gradient" onClick={() => navigate("/games")}>Go to Games</Button>
          <Button variant="outline" onClick={() => { setVerifyResult(null); }}>Make Another Deposit</Button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-center mb-2">💰 Deposit Funds</h1>
      <p className="text-muted-foreground text-center mb-6">Choose a deposit option and payment method</p>

      <div className="grid gap-3 mb-6">
        {availableTiers.map((tier) => (
          <Card
            key={tier.label}
            onClick={() => setSelectedTier(tier)}
            className={`p-4 cursor-pointer transition-all ${selectedTier?.label === tier.label ? "ring-2 ring-primary bg-primary/10" : "hover:border-primary/50"}`}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-foreground">{tier.label}</h3>
                <p className="text-sm text-muted-foreground">{tier.description}</p>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-foreground">₦{tier.amount.toLocaleString()}</p>
                <p className="text-xs text-green-400">+₦{tier.bonus.toLocaleString()} bonus • +{tier.points} pts</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {selectedTier && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h3 className="font-semibold mb-3 text-foreground">Payment Method</h3>
          <div className="mb-6">
            <Card
              className="p-4 text-center ring-2 ring-primary bg-primary/10"
            >
              <Smartphone className="w-6 h-6 mx-auto mb-1 text-primary" />
              <p className="font-medium text-sm text-foreground">Flutterwave</p>
              <p className="text-xs text-muted-foreground">Cards, Mobile Money</p>
            </Card>
          </div>

          <Button className="button-gradient w-full py-3 text-lg" onClick={handleDeposit} disabled={loading}>
            {loading ? "Processing..." : `Pay ₦${selectedTier.amount.toLocaleString()} with Flutterwave`}
          </Button>
        </motion.div>
      )}
    </motion.div>
  );
};

const Deposit = () => {
  const { isLaunched } = useLaunchStatus();

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <AppSidebar />
      <div className="md:pl-16 min-h-screen flex flex-col">
        <main className="container px-4 pt-32 pb-24 flex-1 flex items-center justify-center">
          {isLaunched ? <LiveDepositView /> : <ComingSoonView />}
        </main>
        <Footer />
      </div>
    </div>
  );
};

export default Deposit;
