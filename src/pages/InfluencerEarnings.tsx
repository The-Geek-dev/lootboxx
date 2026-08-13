import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import AppSidebar from "@/components/AppSidebar";
import Footer from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles, TrendingUp, Clock, CheckCircle2, Users, Percent } from "lucide-react";
import { getActivationAmount, isPromoActive } from "@/config/promo";

type ReferralRow = {
  id: string;
  referred_id: string | null;
  referral_code: string;
  bonus_amount: number;
  status: string;
  activation_bonus_awarded: boolean;
  created_at: string;
};

const INFLUENCER_PCT = 0.2;

const InfluencerEarnings = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isInfluencer, setIsInfluencer] = useState(false);
  const [rows, setRows] = useState<ReferralRow[]>([]);

  useEffect(() => {
    const run = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/login"); return; }

      const [{ data: stats }, { data: refs }] = await Promise.all([
        supabase.rpc("get_referral_stats"),
        supabase
          .from("referrals")
          .select("id, referred_id, referral_code, bonus_amount, status, activation_bonus_awarded, created_at")
          .eq("referrer_id", session.user.id)
          .order("created_at", { ascending: false }),
      ]);

      setIsInfluencer(!!(stats as any)?.is_influencer);
      setRows((refs as ReferralRow[]) || []);
      setLoading(false);
    };
    run();
  }, [navigate]);

  // Only referrals that actually attached to a user count as real activity
  const signups = rows.filter((r) => r.referred_id);
  const paid = signups.filter((r) => r.activation_bonus_awarded);
  const pending = signups.filter((r) => !r.activation_bonus_awarded);
  const totalPaid = paid.reduce((s, r) => s + Number(r.bonus_amount || 0), 0);

  // Estimate uses the activation price live today (promo-aware)
  const expectedPerPending = Math.round(getActivationAmount() * INFLUENCER_PCT);
  const totalPending = pending.length * expectedPerPending;
  const conversion = signups.length > 0 ? Math.round((paid.length / signups.length) * 100) : 0;
  const avgCommission = paid.length > 0 ? Math.round(totalPaid / paid.length) : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <AppSidebar />
      <main className="md:pl-16 container px-4 pt-32 pb-16 max-w-3xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="text-center mb-6">
            <h1 className="text-2xl sm:text-4xl font-bold mb-2">
              <Sparkles className="w-8 h-8 inline-block mr-2 text-primary" />
              Influencer <span className="text-gradient">Earnings</span>
            </h1>
            <p className="text-muted-foreground text-sm">
              Track your 20% commission on every referral activation
            </p>
            {!isInfluencer && (
              <Badge variant="outline" className="mt-3">
                You are not an influencer yet — contact admin to apply
              </Badge>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 mb-3">
            <Card className="p-4 bg-card/50 text-center">
              <TrendingUp className="w-4 h-4 mx-auto mb-1 text-green-500" />
              <p className="text-xs text-muted-foreground mb-1">Total Paid</p>
              <p className="text-xl sm:text-2xl font-bold text-green-500">
                ₦{totalPaid.toLocaleString()}
              </p>
            </Card>
            <Card className="p-4 bg-card/50 text-center">
              <Clock className="w-4 h-4 mx-auto mb-1 text-yellow-500" />
              <p className="text-xs text-muted-foreground mb-1">Pending (est.)</p>
              <p className="text-xl sm:text-2xl font-bold text-yellow-500">
                ₦{totalPending.toLocaleString()}
              </p>
            </Card>
            <Card className="p-4 bg-card/50 text-center">
              <CheckCircle2 className="w-4 h-4 mx-auto mb-1 text-primary" />
              <p className="text-xs text-muted-foreground mb-1">Activations</p>
              <p className="text-xl sm:text-2xl font-bold text-primary">{paid.length}</p>
            </Card>
            <Card className="p-4 bg-card/50 text-center">
              <Users className="w-4 h-4 mx-auto mb-1 text-primary" />
              <p className="text-xs text-muted-foreground mb-1">Total Signups</p>
              <p className="text-xl sm:text-2xl font-bold text-primary">{signups.length}</p>
            </Card>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-6">
            <Card className="p-4 bg-card/50 text-center">
              <Percent className="w-4 h-4 mx-auto mb-1 text-primary" />
              <p className="text-xs text-muted-foreground mb-1">Conversion Rate</p>
              <p className="text-xl sm:text-2xl font-bold text-primary">{conversion}%</p>
            </Card>
            <Card className="p-4 bg-card/50 text-center">
              <TrendingUp className="w-4 h-4 mx-auto mb-1 text-green-400" />
              <p className="text-xs text-muted-foreground mb-1">Avg. Commission</p>
              <p className="text-xl sm:text-2xl font-bold text-green-400">
                ₦{avgCommission.toLocaleString()}
              </p>
            </Card>
          </div>

          <Card className="p-4 sm:p-6 bg-card/50">
            <h3 className="font-semibold mb-4">Commission History</h3>
            {signups.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No referrals yet. Share your code from the Referrals page to start earning.
              </p>
            ) : (
              <div className="space-y-2">
                {signups.map((r) => {
                  const isPaid = r.activation_bonus_awarded;
                  return (
                    <div
                      key={r.id}
                      className="flex items-center justify-between gap-3 p-3 rounded-lg border border-border/40 bg-background/40"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">
                          Referred user {r.referred_id?.slice(0, 8)}…
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(r.created_at).toLocaleDateString("en-NG", {
                            year: "numeric", month: "short", day: "numeric",
                          })}
                          {" · "}
                          <span className="uppercase tracking-wide">{r.status}</span>
                        </p>
                      </div>
                      <div className="text-right whitespace-nowrap">
                        {isPaid ? (
                          <>
                            <p className="font-bold text-green-500">
                              +₦{Number(r.bonus_amount).toLocaleString()}
                            </p>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-green-500/15 text-green-400 border-green-500/30">
                              PAID
                            </span>
                          </>
                        ) : (
                          <>
                            <p className="font-bold text-yellow-500">
                              ~₦{expectedPerPending.toLocaleString()}
                            </p>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-yellow-500/15 text-yellow-400 border-yellow-500/30">
                              AWAITING ACTIVATION
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          <p className="text-xs text-muted-foreground text-center mt-4">
            Pending estimate assumes today’s activation price of ₦{getActivationAmount().toLocaleString()}
            {isPromoActive() ? " (promo)" : ""} — 20% = ₦{expectedPerPending.toLocaleString()}. Actual commission is
            credited to your wallet the moment the referred user completes their activation.
          </p>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
};

export default InfluencerEarnings;
