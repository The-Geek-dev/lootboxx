import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import Navigation from "@/components/Navigation";
import AppSidebar from "@/components/AppSidebar";
import Footer from "@/components/Footer";
import {
  Rocket,
  Building2,
  CheckCircle2,
  Loader2,
  XCircle,
  Copy,
  Upload,
  ArrowLeft,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Link, useNavigate } from "react-router-dom";
import { useLaunchStatus } from "@/hooks/useLaunchStatus";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const KUDA = {
  bank: "Kuda MFB",
  accountNumber: "3003749879",
  accountName: "LOOTBOXX VENTURES",
};

const DEPOSIT_TIERS = [
  { label: "Activation", amount: 7000, bonus: 1000, points: 1000, type: "activation", description: "One-time account activation" },
  { label: "Weekly Renewal", amount: 2000, bonus: 200, points: 150, type: "renewal", description: "Renew your weekly access" },
  { label: "Top-up ₦5,000", amount: 5000, bonus: 500, points: 300, type: "topup", description: "Add funds to your wallet" },
  { label: "Top-up ₦10,000", amount: 10000, bonus: 1500, points: 700, type: "topup", description: "Best value top-up" },
];

type Tier = (typeof DEPOSIT_TIERS)[number];
type Step = "select" | "method" | "transfer" | "verifying" | "success" | "rejected" | "manual_review";
type PayMethod = "squad" | "manual";

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

const CopyRow = ({ label, value }: { label: string; value: string }) => {
  const { toast } = useToast();
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      toast({ title: "Copied", description: `${label} copied to clipboard` });
    } catch {
      toast({ title: "Copy failed", variant: "destructive" });
    }
  };
  return (
    <div className="flex items-center justify-between gap-2 p-3 rounded-lg bg-muted/40 border border-border">
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="font-semibold text-foreground truncate">{value}</p>
      </div>
      <Button size="sm" variant="outline" onClick={copy}>
        <Copy className="w-3.5 h-3.5 mr-1" /> Copy
      </Button>
    </div>
  );
};

const LiveDepositView = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement | null>(null);

  const [step, setStep] = useState<Step>("select");
  const [selectedTier, setSelectedTier] = useState<Tier | null>(null);
  const [isActivated, setIsActivated] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
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

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const availableTiers = DEPOSIT_TIERS.filter(
    (t) => !(t.type === "activation" && isActivated),
  );

  const handlePickTier = (tier: Tier) => {
    setSelectedTier(tier);
    setStep("method");
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
        // Clean URL
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith("image/")) {
      toast({ title: "Please upload an image file", variant: "destructive" });
      return;
    }
    if (f.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "Max 5MB", variant: "destructive" });
      return;
    }
    setFile(f);
  };

  const handleSubmit = async () => {
    if (!selectedTier || !file) return;
    setSubmitting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({ title: "Please log in first", variant: "destructive" });
        return;
      }
      const userId = session.user.id;
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${userId}/${crypto.randomUUID()}.${ext}`;

      // Upload
      const { error: upErr } = await supabase.storage.from("receipts").upload(path, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type,
      });
      if (upErr) throw upErr;

      // Insert receipt row
      const { data: inserted, error: insErr } = await supabase
        .from("deposit_receipts")
        .insert({
          user_id: userId,
          amount: selectedTier.amount,
          deposit_type: selectedTier.type,
          bonus: selectedTier.bonus,
          points_reward: selectedTier.points,
          receipt_url: path,
        })
        .select()
        .single();
      if (insErr) throw insErr;

      setStep("verifying");

      // Call verify edge function
      const { data: verifyData, error: verifyErr } = await supabase.functions.invoke("verify-receipt", {
        body: { receipt_id: inserted.id },
      });

      if (verifyErr) throw verifyErr;

      const status = verifyData?.status as string | undefined;
      const message = verifyData?.message as string | undefined;
      setResultMsg(message || "");

      if (verifyData?.success && status === "verified") {
        setStep("success");
        setIsActivated(true);
        toast({ title: "Payment verified! 🎉", description: "Wallet credited." });
      } else if (status === "manual_review") {
        setStep("manual_review");
      } else {
        setStep("rejected");
      }
    } catch (err: any) {
      console.error(err);
      toast({ title: "Submission failed", description: err.message, variant: "destructive" });
      setStep("transfer");
    } finally {
      setSubmitting(false);
    }
  };

  const resetFlow = () => {
    setSelectedTier(null);
    setFile(null);
    setResultMsg("");
    setStep("select");
  };

  // ------- Render by step -------
  if (step === "verifying") {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center max-w-md mx-auto">
        <Loader2 className="w-12 h-12 mx-auto mb-4 text-primary animate-spin" />
        <h1 className="text-2xl font-bold mb-2">Verifying your receipt…</h1>
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
        <h1 className="text-2xl font-bold mb-2">Receipt Rejected</h1>
        <p className="text-muted-foreground mb-6">{resultMsg || "We couldn't verify the receipt."}</p>
        <div className="text-left bg-muted/30 border border-border rounded-lg p-4 mb-6 text-sm space-y-1">
          <p className="font-semibold">Common issues:</p>
          <ul className="list-disc list-inside text-muted-foreground space-y-1">
            <li>Wrong recipient account or name</li>
            <li>Amount transferred doesn't match the plan</li>
            <li>Receipt is blurry or cut off</li>
            <li>Transfer is still pending or failed</li>
          </ul>
        </div>
        <div className="flex gap-3 justify-center">
          <Button className="button-gradient" onClick={() => setStep("transfer")}>Try Again</Button>
          <Button variant="outline" onClick={resetFlow}>Choose Different Plan</Button>
        </div>
      </motion.div>
    );
  }

  if (step === "manual_review") {
    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-md mx-auto">
        <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-yellow-500" />
        <h1 className="text-2xl font-bold mb-2">Pending Manual Review</h1>
        <p className="text-muted-foreground mb-6">
          {resultMsg || "We couldn't auto-verify your receipt. An admin will review it shortly and credit your wallet."}
        </p>
        <div className="flex gap-3 justify-center">
          <Button className="button-gradient" onClick={() => navigate("/")}>Back to Home</Button>
          <Button variant="outline" onClick={resetFlow}>Submit Another</Button>
        </div>
      </motion.div>
    );
  }

  if (step === "method" && selectedTier) {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-xl mx-auto w-full">
        <Button variant="ghost" size="sm" onClick={resetFlow} className="mb-3">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back
        </Button>
        <h1 className="text-2xl font-bold mb-1">Pay ₦{selectedTier.amount.toLocaleString()}</h1>
        <p className="text-muted-foreground text-sm mb-5">Choose how you'd like to pay.</p>

        <Card
          onClick={() => !paying && startSquadPayment()}
          className="p-4 mb-3 cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-bold text-foreground">Pay with Card / Bank / USSD</h3>
                <span className="text-[10px] font-bold bg-primary/20 text-primary px-2 py-0.5 rounded-full">RECOMMENDED</span>
              </div>
              <p className="text-sm text-muted-foreground">Instant — wallet credits automatically.</p>
            </div>
            {paying ? (
              <Loader2 className="w-5 h-5 animate-spin text-primary shrink-0" />
            ) : (
              <Rocket className="w-5 h-5 text-primary shrink-0" />
            )}
          </div>
        </Card>

        <Card
          onClick={() => setStep("transfer")}
          className="p-4 cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <h3 className="font-bold text-foreground">Manual Bank Transfer</h3>
              <p className="text-sm text-muted-foreground">Backup option — transfer & upload receipt.</p>
            </div>
            <Building2 className="w-5 h-5 text-muted-foreground shrink-0" />
          </div>
        </Card>
      </motion.div>
    );
  }

  if (step === "transfer" && selectedTier) {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto w-full">
        <Button variant="ghost" size="sm" onClick={resetFlow} className="mb-3">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back
        </Button>

        <h1 className="text-2xl font-bold mb-1">Pay ₦{selectedTier.amount.toLocaleString()}</h1>
        <p className="text-muted-foreground text-sm mb-5">
          Transfer the exact amount to the account below, then upload your receipt.
        </p>

        <Card className="p-4 mb-5">
          <div className="flex items-center gap-2 mb-3">
            <Building2 className="w-5 h-5 text-primary" />
            <h3 className="font-semibold">Bank Transfer Details</h3>
          </div>
          <div className="space-y-2">
            <CopyRow label="Bank" value={KUDA.bank} />
            <CopyRow label="Account Number" value={KUDA.accountNumber} />
            <CopyRow label="Account Name" value={KUDA.accountName} />
            <CopyRow label="Amount" value={`₦${selectedTier.amount.toLocaleString()}`} />
          </div>
          <div className="mt-4 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-sm text-foreground">
            ⚠️ Send the <strong>exact amount</strong>. Mismatched amounts will be rejected.
          </div>
        </Card>

        <Card className="p-4 mb-5">
          <h3 className="font-semibold mb-3">Upload Your Receipt</h3>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
          {!previewUrl ? (
            <button
              onClick={() => fileRef.current?.click()}
              className="w-full border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/60 transition-colors"
            >
              <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
              <p className="font-medium text-foreground">Tap to upload receipt</p>
              <p className="text-xs text-muted-foreground mt-1">PNG/JPG, max 5MB</p>
            </button>
          ) : (
            <div className="space-y-3">
              <img
                src={previewUrl}
                alt="Receipt preview"
                className="w-full max-h-80 object-contain rounded-lg border border-border bg-muted/20"
              />
              <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
                Change image
              </Button>
            </div>
          )}
        </Card>

        <Button
          className="button-gradient w-full py-3 text-lg"
          onClick={handleSubmit}
          disabled={!file || submitting}
        >
          {submitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Submitting…
            </>
          ) : (
            "Submit Receipt for Verification"
          )}
        </Button>
      </motion.div>
    );
  }

  // Default: select tier
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto w-full">
      <h1 className="text-3xl font-bold text-center mb-2">💰 Deposit Funds</h1>
      <p className="text-muted-foreground text-center mb-6">
        Choose a plan, then transfer to our Kuda account and upload your receipt.
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
