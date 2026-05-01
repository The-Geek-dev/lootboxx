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
import { usePoints } from "@/hooks/usePoints";
import { Users, Copy, Gift, Share2, Star, Coins } from "lucide-react";
import { useDepositGate } from "@/hooks/useDepositGate";

const REFERRAL_BONUS_CASH = 500;
const REFERRAL_BONUS_POINTS = 200;
const MILESTONE_REFERRALS = 5;
const MILESTONE_CASH_BONUS = 5000;
const MILESTONE_POINTS_BONUS = 3000;

const Referrals = () => {
  const navigate = useNavigate();
  const { isAuthorized, isChecking } = useDepositGate();
  const { toast } = useToast();
  const { points, addPoints } = usePoints();
  const [referralCode, setReferralCode] = useState("");
  const [referrals, setReferrals] = useState<any[]>([]);
  const [totalEarned, setTotalEarned] = useState(0);
  const [totalPointsEarned, setTotalPointsEarned] = useState(0);

  const activeReferrals = referrals.filter((r) => r.referred_id);
  const milestonesReached = Math.floor(activeReferrals.length / MILESTONE_REFERRALS);

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/login"); return; }

      const { data: existing } = await supabase
        .from("referrals")
        .select("*")
        .eq("referrer_id", session.user.id);

      if (existing && existing.length > 0) {
        setReferralCode(existing[0].referral_code);
        setReferrals(existing);
        setTotalEarned(existing.reduce((sum: number, r: any) => sum + Number(r.bonus_amount), 0));
        setTotalPointsEarned(existing.filter((r: any) => r.referred_id).length * REFERRAL_BONUS_POINTS);
      } else {
        const code = `LOOT-${session.user.id.slice(0, 6).toUpperCase()}`;
        await supabase.from("referrals").insert({
          referrer_id: session.user.id,
          referral_code: code,
          bonus_amount: 0,
          status: "active",
        });
        setReferralCode(code);
      }
    };
    init();
  }, [navigate]);

  const referralLink = referralCode ? `${window.location.origin}/signup?ref=${referralCode}` : "";

  const copyCode = () => {
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
        text: `Use my referral code ${referralCode} to join LootBoxx and get a ₦${REFERRAL_BONUS_CASH} bonus + ${REFERRAL_BONUS_POINTS} points!`,
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
          <p className="text-muted-foreground text-center mb-8">
            Invite friends and earn cash + points!
          </p>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <Card className="p-4 bg-card/50 text-center">
              <p className="text-sm text-muted-foreground mb-1">Total Referrals</p>
              <p className="text-2xl font-bold text-primary">{activeReferrals.length}</p>
            </Card>
            <Card className="p-4 bg-card/50 text-center">
              <p className="text-sm text-muted-foreground mb-1">Cash Earned</p>
              <p className="text-2xl font-bold text-green-400">₦{totalEarned.toLocaleString()}</p>
            </Card>
            <Card className="p-4 bg-card/50 text-center">
              <Coins className="w-4 h-4 mx-auto mb-1 text-yellow-500" />
              <p className="text-sm text-muted-foreground mb-1">Points Earned</p>
              <p className="text-2xl font-bold text-yellow-500">{totalPointsEarned.toLocaleString()}</p>
            </Card>
            <Card className="p-4 bg-card/50 text-center">
              <Star className="w-4 h-4 mx-auto mb-1 text-primary" />
              <p className="text-sm text-muted-foreground mb-1">Milestones</p>
              <p className="text-2xl font-bold text-primary">{milestonesReached}</p>
            </Card>
          </div>

          {/* Milestone Progress */}
          <Card className="p-4 bg-primary/5 border-primary/20 mb-6">
            <div className="flex items-center justify-between mb-2">
              <p className="font-semibold text-sm">🏆 Milestone Bonus</p>
              <Badge variant="secondary">{activeReferrals.length % MILESTONE_REFERRALS}/{MILESTONE_REFERRALS}</Badge>
            </div>
            <div className="h-2 bg-background rounded-full overflow-hidden mb-2">
              <div
                className="h-full bg-primary rounded-full transition-all"
                style={{ width: `${(activeReferrals.length % MILESTONE_REFERRALS) / MILESTONE_REFERRALS * 100}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Every {MILESTONE_REFERRALS} referrals = ₦{MILESTONE_CASH_BONUS.toLocaleString()} cash + {MILESTONE_POINTS_BONUS.toLocaleString()} bonus points!
            </p>
          </Card>

          {/* Referral Code */}
          <Card className="p-6 bg-card/50 mb-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Gift className="w-5 h-5 text-primary" />
              Your Referral Code
            </h3>
            <div className="flex gap-3">
              <div className="flex-1 bg-background rounded-lg p-4 text-center font-mono text-xl font-bold tracking-wider text-primary border border-primary/30">
                {referralCode}
              </div>
              <Button variant="outline" onClick={copyCode} className="px-4">
                <Copy className="w-5 h-5" />
              </Button>
            </div>
            <Button className="button-gradient w-full mt-4" onClick={shareCode}>
              <Share2 className="w-4 h-4 mr-2" />
              Share with Friends
            </Button>
          </Card>

          {/* How it works */}
          <Card className="p-6 bg-card/50">
            <h3 className="font-semibold mb-4">How it works</h3>
            <div className="space-y-4">
              {[
                { step: "1", text: "Share your unique referral code with friends" },
                { step: "2", text: "Your friend signs up and activates their account" },
                { step: "3", text: `You both earn ₦${REFERRAL_BONUS_CASH} + ${REFERRAL_BONUS_POINTS} points!` },
                { step: "4", text: `Every ${MILESTONE_REFERRALS} referrals = ₦${MILESTONE_CASH_BONUS.toLocaleString()} + ${MILESTONE_POINTS_BONUS.toLocaleString()} pts bonus!` },
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
