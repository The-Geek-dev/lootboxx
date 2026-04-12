import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import AppSidebar from "@/components/AppSidebar";
import Footer from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useWallet } from "@/hooks/useWallet";
import { useDepositGate } from "@/hooks/useDepositGate";
import { supabase } from "@/integrations/supabase/client";
import { Banknote, Clock, CheckCircle, XCircle, AlertTriangle, Info } from "lucide-react";

const MIN_WITHDRAWAL = 1000;
const WITHDRAWAL_FEE_PERCENT = 5; // 5% fee

const isWithdrawalWindow = (): { allowed: boolean; message: string } => {
  const now = new Date();
  const day = now.getDay(); // 0=Sun, 6=Sat
  const hour = now.getHours();
  
  if ((day === 6 || day === 0) && hour >= 18 && hour < 19) {
    return { allowed: true, message: "Withdrawal window is open!" };
  }
  
  // Find next window
  let nextDay = day;
  if (day < 6) nextDay = 6;
  else if (day === 6 && hour >= 19) nextDay = 0;
  else if (day === 0 && hour >= 19) nextDay = 6;
  
  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const nextDayName = day === 6 && hour < 18 ? "today" : day === 0 && hour < 18 ? "today" : `next ${dayNames[nextDay]}`;
  
  return { 
    allowed: false, 
    message: `Withdrawals are only available on Saturdays & Sundays, 6:00 PM - 7:00 PM. Next window: ${nextDayName} at 6:00 PM.` 
  };
};

const Withdraw = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAuthorized, isChecking } = useDepositGate();
  const { balance, fetchBalance } = useWallet();
  const [amount, setAmount] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const withdrawalWindow = isWithdrawalWindow();
  const fee = Math.ceil(Number(amount || 0) * WITHDRAWAL_FEE_PERCENT / 100);
  const netAmount = Number(amount || 0) - fee;

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/login"); return; }

      const { data } = await supabase
        .from("withdrawals")
        .select("*")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false });

      setWithdrawals(data || []);
      setLoading(false);
    };
    load();
  }, [navigate]);

  const handleSubmit = async () => {
    if (!withdrawalWindow.allowed) {
      toast({ title: "Withdrawal window closed", description: withdrawalWindow.message, variant: "destructive" });
      return;
    }

    const numAmount = Number(amount);
    if (!numAmount || numAmount < MIN_WITHDRAWAL) {
      toast({ title: "Minimum withdrawal is ₦1,000", variant: "destructive" });
      return;
    }
    if (numAmount > balance) {
      toast({ title: "Insufficient balance", variant: "destructive" });
      return;
    }
    if (!bankName.trim() || !accountNumber.trim() || !accountName.trim()) {
      toast({ title: "Please fill all bank details", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    // Deduct full amount from balance (fee is included)
    const { error: walletError } = await supabase
      .from("user_wallets")
      .update({ balance: balance - numAmount })
      .eq("user_id", session.user.id);

    if (walletError) {
      toast({ title: "Error processing withdrawal", variant: "destructive" });
      setSubmitting(false);
      return;
    }

    const { error } = await supabase.from("withdrawals").insert({
      user_id: session.user.id,
      amount: netAmount, // Net amount after fee
      bank_name: bankName.trim(),
      account_number: accountNumber.trim(),
      account_name: accountName.trim(),
    });

    if (error) {
      await supabase
        .from("user_wallets")
        .update({ balance })
        .eq("user_id", session.user.id);
      toast({ title: "Error submitting withdrawal", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Withdrawal submitted!", description: `₦${netAmount.toLocaleString()} will be sent after review. Fee: ₦${fee.toLocaleString()}` });
      setAmount("");
      setBankName("");
      setAccountNumber("");
      setAccountName("");
      fetchBalance();

      const { data } = await supabase
        .from("withdrawals")
        .select("*")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false });
      setWithdrawals(data || []);
    }
    setSubmitting(false);
  };

  if (!isAuthorized || isChecking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Checking access...</p>
        </div>
      </div>
    );
  }

  const statusIcon = (status: string) => {
    switch (status) {
      case "approved": return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "rejected": return <XCircle className="w-4 h-4 text-destructive" />;
      default: return <Clock className="w-4 h-4 text-yellow-500" />;
    }
  };

  const statusColor = (status: string) => {
    switch (status) {
      case "approved": return "default" as const;
      case "rejected": return "destructive" as const;
      default: return "secondary" as const;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <AppSidebar />
      <main className="pl-16 container px-4 pt-32 pb-16 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl sm:text-4xl font-bold text-center mb-2">
            <Banknote className="w-8 h-8 inline-block mr-2 text-primary" />
            Withdraw <span className="text-gradient">Funds</span>
          </h1>
          <p className="text-muted-foreground text-center mb-8">Cash out your winnings to your bank account</p>

          {/* Withdrawal Window Notice */}
          <Card className={`p-4 mb-6 ${withdrawalWindow.allowed ? "bg-green-500/10 border-green-500/30" : "bg-yellow-500/10 border-yellow-500/30"}`}>
            <div className="flex items-center gap-3">
              <Info className={`w-5 h-5 shrink-0 ${withdrawalWindow.allowed ? "text-green-500" : "text-yellow-500"}`} />
              <div>
                <p className={`font-semibold text-sm ${withdrawalWindow.allowed ? "text-green-500" : "text-yellow-500"}`}>
                  {withdrawalWindow.allowed ? "✅ Window Open" : "⏰ Window Closed"}
                </p>
                <p className="text-xs text-muted-foreground">{withdrawalWindow.message}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 bg-card/50 backdrop-blur-sm mb-6">
            <p className="text-center text-sm text-muted-foreground mb-1">Available Balance</p>
            <p className="text-center text-3xl font-bold text-primary">₦{balance.toLocaleString()}</p>
          </Card>

          {/* Withdrawal Form */}
          <Card className="glass p-6 mb-8">
            <h3 className="text-lg font-semibold mb-4">New Withdrawal Request</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Amount (₦)</label>
                <Input
                  type="number"
                  placeholder="Min ₦1,000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
                {Number(amount) > 0 && (
                  <div className="mt-2 text-xs space-y-1">
                    <div className="flex justify-between text-muted-foreground">
                      <span>Withdrawal fee ({WITHDRAWAL_FEE_PERCENT}%)</span>
                      <span className="text-destructive">-₦{fee.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between font-semibold">
                      <span>You'll receive</span>
                      <span className="text-primary">₦{netAmount.toLocaleString()}</span>
                    </div>
                  </div>
                )}
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Bank Name</label>
                <Input placeholder="e.g. GTBank, Access Bank" value={bankName} onChange={(e) => setBankName(e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Account Number</label>
                <Input placeholder="10-digit account number" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} maxLength={10} />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Account Name</label>
                <Input placeholder="Name on bank account" value={accountName} onChange={(e) => setAccountName(e.target.value)} />
              </div>
              <Button
                className="button-gradient w-full py-6 text-lg"
                disabled={submitting || !withdrawalWindow.allowed}
                onClick={handleSubmit}
              >
                {submitting ? "Submitting..." : !withdrawalWindow.allowed ? "Window Closed" : "Submit Withdrawal Request"}
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                <AlertTriangle className="w-3 h-3 inline mr-1" />
                A {WITHDRAWAL_FEE_PERCENT}% processing fee applies. Withdrawals reviewed within 24-48hrs.
              </p>
            </div>
          </Card>

          {/* Withdrawal History */}
          <h3 className="text-lg font-semibold mb-4">Withdrawal History</h3>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : withdrawals.length === 0 ? (
            <Card className="glass p-8 text-center text-muted-foreground">
              No withdrawal requests yet.
            </Card>
          ) : (
            <div className="space-y-3">
              {withdrawals.map((w) => (
                <Card key={w.id} className="glass p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {statusIcon(w.status)}
                      <span className="font-bold">₦{Number(w.amount).toLocaleString()}</span>
                    </div>
                    <Badge variant={statusColor(w.status)}>{w.status}</Badge>
                  </div>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <p>{w.bank_name} — {w.account_number} — {w.account_name}</p>
                    <p>{new Date(w.created_at).toLocaleDateString("en-NG", {
                      year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
                    })}</p>
                    {w.admin_note && (
                      <p className="text-primary mt-1">Note: {w.admin_note}</p>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </motion.div>
      </main>
      <Footer />
    </div>
  );
};

export default Withdraw;
