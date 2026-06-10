import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import AppSidebar from "@/components/AppSidebar";
import Footer from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles, TrendingUp, Clock, CheckCircle2, Users } from "lucide-react";

type ReferralRow = {
  id: string;
  referred_id: string | null;
  referral_code: string;
  bonus_amount: number;
  status: string;
  activation_bonus_awarded: boolean;
  created_at: string;
};

const InfluencerEarnings = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isInfluencer, setIsInfluencer] = useState(false);
  const [rows, setRows] = useState<ReferralRow[]>([]);

  useEffect(() => {
    const run = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/login"); return; }

      const [{ data: roles }, { data: refs }] = await Promise.all([
        supabase.from("user_roles").select("role").eq("user_id", session.user.id),
        supabase
          .from("referrals")
          .select("id, referred_id, referral_code, bonus_amount, status, activation_bonus_awarded, created_at")
          .eq("referrer_id", session.user.id)
          .order("created_at", { ascending: false }),
      ]);

      setIsInfluencer((roles || []).some((r: any) => r.role === "influencer"));
      setRows((refs as ReferralRow[]) || []);
      setLoading(false);
    };
    run();
  }, [navigate]);

  const paid = rows.filter((r) => r.activation_bonus_awarded);
  const pending = rows.filter((r) => !r.activation_bonus_awarded && r.referred_id);
  const totalPaid = paid.reduce((s, r) => s + Number(r.bonus_amount || 0), 0);
  // For pending, we don't know the future activation amount; show expected min (20% of ₦7,000 = ₦1,400)
  const expectedPerPending = 1400;
  const totalPending = pending.length * expectedPerPending;
  const totalSignups = rows.filter((r) => r.referred_id).length;

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

          <div className="grid grid-cols-2 gap-3 mb-6">
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
              <p className="text-xl sm:text-2xl font-bold text-primary">{totalSignups}</p>
            </Card>
          </div>

          <Card className="p-4 sm:p-6 bg-card/50">
            <h3 className="font-semibold mb-4">Commission History</h3>
            {rows.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No referrals yet. Share your code from the Referrals page to start earning.
              </p>
            ) : (
              <div className="space-y-2">
                {rows.map((r) => {
                  const signedUp = !!r.referred_id;
                  const isPaid = r.activation_bonus_awarded;
                  return (
                    <div
                      key={r.id}
                      className="flex items-center justify-between gap-3 p-3 rounded-lg border border-border/40 bg-background/40"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">
                          {signedUp ? `Referred user ${r.referred_id?.slice(0, 8)}…` : "Unclaimed code"}
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
                        ) : signedUp ? (
                          <>
                            <p className="font-bold text-yellow-500">Pending</p>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-yellow-500/15 text-yellow-400 border-yellow-500/30">
                              AWAITING ACTIVATION
                            </span>
                          </>
                        ) : (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-muted text-muted-foreground border-border">
                            NOT SIGNED UP
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          <p className="text-xs text-muted-foreground text-center mt-4">
            Pending estimate assumes the standard ₦7,000 activation (20% = ₦1,400). Actual commission is
            credited to your wallet the moment the referred user completes their first activation.
          </p>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
};

export default InfluencerEarnings;
