import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import AppSidebar from "@/components/AppSidebar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Users, Copy, Gift, Share2, Star, Coins, RefreshCw, CheckCircle2, Clock } from "lucide-react";
import { useDepositGate } from "@/hooks/useDepositGate";
import { getActivationAmount } from "@/config/promo";

// Actual server-side reward values (see process_referral_signup / award_referral_activation_bonus)
const SIGNUP_POINTS = 150;
const ACTIVATION_POINTS = 300;
const ACTIVATION_CASH = 200;
const INFLUENCER_PCT = 0.2;

type Stats = {
  signups: number;
  activations: number;
  pending: number;
  cash_earned: number;
  is_influencer: boolean;
};

const Referrals = () => {
  const navigate = useNavigate();
  const { isAuthorized, isChecking } = useDepositGate();
  const { toast } = useToast();
  const [referralCode, setReferralCode] = useState("");
  const [codeError, setCodeError] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [stats, setStats] = useState<Stats>({
    signups: 0,
    activations: 0,
    pending: 0,
    cash_earned: 0,
    is_influencer: false,
  });

  const loadCode = async () => {
    setGenerating(true);
    setCodeError(false);
    const { data, error } = await supabase.rpc("get_or_create_referral_code");
    if (error || !data) {
      setCodeError(true);
    } else {
      setReferralCode(data as string);
    }
    setGenerating(false);
  };

  const loadStats = async () => {
    const { data } = await supabase.rpc("get_referral_stats");
    if (data) {
      const s = data as any;
      setStats({
        signups: Number(s.signups || 0),
        activations: Number(s.activations || 0),
        pending: Number(s.pending || 0),
        cash_earned: Number(s.cash_earned || 0),
        is_influencer: !!s.is_influencer,
      });
    }
  };

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/login"); return; }
      await Promise.all([loadCode(), loadStats()]);
    };
    init();
  }, [navigate]);

  const pointsEarned = stats.signups * SIGNUP_POINTS + (stats.is_influencer ? 0 : stats.activations * ACTIVATION_POINTS);
  const referralLink = referralCode ? `${window.location.origin}/signup?ref=${referralCode}` : "";
  const conversion = stats.signups > 0 ? Math.round((stats.activations / stats.signups) * 100) : 0;

  const copyCode = () => {
    if (!referralCode) return;
    navigator.clipboard.writeText(referralCode);
    toast({ title: "Copied!", description: "Referral code copied to clipboard." });
  };

  const copyLink = () => {
    if (!referralLink) return;
    navigator.clipboard.writeText(referralLink);
    toast({ title: "Link copied!", description: "Referral link copied to clipboard." });
  };

  const shareCode = () => {
    if (!referralLink) return;
    if (navigator.share) {
      navigator.share({
        title: "Join LootBoxx!",
        text: `Use my referral code ${referralCode} to join LootBoxx!`,
        url: referralLink,
      });
    } else {
      copyLink();
    }
  };

  if (!isAuthorized || isChecking) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
        <p className="text-muted-foreground">Checking access...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <AppSidebar />
      <main className="md:pl-16 container px-4 pt-32 pb-16 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl sm:text-4xl font-bold text-center mb-2">
            <Users className="w-8 h-8 inline-block mr-2 text-primary" />
            Referral <span className="text-gradient">Program</span>
          </h1>
          <p className="text-muted-foreground text-center mb-4">
            Invite friends and earn points + cash when they activate.
          </p>
          <div className="text-center mb-8">
            <Button variant="outline" size="sm" onClick={() => navigate("/influencer")}>
              <Star className="w-4 h-4 mr-2 text-primary" />
              View Influencer Earnings
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <Card className="p-4 bg-card/50 text-center">
              <Users className="w-4 h-4 mx-auto mb-1 text-primary" />
              <p className="text-sm text-muted-foreground mb-1">Signups</p>
              <p className="text-2xl font-bold text-primary">{stats.signups}</p>
            </Card>
            <Card className="p-4 bg-card/50 text-center">
              <CheckCircle2 className="w-4 h-4 mx-auto mb-1 text-green-500" />
              <p className="text-sm text-muted-foreground mb-1">Activated</p>
              <p className="text-2xl font-bold text-green-500">{stats.activations}</p>
            </Card>
            <Card className="p-4 bg-card/50 text-center">
              <Coins className="w-4 h-4 mx-auto mb-1 text-yellow-500" />
              <p className="text-sm text-muted-foreground mb-1">Points Earned</p>
              <p className="text-2xl font-bold text-yellow-500">{pointsEarned.toLocaleString()}</p>
            </Card>
            <Card className="p-4 bg-card/50 text-center">
              <Gift className="w-4 h-4 mx-auto mb-1 text-green-400" />
              <p className="text-sm text-muted-foreground mb-1">Cash Earned</p>
              <p className="text-2xl font-bold text-green-400">₦{stats.cash_earned.toLocaleString()}</p>
            </Card>
          </div>

          <Card className="p-4 bg-primary/5 border-primary/20 mb-6">
            <div className="flex items-center justify-between mb-2">
              <p className="font-semibold text-sm">Conversion rate</p>
              <Badge variant="secondary">{conversion}%</Badge>
            </div>
            <div className="h-2 bg-background rounded-full overflow-hidden mb-2">
              <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${conversion}%` }} />
            </div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {stats.pending} signup{stats.pending === 1 ? "" : "s"} still awaiting activation
            </p>
          </Card>

          {/* Referral Code & Link */}
          <Card className="p-6 bg-card/50 mb-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Gift className="w-5 h-5 text-primary" />
              Your Referral Code
            </h3>
            <div className="flex gap-3 mb-4">
              <div className="flex-1 bg-background rounded-lg p-4 text-center font-mono text-xl font-bold tracking-wider text-primary border border-primary/30">
                {generating ? "Generating…" : referralCode || "—"}
              </div>
              <Button
                variant="outline"
                onClick={codeError ? loadCode : copyCode}
                className="px-4"
                aria-label={codeError ? "Retry code generation" : "Copy code"}
                disabled={generating}
              >
                {codeError ? <RefreshCw className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
              </Button>
            </div>
            {codeError && (
              <p className="text-xs text-destructive mb-4">
                Couldn’t generate your code. Tap the retry button to try again.
              </p>
            )}

            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <Share2 className="w-4 h-4 text-primary" />
              Your Referral Link
            </h3>
            <div className="flex gap-3 mb-4">
              <div className="flex-1 bg-background rounded-lg p-3 text-xs sm:text-sm font-mono break-all border border-border/50 truncate">
                {referralLink || "—"}
              </div>
              <Button variant="outline" onClick={copyLink} className="px-4" aria-label="Copy link" disabled={!referralLink}>
                <Copy className="w-5 h-5" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mb-4">
              Anyone who signs up through your link is automatically credited to you.
            </p>

            <Button className="button-gradient w-full" onClick={shareCode} disabled={!referralLink}>
              <Share2 className="w-4 h-4 mr-2" />
              Share with Friends
            </Button>
          </Card>

          {/* How it works */}
          <Card className="p-6 bg-card/50">
            <h3 className="font-semibold mb-4">How it works</h3>
            <div className="space-y-4">
              {[
                { step: "1", text: "Share your unique referral code or link with friends" },
                { step: "2", text: `They sign up with your code — you instantly get ${SIGNUP_POINTS} points` },
                {
                  step: "3",
                  text: stats.is_influencer
                    ? `They activate — you earn 20% of their activation (₦${Math.round(getActivationAmount() * INFLUENCER_PCT).toLocaleString()} today)`
                    : `They activate — you earn ${ACTIVATION_POINTS} points + ₦${ACTIVATION_CASH} cash`,
                },
                { step: "4", text: "Rewards land in your wallet automatically — no claiming needed" },
              ].map((item) => (
                <div key={item.step} className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold flex-shrink-0">
                    {item.step}
                  </div>
                  <p className="text-sm text-muted-foreground">{item.text}</p>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
};

export default Referrals;
