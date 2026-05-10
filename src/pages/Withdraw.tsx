import { useState, useEffect } from "react";
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
  const { balance, fetchBalance } = useWallet();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [amount, setAmount] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const [loading, setLoading] = useState(false);
  const [winnings, setWinnings] = useState<number>(0);
  const [accountLocked, setAccountLocked] = useState(false);
  const [pendingWithdrawal, setPendingWithdrawal] = useState<{ id: string; amount: number; status: string; created_at: string } | null>(null);
  const [history, setHistory] = useState<Array<{ id: string; amount: number; status: string; created_at: string; updated_at: string; bank_name: string; account_number: string; admin_note: string | null }>>([]);
  const [firstPlayAt, setFirstPlayAt] = useState<Date | null>(null);
  const [eligibilityChecked, setEligibilityChecked] = useState(false);

  const minWithdraw = 1000;
  const fee = 0.05;
  const REQUIRED_DAYS = 7;

  const daysPlayed = firstPlayAt ? (Date.now() - firstPlayAt.getTime()) / 86400000 : 0;
  const daysLeft = firstPlayAt ? Math.max(0, Math.ceil(REQUIRED_DAYS - daysPlayed)) : REQUIRED_DAYS;
  const playEligible = !!firstPlayAt && daysPlayed >= REQUIRED_DAYS;
  const formLocked = !!pendingWithdrawal || (eligibilityChecked && !playEligible);

  const refreshPending = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const { data } = await supabase
      .from("withdrawals")
      .select("id, amount, status, created_at")
      .eq("user_id", session.user.id)
      .in("status", ["pending"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    setPendingWithdrawal(data ?? null);
  };

  useEffect(() => {
    supabase.rpc("get_winnings_balance").then(({ data }) => {
      if (typeof data === "number") setWinnings(Number(data));
    });
    refreshPending();
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setEligibilityChecked(true); return; }
      const { data: firstGame } = await supabase
        .from("game_results")
        .select("created_at")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();
      setFirstPlayAt(firstGame?.created_at ? new Date(firstGame.created_at) : null);
      setEligibilityChecked(true);
    })();
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const { data } = await supabase
        .from("user_wallets")
        .select("locked_bank_name, locked_account_number, locked_account_name")
        .eq("user_id", session.user.id)
        .maybeSingle();
      if (data?.locked_account_number) {
        setBankName(data.locked_bank_name || "");
        setAccountNumber(data.locked_account_number || "");
        setAccountName(data.locked_account_name || "");
        setAccountLocked(true);
      }
    })();
  }, []);

  const handleWithdraw = async () => {
    if (eligibilityChecked && !playEligible) {
      toast({
        title: "Withdrawals locked",
        description: firstPlayAt
          ? `Play for ${daysLeft} more day${daysLeft === 1 ? "" : "s"} to unlock withdrawals.`
          : "Play at least one game to start your 7-day withdrawal countdown.",
        variant: "destructive",
      });
      return;
    }
    if (pendingWithdrawal) {
      toast({
        title: "Withdrawal already in progress",
        description: `Your previous request of ₦${Number(pendingWithdrawal.amount).toLocaleString()} is still being processed. Please wait until it's completed or rejected.`,
        variant: "destructive",
      });
      return;
    }
    const amt = Number(amount);
    if (!amt || amt < minWithdraw) {
      toast({ title: `Minimum withdrawal is ₦${minWithdraw.toLocaleString()}`, variant: "destructive" });
      return;
    }
    if (amt > winnings) {
      toast({ title: "You can only withdraw your game winnings", description: `Available winnings: ₦${winnings.toLocaleString()}`, variant: "destructive" });
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

      const { data: rpcRes, error } = await supabase.rpc("request_withdrawal", {
        p_amount: amt,
        p_bank_name: bankName,
        p_account_number: accountNumber,
        p_account_name: accountName,
      });

      if (error) throw error;
      const insertedId = (rpcRes as any)?.id ?? crypto.randomUUID();
      await fetchBalance();

      const feeAmount = Math.round(amt * fee * 100) / 100;
      const netAmount = Math.round((amt - feeAmount) * 100) / 100;
      const reference = `LBX-WD-${String(insertedId).slice(0, 8).toUpperCase()}`;
      const processedAt = new Date().toISOString();
      const recipientEmail = session.user.email ?? "";

      const details = {
        recipientName: accountName,
        recipientEmail,
        amount: amt,
        feeAmount,
        netAmount,
        bankName,
        accountNumber,
        accountName,
        reference,
        processedAt,
      };

      // NOTE: Receipt email is sent ONLY after an admin approves the withdrawal
      // (see admin-api `update_withdrawal` action). No email is sent on submission.

      sessionStorage.setItem("lootboxx_last_withdrawal", JSON.stringify(details));
      toast({
        title: "Withdrawal submitted ⏳",
        description: "Awaiting admin approval. Estimated 48–72 hours.",
      });
      navigate("/withdraw/processing", { state: { details } });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-lg mx-auto">
      <h1 className="text-3xl font-bold text-center mb-2">💸 Withdraw Funds</h1>
      <p className="text-muted-foreground text-center mb-1">Wallet balance: <span className="font-bold text-foreground">₦{balance.toLocaleString()}</span></p>
      <p className="text-muted-foreground text-center mb-1">Withdrawable winnings: <span className="font-bold text-primary">₦{winnings.toLocaleString()}</span></p>
      <p className="text-xs text-muted-foreground text-center mb-6">Only winnings (not deposits) are withdrawable • Sat-Sun, 6-7 PM • 5% fee</p>

      {pendingWithdrawal && (
        <Card className="p-4 mb-4 bg-amber-500/10 border-amber-500/30">
          <p className="text-sm font-semibold text-amber-500 mb-1">⏳ Withdrawal in progress</p>
          <p className="text-xs text-muted-foreground">
            Your request of <span className="font-semibold text-foreground">₦{Number(pendingWithdrawal.amount).toLocaleString()}</span> submitted on{" "}
            {new Date(pendingWithdrawal.created_at).toLocaleString("en-NG", { timeZone: "Africa/Lagos", dateStyle: "medium", timeStyle: "short" })} is awaiting admin approval (48–72 hours).
            You can submit a new withdrawal once it's completed or rejected.
          </p>
        </Card>
      )}

      {eligibilityChecked && !playEligible && (
        <Card className="p-4 mb-4 bg-destructive/10 border-destructive/30">
          <p className="text-sm font-semibold text-destructive mb-1">🔒 Withdrawals locked</p>
          <p className="text-xs text-muted-foreground">
            {firstPlayAt ? (
              <>
                You need to play for at least 7 days before you can withdraw.{" "}
                <span className="font-semibold text-foreground">{daysLeft} day{daysLeft === 1 ? "" : "s"} left</span> until your account is eligible.
              </>
            ) : (
              <>You haven't played any game yet. Play at least one game to start your 7-day countdown to withdrawal eligibility.</>
            )}
          </p>
          <div className="mt-3 pt-3 border-t border-destructive/20">
            <p className="text-xs font-semibold text-foreground mb-1">How to unlock</p>
            <ul className="text-xs text-muted-foreground space-y-1 list-disc pl-4">
              <li>The 7-day clock starts the moment you play your <span className="font-semibold text-foreground">first game</span> on LootBoxx (your earliest game record).</li>
              <li>
                {firstPlayAt ? (
                  <>You first played on <span className="font-semibold text-foreground">{firstPlayAt.toLocaleString("en-NG", { timeZone: "Africa/Lagos", dateStyle: "medium", timeStyle: "short" })}</span>, so withdrawals unlock on <span className="font-semibold text-foreground">{new Date(firstPlayAt.getTime() + 7 * 86400000).toLocaleString("en-NG", { timeZone: "Africa/Lagos", dateStyle: "medium", timeStyle: "short" })}</span>.</>
                ) : (
                  <>Play any game (even a 20-point bet) to start your timer — no need to keep playing every day.</>
                )}
              </li>
              <li>Once unlocked, normal rules apply: weekends 6–7 PM, 5% fee, only winnings are withdrawable.</li>
            </ul>
          </div>
        </Card>
      )}

      <Card className="p-6 space-y-4">
        <div>
          <Label>Amount (₦)</Label>
          <Input type="number" placeholder="Min ₦1,000" value={amount} onChange={(e) => setAmount(e.target.value)} disabled={formLocked} />
          {Number(amount) > 0 && (
            <p className="text-xs text-muted-foreground mt-1">
              You'll receive: ₦{Math.floor(Number(amount) * (1 - fee)).toLocaleString()} (after 5% fee)
            </p>
          )}
        </div>
        {accountLocked && (
          <p className="text-xs text-primary bg-primary/10 border border-primary/30 rounded p-2">
            🔒 Your withdrawal account is locked for your security. Contact support to change it.
          </p>
        )}
        <div>
          <Label>Bank Name</Label>
          <Input placeholder="e.g. GTBank, Access Bank" value={bankName} onChange={(e) => setBankName(e.target.value)} disabled={accountLocked || formLocked} />
        </div>
        <div>
          <Label>Account Number</Label>
          <Input placeholder="10-digit account number" maxLength={10} value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} disabled={accountLocked || formLocked} />
        </div>
        <div>
          <Label>Account Name</Label>
          <Input placeholder="Name on your bank account" value={accountName} onChange={(e) => setAccountName(e.target.value)} disabled={accountLocked || formLocked} />
        </div>
        <Button className="button-gradient w-full py-3" onClick={handleWithdraw} disabled={loading || formLocked}>
          {eligibilityChecked && !playEligible
            ? (firstPlayAt ? `Unlocks in ${daysLeft} day${daysLeft === 1 ? "" : "s"}` : "Play a game to unlock")
            : pendingWithdrawal
            ? "Withdrawal already in progress"
            : loading ? "Submitting..." : "Submit Withdrawal"}
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
