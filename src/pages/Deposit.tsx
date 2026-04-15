import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Navigation from "@/components/Navigation";
import AppSidebar from "@/components/AppSidebar";
import Footer from "@/components/Footer";
import { Rocket, CreditCard, Smartphone, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";
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
  const [selectedTier, setSelectedTier] = useState<typeof DEPOSIT_TIERS[0] | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"flutterwave">("flutterwave");
  const [loading, setLoading] = useState(false);
  const [isActivated, setIsActivated] = useState(false);

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

  const availableTiers = DEPOSIT_TIERS.filter(
    (tier) => !(tier.type === "activation" && isActivated)
  );

  const handleDeposit = async () => {
    if (!selectedTier) return;
    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({ title: "Please log in first", variant: "destructive" });
        return;
      }

      const fnName = "flutterwave-initialize";
      const { data, error } = await supabase.functions.invoke(fnName, {
        body: {
          amount: selectedTier.amount,
          email: session.user.email,
          metadata: {
            user_id: session.user.id,
            deposit_type: selectedTier.type,
            bonus: selectedTier.bonus,
            points_reward: selectedTier.points,
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
