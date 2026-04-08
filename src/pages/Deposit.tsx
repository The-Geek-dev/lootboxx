import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useWallet } from "@/hooks/useWallet";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Wallet, CreditCard, CheckCircle, AlertTriangle } from "lucide-react";

const DEPOSIT_OPTIONS = [
  { amount: 1000, label: "₦1,000", bonus: 0 },
  { amount: 2000, label: "₦2,000", bonus: 200 },
  { amount: 5000, label: "₦5,000", bonus: 750 },
  { amount: 7000, label: "₦7,000", bonus: 1500, popular: true },
  { amount: 10000, label: "₦10,000", bonus: 2500 },
  { amount: 20000, label: "₦20,000", bonus: 6000 },
];

const Deposit = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isGated = (location.state as any)?.gated === true;
  const { balance, updateBalance, fetchBalance } = useWallet();
  const { toast } = useToast();
  const [isAuth, setIsAuth] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) navigate("/login");
      else setIsAuth(true);
    });
  }, [navigate]);

  const handleDeposit = async () => {
    if (!selectedAmount) return;
    setIsProcessing(true);

    const option = DEPOSIT_OPTIONS.find((o) => o.amount === selectedAmount)!;
    const totalCredit = option.amount + option.bonus;

    // Simulate payment processing
    await new Promise((r) => setTimeout(r, 2000));

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    // Record deposit
    await supabase.from("deposits").insert({
      user_id: session.user.id,
      amount: option.amount,
      status: "completed",
      payment_reference: `DEP-${Date.now()}`,
    });

    // Update wallet
    await updateBalance(totalCredit);

    // Update total_deposited
    await supabase
      .from("user_wallets")
      .update({ total_deposited: balance + totalCredit })
      .eq("user_id", session.user.id);

    setSuccess(true);
    setIsProcessing(false);
    toast({
      title: "Deposit successful!",
      description: `₦${totalCredit.toLocaleString()} has been added to your wallet${option.bonus > 0 ? ` (includes ₦${option.bonus.toLocaleString()} bonus)` : ""}.`,
    });
  };

  if (!isAuth) return null;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container px-4 pt-32 pb-16 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl sm:text-4xl font-bold text-center mb-2">
            <Wallet className="w-8 h-8 inline-block mr-2 text-primary" />
            Deposit <span className="text-gradient">Funds</span>
          </h1>
          <p className="text-muted-foreground text-center mb-8">Add funds to your wallet and get bonus credits!</p>

          {isGated && (
            <Card className="p-4 bg-destructive/10 border-destructive/30 mb-6">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-6 h-6 text-destructive shrink-0" />
                <div>
                  <p className="font-semibold text-destructive">Minimum Deposit Required</p>
                  <p className="text-sm text-muted-foreground">You must deposit at least ₦7,000 to access games and other features.</p>
                </div>
              </div>
            </Card>
          )}

          <Card className="p-4 bg-card/50 backdrop-blur-sm mb-6">
            <p className="text-center text-sm text-muted-foreground mb-1">Current Balance</p>
            <p className="text-center text-3xl font-bold text-primary">₦{balance.toLocaleString()}</p>
          </Card>

          {success ? (
            <Card className="p-8 bg-card/50 text-center">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold mb-2">Deposit Successful!</h2>
              <p className="text-muted-foreground mb-6">Your wallet has been credited.</p>
              <div className="flex gap-4 justify-center">
                <Button className="button-gradient" onClick={() => { setSuccess(false); setSelectedAmount(null); fetchBalance(); }}>
                  Deposit More
                </Button>
                <Button variant="outline" onClick={() => navigate("/games")}>
                  Play Games
                </Button>
              </div>
            </Card>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4 mb-6">
                {DEPOSIT_OPTIONS.map((option) => (
                  <Card
                    key={option.amount}
                    className={`p-4 cursor-pointer transition-all relative ${
                      selectedAmount === option.amount
                        ? "border-primary bg-primary/10"
                        : "bg-card/50 hover:border-primary/50"
                    }`}
                    onClick={() => setSelectedAmount(option.amount)}
                  >
                    {option.popular && (
                      <span className="absolute -top-2 right-2 text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                        Popular
                      </span>
                    )}
                    <p className="text-xl font-bold">{option.label}</p>
                    {option.bonus > 0 && (
                      <p className="text-sm text-green-400">+₦{option.bonus.toLocaleString()} bonus</p>
                    )}
                  </Card>
                ))}
              </div>

              {selectedAmount && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  <Card className="p-6 bg-card/50 mb-6">
                    <div className="flex justify-between mb-2">
                      <span className="text-muted-foreground">Deposit</span>
                      <span>₦{selectedAmount.toLocaleString()}</span>
                    </div>
                    {DEPOSIT_OPTIONS.find((o) => o.amount === selectedAmount)!.bonus > 0 && (
                      <div className="flex justify-between mb-2">
                        <span className="text-green-400">Bonus</span>
                        <span className="text-green-400">
                          +₦{DEPOSIT_OPTIONS.find((o) => o.amount === selectedAmount)!.bonus.toLocaleString()}
                        </span>
                      </div>
                    )}
                    <div className="border-t border-border pt-2 flex justify-between font-bold">
                      <span>Total Credit</span>
                      <span className="text-primary">
                        ₦{(selectedAmount + DEPOSIT_OPTIONS.find((o) => o.amount === selectedAmount)!.bonus).toLocaleString()}
                      </span>
                    </div>
                  </Card>
                  <Button
                    className="button-gradient w-full py-6 text-lg"
                    onClick={handleDeposit}
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <motion.span animate={{ opacity: [1, 0.5, 1] }} transition={{ repeat: Infinity, duration: 1 }}>
                        Processing...
                      </motion.span>
                    ) : (
                      <>
                        <CreditCard className="w-5 h-5 mr-2" />
                        Pay ₦{selectedAmount.toLocaleString()}
                      </>
                    )}
                  </Button>
                </motion.div>
              )}
            </>
          )}
        </motion.div>
      </main>
      <Footer />
    </div>
  );
};

export default Deposit;
