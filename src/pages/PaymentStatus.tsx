import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import Navigation from "@/components/Navigation";
import AppSidebar from "@/components/AppSidebar";
import Footer from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle2, XCircle, Clock, RefreshCw, CreditCard } from "lucide-react";

type Attempt = {
  id: string;
  provider: string;
  reference: string;
  amount: number;
  deposit_type: string | null;
  status: string;
  error_message: string | null;
  created_at: string;
};

const statusMeta: Record<string, { label: string; color: string; icon: any }> = {
  initiated: { label: "Pending", color: "bg-yellow-500/20 text-yellow-600 border-yellow-500/30", icon: Clock },
  confirmed: { label: "Confirmed", color: "bg-green-500/20 text-green-600 border-green-500/30", icon: CheckCircle2 },
  init_failed: { label: "Failed", color: "bg-red-500/20 text-red-600 border-red-500/30", icon: XCircle },
  failed: { label: "Failed", color: "bg-red-500/20 text-red-600 border-red-500/30", icon: XCircle },
};

export default function PaymentStatus() {
  const navigate = useNavigate();
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { navigate("/login"); return; }
    const { data } = await supabase
      .from("payment_attempts")
      .select("*")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false })
      .limit(100);
    setAttempts((data as Attempt[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  return (
    <div className="min-h-screen bg-background flex">
      <AppSidebar />
      <div className="flex-1 flex flex-col">
        <Navigation />
        <main className="flex-1 container mx-auto px-4 py-8 max-w-4xl">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold">Payment Status</h1>
                <p className="text-muted-foreground text-sm">Track every deposit attempt and confirmation.</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={load} disabled={loading}>
                  <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} /> Refresh
                </Button>
                <Button size="sm" onClick={() => navigate("/deposit")}>
                  <CreditCard className="w-4 h-4 mr-2" /> New Deposit
                </Button>
              </div>
            </div>

            {loading ? (
              <p className="text-muted-foreground">Loading…</p>
            ) : attempts.length === 0 ? (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">No payment attempts yet.</p>
              </Card>
            ) : (
              <div className="space-y-3">
                {attempts.map((a) => {
                  const meta = statusMeta[a.status] || statusMeta.initiated;
                  const Icon = meta.icon;
                  return (
                    <Card key={a.id} className="p-4">
                      <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <div className={`p-2 rounded-lg ${meta.color}`}>
                            <Icon className="w-5 h-5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold">₦{Number(a.amount).toLocaleString()}</span>
                              <Badge variant="outline" className="capitalize">{a.provider}</Badge>
                              {a.deposit_type && (
                                <Badge variant="secondary" className="capitalize">{a.deposit_type}</Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1 truncate">Ref: {a.reference}</p>
                            {a.error_message && (
                              <p className="text-xs text-red-500 mt-1">{a.error_message}</p>
                            )}
                            <p className="text-xs text-muted-foreground mt-1">
                              {new Date(a.created_at).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <Badge className={meta.color}>{meta.label}</Badge>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </motion.div>
        </main>
        <Footer />
      </div>
    </div>
  );
}
