import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import Navigation from "@/components/Navigation";
import AppSidebar from "@/components/AppSidebar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useWallet } from "@/hooks/useWallet";
import { usePoints } from "@/hooks/usePoints";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Wallet, CreditCard, CheckCircle, AlertTriangle, Coins, ArrowRightLeft, TrendingUp, Clock } from "lucide-react";

const ACTIVATION_AMOUNT = 7000;
const ACTIVATION_POINTS = 1000; // 7k deposit = 1,000 points
const RENEWAL_AMOUNT = 2000;
const RENEWAL_POINTS = 300; // 2k renewal = 300 points

const DEPOSIT_OPTIONS = [
  { amount: 7000, label: "₦7,000", bonus: 0, pointsReward: ACTIVATION_POINTS, activation: true, description: "Activation Coupon" },
  { amount: 2000, label: "₦2,000", bonus: 0, pointsReward: RENEWAL_POINTS, renewal: true, description: "Weekly Renewal" },
  { amount: 10000, label: "₦10,000", bonus: 1500, pointsReward: 500, description: "Starter Pack" },
  { amount: 15000, label: "₦15,000", bonus: 3000, pointsReward: 800, description: "Pro Pack" },
  { amount: 20000, label: "₦20,000", bonus: 5000, pointsReward: 1200, description: "Premium Pack" },
  { amount: 50000, label: "₦50,000", bonus: 15000, pointsReward: 3500, description: "VIP Pack" },
];

const Deposit = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isGated = (location.state as any)?.gated === true;
  const isExpired = (location.state as any)?.expired === true;
  const { balance, updateBalance, fetchBalance } = useWallet();
  const { points, addPoints, convertToCash, minConvertPoints, pointsToCashRate, fetchPoints } = usePoints();
  const { toast } = useToast();
  const [isAuth, setIsAuth] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [isActivated, setIsActivated] = useState<boolean | null>(null);
  const [couponExpiresAt, setCouponExpiresAt] = useState<string | null>(null);
  const [renewalCode, setRenewalCode] = useState("");
  const [renewalInput, setRenewalInput] = useState("");
  const [showConvert, setShowConvert] = useState(false);
  const [totalDeposited, setTotalDeposited] = useState(0);
  const [totalWon, setTotalWon] = useState(0);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { navigate("/login"); return; }
      setIsAuth(true);

      const { data } = await supabase
        .from("user_wallets")
        .select("is_activated, total_deposited, total_won, points, coupon_expires_at")
        .eq("user_id", session.user.id)
        .single();
      
      setIsActivated(data?.is_activated ?? false);
      setCouponExpiresAt((data as any)?.coupon_expires_at ?? null);
      setTotalDeposited(Number(data?.total_deposited ?? 0));
      setTotalWon(Number(data?.total_won ?? 0));

      // Check for available renewal codes
      const { data: codes } = await supabase
        .from("renewal_codes")
        .select("*")
        .eq("user_id", session.user.id)
        .eq("is_used", false)
        .order("created_at", { ascending: false })
        .limit(1);

      if (codes && codes.length > 0) {
        setRenewalCode(codes[0].code);
      }
    });
  }, [navigate]);

  const handleDeposit = async () => {
    if (!selectedAmount) return;
    setIsProcessing(true);

    const option = DEPOSIT_OPTIONS.find((o) => o.amount === selectedAmount)!;
    const totalCredit = option.amount + option.bonus;

    await new Promise((r) => setTimeout(r, 2000));

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    await supabase.from("deposits").insert({
      user_id: session.user.id,
      amount: option.amount,
      status: "completed",
      payment_reference: `DEP-${Date.now()}`,
    });

    await updateBalance(totalCredit);

    const updates: any = { total_deposited: totalDeposited + option.amount };
    
    if (!isActivated && option.amount >= ACTIVATION_AMOUNT) {
      updates.is_activated = true;
      updates.coupon_expires_at = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      setIsActivated(true);
      setCouponExpiresAt(updates.coupon_expires_at);
    }
    
    // Renewal extends coupon by 7 days
    if ((option as any).renewal) {
      const currentExpiry = couponExpiresAt ? new Date(couponExpiresAt) : new Date();
      const base = currentExpiry > new Date() ? currentExpiry : new Date();
      updates.coupon_expires_at = new Date(base.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
      setCouponExpiresAt(updates.coupon_expires_at);
    }
    
    await supabase
      .from("user_wallets")
      .update(updates)
      .eq("user_id", session.user.id);

    // Award points
    if (option.pointsReward > 0) {
      await addPoints(option.pointsReward);
    }

    setSuccess(true);
    setIsProcessing(false);
    setTotalDeposited(totalDeposited + option.amount);
    toast({
      title: "Deposit successful! 🎉",
      description: `₦${totalCredit.toLocaleString()} credited${option.bonus > 0 ? ` (₦${option.bonus.toLocaleString()} bonus)` : ""}. +${option.pointsReward.toLocaleString()} points earned!`,
    });
  };

  const handleConvertPoints = async () => {
    const result = await convertToCash();
    if (result.success) {
      toast({ title: "Points converted! 💰", description: `₦${result.cashAmount.toLocaleString()} added to your wallet.` });
      fetchBalance();
      setShowConvert(false);
    } else {
      toast({ title: "Not enough points", description: `You need at least ${minConvertPoints.toLocaleString()} points.`, variant: "destructive" });
    }
  };

  const handleRedeemRenewal = async () => {
    if (!renewalInput.trim()) {
      toast({ title: "Enter a renewal code", variant: "destructive" });
      return;
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    // Verify code matches
    if (renewalInput.trim().toUpperCase() === renewalCode.toUpperCase()) {
      // Mark as used - we can't update via RLS so just inform user to deposit
      toast({ title: "Code verified! ✅", description: "Proceed with your ₦2,000 renewal deposit to earn bonus points." });
      setSelectedAmount(2000);
      setRenewalInput("");
    } else {
      toast({ title: "Invalid code", description: "This renewal code is not valid.", variant: "destructive" });
    }
  };

  if (!isAuth) return null;

  const profit = totalWon - totalDeposited;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <AppSidebar />
      <main className="md:pl-16 container px-4 pt-32 pb-16 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl sm:text-4xl font-bold text-center mb-2">
            <Wallet className="w-8 h-8 inline-block mr-2 text-primary" />
            Deposit <span className="text-gradient">Funds</span>
          </h1>
          <p className="text-muted-foreground text-center mb-6">
            {isActivated ? "Top up your wallet and earn points!" : "Make your initial ₦7,000 deposit to unlock all games!"}
          </p>

          {isGated && !isActivated && !isExpired && (
            <Card className="p-4 bg-destructive/10 border-destructive/30 mb-6">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-6 h-6 text-destructive shrink-0" />
                <div>
                  <p className="font-semibold text-destructive">Activation Deposit Required</p>
                  <p className="text-sm text-muted-foreground">Deposit ₦7,000 to activate your account and earn 1,000 points!</p>
                </div>
              </div>
            </Card>
          )}

          {isExpired && (
            <Card className="p-4 bg-yellow-500/10 border-yellow-500/30 mb-6">
              <div className="flex items-center gap-3">
                <Clock className="w-6 h-6 text-yellow-500 shrink-0" />
                <div>
                  <p className="font-semibold text-yellow-500">Coupon Expired!</p>
                  <p className="text-sm text-muted-foreground">Your weekly coupon has expired. Pay ₦2,000 renewal to continue playing games.</p>
                </div>
              </div>
            </Card>
          )}

          {/* Coupon Status */}
          {isActivated && couponExpiresAt && (
            <Card className="p-4 bg-primary/5 border-primary/20 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-primary" />
                  <div>
                    <p className="font-semibold text-sm">Coupon Status</p>
                    {(() => {
                      const exp = new Date(couponExpiresAt);
                      const now = new Date();
                      if (exp <= now) return <p className="text-xs text-destructive font-bold">Expired</p>;
                      const diffMs = exp.getTime() - now.getTime();
                      const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
                      const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                      return <p className="text-xs text-muted-foreground">Expires in <span className="text-primary font-bold">{days}d {hours}h</span></p>;
                    })()}
                  </div>
                </div>
                <Button size="sm" variant="outline" onClick={() => setSelectedAmount(2000)}>Renew</Button>
              </div>
            </Card>
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <Card className="p-3 bg-card/50 text-center">
              <p className="text-xs text-muted-foreground mb-1">Balance</p>
              <p className="text-lg font-bold text-primary">₦{balance.toLocaleString()}</p>
            </Card>
            <Card className="p-3 bg-card/50 text-center">
              <Coins className="w-4 h-4 mx-auto mb-1 text-yellow-500" />
              <p className="text-xs text-muted-foreground mb-1">Points</p>
              <p className="text-lg font-bold text-yellow-500">{points.toLocaleString()}</p>
            </Card>
            <Card className="p-3 bg-card/50 text-center">
              <p className="text-xs text-muted-foreground mb-1">Total Deposited</p>
              <p className="text-lg font-bold">₦{totalDeposited.toLocaleString()}</p>
            </Card>
            <Card className="p-3 bg-card/50 text-center">
              <TrendingUp className={`w-4 h-4 mx-auto mb-1 ${profit >= 0 ? "text-green-500" : "text-destructive"}`} />
              <p className="text-xs text-muted-foreground mb-1">Profit</p>
              <p className={`text-lg font-bold ${profit >= 0 ? "text-green-500" : "text-destructive"}`}>
                {profit >= 0 ? "+" : ""}₦{profit.toLocaleString()}
              </p>
            </Card>
          </div>

          {/* Points to Cash Conversion */}
          {points >= minConvertPoints && (
            <Card className="p-4 bg-yellow-500/10 border-yellow-500/30 mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-sm flex items-center gap-2">
                    <ArrowRightLeft className="w-4 h-4 text-yellow-500" />
                    Convert Points to Cash
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {points.toLocaleString()} pts → ₦{(Math.floor(points / minConvertPoints) * (minConvertPoints / pointsToCashRate)).toLocaleString()}
                  </p>
                </div>
                <Button size="sm" variant="outline" onClick={handleConvertPoints}>
                  Convert
                </Button>
              </div>
            </Card>
          )}

          {/* Renewal Code */}
          {isActivated && renewalCode && (
            <Card className="p-4 bg-primary/5 border-primary/20 mb-6">
              <p className="font-semibold text-sm mb-2">🔑 Your Renewal Code</p>
              <p className="text-xs text-muted-foreground mb-3">Enter this code when making your weekly ₦2,000 renewal deposit for bonus points.</p>
              <p className="font-mono text-primary font-bold text-center text-lg mb-3 bg-background rounded p-2">{renewalCode}</p>
              <div className="flex gap-2">
                <Input
                  placeholder="Enter renewal code"
                  value={renewalInput}
                  onChange={(e) => setRenewalInput(e.target.value)}
                  className="text-sm"
                />
                <Button size="sm" onClick={handleRedeemRenewal}>Redeem</Button>
              </div>
            </Card>
          )}

          {success ? (
            <Card className="p-8 bg-card/50 text-center">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold mb-2">Deposit Successful!</h2>
              <p className="text-muted-foreground mb-6">Your wallet & points have been credited.</p>
              <div className="flex gap-4 justify-center">
                <Button className="button-gradient" onClick={() => { setSuccess(false); setSelectedAmount(null); fetchBalance(); fetchPoints(); }}>
                  Deposit More
                </Button>
                <Button variant="outline" onClick={() => navigate("/games")}>
                  Play Games
                </Button>
              </div>
            </Card>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3 mb-6">
                {DEPOSIT_OPTIONS.map((option) => (
                  <Card
                    key={option.amount + (option.description || "")}
                    className={`p-4 cursor-pointer transition-all relative ${
                      selectedAmount === option.amount
                        ? "border-primary bg-primary/10"
                        : "bg-card/50 hover:border-primary/50"
                    }`}
                    onClick={() => setSelectedAmount(option.amount)}
                  >
                    {"activation" in option && option.activation && (
                      <span className="absolute -top-2 right-2 text-[10px] bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                        {isActivated ? "Base" : "Required"}
                      </span>
                    )}
                    {"renewal" in option && option.renewal && (
                      <span className="absolute -top-2 right-2 text-[10px] bg-yellow-500 text-background px-2 py-0.5 rounded-full">
                        Renewal
                      </span>
                    )}
                    <p className="text-lg font-bold">{option.label}</p>
                    <p className="text-xs text-muted-foreground">{option.description}</p>
                    {option.bonus > 0 && (
                      <p className="text-xs text-green-400">+₦{option.bonus.toLocaleString()} bonus</p>
                    )}
                    <p className="text-xs text-yellow-500">+{option.pointsReward.toLocaleString()} pts</p>
                  </Card>
                ))}
              </div>

              {selectedAmount && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  <Card className="p-6 bg-card/50 mb-6">
                    {(() => {
                      const opt = DEPOSIT_OPTIONS.find((o) => o.amount === selectedAmount)!;
                      return (
                        <>
                          <div className="flex justify-between mb-2">
                            <span className="text-muted-foreground">Deposit</span>
                            <span>₦{selectedAmount.toLocaleString()}</span>
                          </div>
                          {opt.bonus > 0 && (
                            <div className="flex justify-between mb-2">
                              <span className="text-green-400">Cash Bonus</span>
                              <span className="text-green-400">+₦{opt.bonus.toLocaleString()}</span>
                            </div>
                          )}
                          <div className="flex justify-between mb-2">
                            <span className="text-yellow-500">Points Earned</span>
                            <span className="text-yellow-500">+{opt.pointsReward.toLocaleString()} pts</span>
                          </div>
                          <div className="border-t border-border pt-2 flex justify-between font-bold">
                            <span>Total Credit</span>
                            <span className="text-primary">₦{(selectedAmount + opt.bonus).toLocaleString()}</span>
                          </div>
                        </>
                      );
                    })()}
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
