import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Navigation from "@/components/Navigation";
import AppSidebar from "@/components/AppSidebar";
import Footer from "@/components/Footer";
import {
  Rocket,
  CheckCircle2,
  Loader2,
  XCircle,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Link, useNavigate } from "react-router-dom";
import { useLaunchStatus } from "@/hooks/useLaunchStatus";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const DEPOSIT_TIERS = [
  { label: "Activation", amount: 7000, bonus: 1000, points: 1000, type: "activation", description: "One-time account activation" },
  { label: "Weekly Renewal", amount: 2000, bonus: 200, points: 150, type: "renewal", description: "Renew your weekly access" },
  { label: "Top-up ₦5,000", amount: 5000, bonus: 500, points: 300, type: "topup", description: "Add funds to your wallet" },
  { label: "Top-up ₦10,000", amount: 10000, bonus: 1500, points: 700, type: "topup", description: "Best value top-up" },
];

type Tier = (typeof DEPOSIT_TIERS)[number];
type Step = "select" | "confirm" | "verifying" | "success" | "rejected";

const ComingSoonView = () => (
  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-md mx-auto">
    <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-6">
      <Rocket className="w-10 h-10 text-primary animate-bounce" />
    </div>
    <h1 className="text-3xl font-bold mb-3">Coming Soon!</h1>
    <p className="text-muted-foreground mb-6">
      Deposits are not yet available. LootBoxx is launching very soon — sign up now so you're ready when we go live!
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

  const [step, setStep] = useState<Step>("select");
  const [selectedTier, setSelectedTier] = useState<Tier | null>(null);
  const [isActivated, setIsActivated] = useState(false);
  const [resultMsg, setResultMsg] = useState<string>("");
  const [paying, setPaying] = useState(false);

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

  const availableTiers = isActivated
    ? DEPOSIT_TIERS.filter((t) => t.type !== "activation")
    : DEPOSIT_TIERS.filter((t) => t.type === "activation");

  const handlePickTier = (tier: Tier) => {
    setSelectedTier(tier);
    setStep("confirm");
  };

  // On mount, if URL has ?reference= from Squad redirect, auto-verify
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get("reference") || params.get("transaction_ref");
    if (!ref) return;
    (async () => {
      setStep("verifying");
      try {
        const { data, error } = await supabase.functions.invoke("squad-verify", {
          body: { transaction_ref: ref },
        });
        if (error) throw error;
        if (data?.success) {
          setResultMsg("Your wallet has been credited.");
          setStep("success");
          setIsActivated(true);
        } else {
          setResultMsg(data?.message || "Payment was not completed.");
          setStep("rejected");
        }
      } catch (e: any) {
        setResultMsg(e.message || "Verification failed");
        setStep("rejected");
      } finally {
        window.history.replaceState({}, "", "/deposit");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startSquadPayment = async () => {
    if (!selectedTier) return;
    setPaying(true);
    try {
      const { data, error } = await supabase.functions.invoke("squad-initialize", {
        body: {
          amount: selectedTier.amount,
          deposit_type: selectedTier.type,
          bonus: selectedTier.bonus,
          points_reward: selectedTier.points,
          callback_url: `${window.location.origin}/deposit`,
        },
      });
      if (error) throw error;
      if (!data?.checkout_url) throw new Error("No checkout URL returned");
      window.location.href = data.checkout_url;
    } catch (e: any) {
      console.error(e);
      toast({ title: "Could not start payment", description: e.message, variant: "destructive" });
      setPaying(false);
    }
  };

  const resetFlow = () => {
    setSelectedTier(null);
    setResultMsg("");
    setStep("select");
  };

  if (step === "verifying") {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center max-w-md mx-auto">
        <Loader2 className="w-12 h-12 mx-auto mb-4 text-primary animate-spin" />
        <h1 className="text-2xl font-bold mb-2">Verifying your payment…</h1>
        <p className="text-muted-foreground">Hang tight — this usually takes a few seconds.</p>
      </motion.div>
    );
  }

  if (step === "success") {
    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-md mx-auto">
        <CheckCircle2 className="w-16 h-16 mx-auto mb-4 text-primary" />
        <h1 className="text-3xl font-bold mb-2">Payment Verified! 🎉</h1>
        <p className="text-muted-foreground mb-6">{resultMsg || "Your wallet has been credited."}</p>
        <div className="flex gap-3 justify-center">
          <Button className="button-gradient" onClick={() => navigate("/games")}>Go to Games</Button>
          <Button variant="outline" onClick={resetFlow}>Make Another Deposit</Button>
        </div>
      </motion.div>
    );
  }

  if (step === "rejected") {
    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-md mx-auto">
        <XCircle className="w-16 h-16 mx-auto mb-4 text-destructive" />
        <h1 className="text-2xl font-bold mb-2">Payment Failed</h1>
        <p className="text-muted-foreground mb-6">{resultMsg || "We couldn't verify your payment."}</p>
        <div className="flex gap-3 justify-center">
          <Button className="button-gradient" onClick={resetFlow}>Try Again</Button>
        </div>
      </motion.div>
    );
  }

  if (step === "confirm" && selectedTier) {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-xl mx-auto w-full">
        <Button variant="ghost" size="sm" onClick={resetFlow} className="mb-3">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back
        </Button>
        <h1 className="text-2xl font-bold mb-1">Pay ₦{selectedTier.amount.toLocaleString()}</h1>
        <p className="text-muted-foreground text-sm mb-5">Pay securely with Card, Bank Transfer, or USSD.</p>

        <Card className="p-4 mb-5">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Plan</span>
              <span className="font-semibold">{selectedTier.label}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Amount</span>
              <span className="font-semibold">₦{selectedTier.amount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Bonus</span>
              <span className="font-semibold text-green-400">+₦{selectedTier.bonus.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Points</span>
              <span className="font-semibold text-green-400">+{selectedTier.points} pts</span>
            </div>
          </div>
        </Card>

        <Button
          className="button-gradient w-full py-3 text-lg"
          onClick={startSquadPayment}
          disabled={paying}
        >
          {paying ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Redirecting…
            </>
          ) : (
            "Proceed to Payment"
          )}
        </Button>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto w-full">
      <h1 className="text-3xl font-bold text-center mb-2">💰 Deposit Funds</h1>
      <p className="text-muted-foreground text-center mb-6">
        Choose a plan and pay instantly with Card, Bank Transfer, or USSD.
      </p>

      <div className="grid gap-3">
        {availableTiers.map((tier) => (
          <Card
            key={tier.label}
            onClick={() => handlePickTier(tier)}
            className="p-4 cursor-pointer transition-all hover:border-primary/50 hover:bg-primary/5"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <h3 className="font-bold text-foreground">{tier.label}</h3>
                <p className="text-sm text-muted-foreground">{tier.description}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-xl font-bold text-foreground">₦{tier.amount.toLocaleString()}</p>
                <p className="text-xs text-green-400">+₦{tier.bonus.toLocaleString()} bonus • +{tier.points} pts</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
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
