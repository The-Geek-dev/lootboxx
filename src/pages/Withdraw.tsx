import { useState } from "react";
import { motion } from "framer-motion";
import Navigation from "@/components/Navigation";
import AppSidebar from "@/components/AppSidebar";
import Footer from "@/components/Footer";
import { Rocket, Banknote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link, useNavigate } from "react-router-dom";
import { useLaunchStatus } from "@/hooks/useLaunchStatus";
import { supabase } from "@/integrations/supabase/client";
import { useWallet } from "@/hooks/useWallet";
import { useToast } from "@/hooks/use-toast";

const ComingSoonView = () => (
  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-md mx-auto">
    <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-6">
      <Banknote className="w-10 h-10 text-primary" />
    </div>
    <h1 className="text-3xl font-bold mb-3">Coming Soon!</h1>
    <div className="w-16 h-16 bg-accent/20 rounded-full flex items-center justify-center mx-auto mb-4">
      <Rocket className="w-8 h-8 text-accent animate-bounce" />
    </div>
    <p className="text-muted-foreground mb-6">
      Withdrawals are not yet available. LootBoxx is launching very soon — sign up now so you're ready to cash out when we go live!
    </p>
    <div className="flex gap-3 justify-center">
      <Link to="/signup"><Button className="button-gradient">Sign Up Now</Button></Link>
      <Link to="/"><Button variant="outline">Back to Home</Button></Link>
    </div>
  </motion.div>
);

const LiveWithdrawView = () => {
  const { balance } = useWallet();
  const { toast } = useToast();
  const [amount, setAmount] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const [loading, setLoading] = useState(false);

  const minWithdraw = 1000;
  const fee = 0.05;

  const handleWithdraw = async () => {
    const amt = Number(amount);
    if (!amt || amt < minWithdraw) {
      toast({ title: `Minimum withdrawal is ₦${minWithdraw.toLocaleString()}`, variant: "destructive" });
      return;
    }
    if (amt > balance) {
      toast({ title: "Insufficient balance", variant: "destructive" });
      return;
    }
    if (!bankName || !accountNumber || !accountName) {
      toast({ title: "Please fill all bank details", variant: "destructive" });
      return;
    }

    // Check day/time restrictions (Sat/Sun 6-7 PM)
    const now = new Date();
    const day = now.getDay();
    const hour = now.getHours();
    if (day !== 0 && day !== 6) {
      toast({ title: "Withdrawals available on weekends only (Sat-Sun)", variant: "destructive" });
      return;
    }
    if (hour < 18 || hour >= 19) {
      toast({ title: "Withdrawals available 6-7 PM only", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { error } = await supabase.from("withdrawals").insert({
        user_id: session.user.id,
        amount: amt,
        bank_name: bankName,
        account_number: accountNumber,
        account_name: accountName,
      });

      if (error) throw error;

      toast({ title: "Withdrawal submitted! 🎉", description: `₦${amt.toLocaleString()} (5% fee applies). Admin will review.` });
      setAmount("");
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-lg mx-auto">
      <h1 className="text-3xl font-bold text-center mb-2">💸 Withdraw Funds</h1>
      <p className="text-muted-foreground text-center mb-1">Available balance: <span className="font-bold text-foreground">₦{balance.toLocaleString()}</span></p>
      <p className="text-xs text-muted-foreground text-center mb-6">Weekends only (Sat-Sun, 6-7 PM) • 5% processing fee</p>

      <Card className="p-6 space-y-4">
        <div>
          <Label>Amount (₦)</Label>
          <Input type="number" placeholder="Min ₦1,000" value={amount} onChange={(e) => setAmount(e.target.value)} />
          {Number(amount) > 0 && (
            <p className="text-xs text-muted-foreground mt-1">
              You'll receive: ₦{Math.floor(Number(amount) * (1 - fee)).toLocaleString()} (after 5% fee)
            </p>
          )}
        </div>
        <div>
          <Label>Bank Name</Label>
          <Input placeholder="e.g. GTBank, Access Bank" value={bankName} onChange={(e) => setBankName(e.target.value)} />
        </div>
        <div>
          <Label>Account Number</Label>
          <Input placeholder="10-digit account number" maxLength={10} value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} />
        </div>
        <div>
          <Label>Account Name</Label>
          <Input placeholder="Name on your bank account" value={accountName} onChange={(e) => setAccountName(e.target.value)} />
        </div>
        <Button className="button-gradient w-full py-3" onClick={handleWithdraw} disabled={loading}>
          {loading ? "Submitting..." : "Submit Withdrawal"}
        </Button>
      </Card>
    </motion.div>
  );
};

const Withdraw = () => {
  const { isLaunched } = useLaunchStatus();

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <AppSidebar />
      <div className="md:pl-16 min-h-screen flex flex-col">
        <main className="container px-4 pt-32 pb-24 flex-1 flex items-center justify-center">
          {isLaunched ? <LiveWithdrawView /> : <ComingSoonView />}
        </main>
        <Footer />
      </div>
    </div>
  );
};

export default Withdraw;
