import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import AppSidebar from "@/components/AppSidebar";
import Footer from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useDepositGate } from "@/hooks/useDepositGate";
import { ArrowDownCircle, ArrowUpCircle, Gift, Gamepad2, Filter } from "lucide-react";

type Transaction = {
  id: string;
  type: "deposit" | "bonus" | "game_win" | "game_loss";
  amount: number;
  description: string;
  created_at: string;
};

const TransactionHistory = () => {
  const navigate = useNavigate();
  const { isAuthorized, isChecking } = useDepositGate();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    const fetchAll = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/login"); return; }
      const userId = session.user.id;

      const [depositsRes, gamesRes] = await Promise.all([
        supabase.from("deposits").select("*").eq("user_id", userId).eq("status", "completed").order("created_at", { ascending: false }),
        supabase.from("game_results").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
      ]);

      const txs: Transaction[] = [];

      (depositsRes.data || []).forEach((d) => {
        txs.push({
          id: d.id,
          type: "deposit",
          amount: Number(d.amount),
          description: `Deposit (${d.payment_reference || "N/A"})`,
          created_at: d.created_at,
        });
      });

      (gamesRes.data || []).forEach((g) => {
        const gameLabels: Record<string, string> = {
          spin_wheel: "Spin the Wheel",
          slots: "Lucky Slots",
          trivia: "Trivia Quiz",
          raffle: "Raffle Draw",
        };
        const label = gameLabels[g.game_type] || g.game_type;
        if (Number(g.win_amount) > 0) {
          txs.push({
            id: g.id + "-win",
            type: "game_win",
            amount: Number(g.win_amount),
            description: `Won at ${label}`,
            created_at: g.created_at,
          });
        }
        if (Number(g.bet_amount) > 0) {
          txs.push({
            id: g.id + "-bet",
            type: "game_loss",
            amount: Number(g.bet_amount),
            description: `Bet on ${label}`,
            created_at: g.created_at,
          });
        }
      });

      txs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setTransactions(txs);
      setLoading(false);
    };

    fetchAll();
  }, [navigate]);

  if (!isAuthorized || isChecking) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
        <p className="text-muted-foreground">Checking access...</p>
      </div>
    </div>
  );

  const filtered = filter === "all" ? transactions : transactions.filter((t) => t.type === filter);

  const getIcon = (type: string) => {
    switch (type) {
      case "deposit": return <ArrowDownCircle className="w-5 h-5 text-primary" />;
      case "bonus": return <Gift className="w-5 h-5 text-primary" />;
      case "game_win": return <ArrowUpCircle className="w-5 h-5 text-green-500" />;
      case "game_loss": return <Gamepad2 className="w-5 h-5 text-destructive" />;
      default: return null;
    }
  };

  const getAmountColor = (type: string) => {
    if (type === "game_loss") return "text-destructive";
    return "text-green-500";
  };

  const filters = [
    { key: "all", label: "All" },
    { key: "deposit", label: "Deposits" },
    { key: "game_win", label: "Wins" },
    { key: "game_loss", label: "Bets" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <AppSidebar />
      <main className="md:pl-16 container px-4 pt-32 pb-16 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl sm:text-4xl font-bold text-center mb-2">
            Transaction <span className="text-gradient">History</span>
          </h1>
          <p className="text-muted-foreground text-center mb-8">All your deposits, winnings, and game activity</p>

          <div className="flex gap-2 mb-6 flex-wrap justify-center">
            {filters.map((f) => (
              <Button
                key={f.key}
                size="sm"
                variant={filter === f.key ? "default" : "outline"}
                onClick={() => setFilter(f.key)}
                className={filter === f.key ? "button-gradient" : ""}
              >
                {f.label}
              </Button>
            ))}
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-48">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
            </div>
          ) : filtered.length === 0 ? (
            <Card className="glass p-8 text-center text-muted-foreground">
              No transactions found.
            </Card>
          ) : (
            <div className="space-y-3">
              {filtered.map((tx) => {
                const isPoints = tx.type === "game_loss";
                const sign = isPoints ? "-" : "+";
                const value = isPoints
                  ? `${sign}${tx.amount.toLocaleString()}`
                  : `${sign}₦${tx.amount.toLocaleString()}`;
                return (
                  <Card key={tx.id} className="glass p-4 flex items-center gap-4">
                    <div className="shrink-0">{getIcon(tx.type)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium truncate">{tx.description}</p>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            isPoints
                              ? "bg-primary/15 text-primary border-primary/30"
                              : "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                          }`}
                          aria-label={isPoints ? "Points" : "Naira"}
                        >
                          {isPoints ? "PTS" : "₦ NGN"}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {new Date(tx.created_at).toLocaleDateString("en-NG", {
                          year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
                        })}
                      </p>
                    </div>
                    <div className="text-right whitespace-nowrap">
                      <p className={`font-bold ${getAmountColor(tx.type)}`}>{value}</p>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                        {isPoints ? "points" : "naira"}
                      </p>
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
  );
};

export default TransactionHistory;
