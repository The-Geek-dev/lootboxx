import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Loader2, Sparkles, Globe, MapPin, TrendingUp, Clock, Crown } from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";


type Region = "nigeria" | "global";
type Tier = "regular" | "vip";
type Side = "yes" | "no";

interface Market {
  id: string;
  region: Region;
  tier: Tier;
  currency: "points" | "cash";
  question: string;
  description: string | null;
  category: string | null;
  deadline: string;
  resolved: boolean;
  outcome: "yes" | "no" | "void" | null;
  yes_pool: number;
  no_pool: number;
  total_stakers: number;
}

const fmtTimeLeft = (iso: string) => {
  const ms = new Date(iso).getTime() - Date.now();
  if (ms <= 0) return "Closed";
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  const s = Math.floor((ms % 60_000) / 1000);
  if (h >= 24) return `${Math.floor(h / 24)}d ${h % 24}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m ${s}s`;
};

const useTick = (ms = 1000) => {
  const [, setT] = useState(0);
  useEffect(() => {
    const i = setInterval(() => setT((x) => x + 1), ms);
    return () => clearInterval(i);
  }, [ms]);
};

const MarketCard = ({ market, onStake }: { market: Market; onStake: (m: Market, side: Side, amount: number) => Promise<void> }) => {
  const min = market.currency === "points" ? 20 : 100;
  const [amount, setAmount] = useState<string>(String(min));
  const [busy, setBusy] = useState<Side | null>(null);
  useTick(1000);
  const total = market.yes_pool + market.no_pool;
  const yesPct = total > 0 ? Math.round((market.yes_pool / total) * 100) : 50;
  const noPct = 100 - yesPct;
  const deadlineMs = new Date(market.deadline).getTime();
  const closed = market.resolved || deadlineMs <= Date.now();
  const status: "resolved" | "pending" | "open" = market.resolved
    ? "resolved"
    : deadlineMs <= Date.now()
    ? "pending"
    : "open";

  const submit = async (side: Side) => {
    const amt = parseFloat(amount);
    if (!amt || amt < min) return;
    setBusy(side);
    try {
      await onStake(market, side, amt);
    } finally {
      setBusy(null);
    }
  };

  return (
    <Card className="p-4 space-y-3 bg-card/60 border-border/60 hover:border-primary/40 transition-colors">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            {market.category && (
              <Badge variant="secondary" className="text-[10px]">{market.category}</Badge>
            )}
            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" /> {fmtTimeLeft(market.deadline)}
            </span>
          </div>
          <h3 className="text-sm font-semibold leading-snug">{market.question}</h3>
          {market.description && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{market.description}</p>
          )}
        </div>
      </div>

      {/* Pool bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-[11px]">
          <span className="text-green-500 font-medium">Yes {yesPct}%</span>
          <span className="text-red-500 font-medium">No {noPct}%</span>
        </div>
        <div className="h-1.5 rounded-full overflow-hidden bg-muted/40 flex">
          <div className="bg-green-500" style={{ width: `${yesPct}%` }} />
          <div className="bg-red-500" style={{ width: `${noPct}%` }} />
        </div>
        <p className="text-[10px] text-muted-foreground">
          Pool: {market.currency === "points" ? `${total.toLocaleString()} pts` : `₦${total.toLocaleString()}`} · {market.total_stakers} stakers
        </p>
      </div>

      {closed ? (
        <div className="text-center py-2 text-xs">
          {market.resolved ? (
            <span className="font-bold">
              Resolved:{" "}
              <span className={market.outcome === "yes" ? "text-green-500" : market.outcome === "no" ? "text-red-500" : "text-muted-foreground"}>
                {market.outcome?.toUpperCase()}
              </span>
            </span>
          ) : (
            <span className="text-muted-foreground">Awaiting resolution…</span>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          <Input
            type="number"
            min={min}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder={`Min ${min} ${market.currency === "points" ? "pts" : "₦"}`}
            className="h-9 text-sm"
          />
          <div className="grid grid-cols-2 gap-2">
            <Button
              size="sm"
              variant="outline"
              className="border-green-500/50 text-green-500 hover:bg-green-500/10 hover:text-green-400"
              disabled={!!busy}
              onClick={() => submit("yes")}
            >
              {busy === "yes" ? <Loader2 className="h-3 w-3 animate-spin" /> : "Stake YES"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="border-red-500/50 text-red-500 hover:bg-red-500/10 hover:text-red-400"
              disabled={!!busy}
              onClick={() => submit("no")}
            >
              {busy === "no" ? <Loader2 className="h-3 w-3 animate-spin" /> : "Stake NO"}
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
};

const Predictions = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [authChecked, setAuthChecked] = useState(false);
  const [authed, setAuthed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [markets, setMarkets] = useState<Market[]>([]);
  const [region, setRegion] = useState<Region>("nigeria");
  const [tier, setTier] = useState<Tier>("regular");
  const [wallet, setWallet] = useState<{ points: number; balance: number }>({ points: 0, balance: 0 });
  const refetchWallet = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const { data } = await supabase.from("user_wallets").select("points, balance").eq("user_id", session.user.id).maybeSingle();
    if (data) setWallet({ points: Number(data.points ?? 0), balance: Number(data.balance ?? 0) });
  };
  useEffect(() => { if (authed) refetchWallet(); }, [authed]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/login?redirect=/predictions");
      } else {
        setAuthed(true);
      }
      setAuthChecked(true);
    });
  }, [navigate]);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("prediction_markets")
      .select("*")
      .order("deadline", { ascending: true })
      .limit(200);
    setMarkets((data ?? []) as Market[]);
    setLoading(false);
  };

  useEffect(() => {
    if (!authed) return;
    load();
    const ch = supabase
      .channel("prediction_markets_live")
      .on("postgres_changes", { event: "*", schema: "public", table: "prediction_markets" }, load)
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [authed]);

  const filtered = useMemo(
    () =>
      markets.filter((m) => m.region === region && m.tier === tier && (!m.resolved || (Date.now() - new Date(m.deadline).getTime()) < 24 * 3600_000)),
    [markets, region, tier]
  );

  const handleStake = async (m: Market, side: Side, amount: number) => {
    if (m.currency === "cash" && (wallet?.balance ?? 0) < amount) {
      toast({ title: "Insufficient balance", description: "Top up to stake on VIP markets.", variant: "destructive" });
      return;
    }
    if (m.currency === "points" && (wallet?.points ?? 0) < amount) {
      toast({ title: "Not enough points", description: "Earn or convert points first.", variant: "destructive" });
      return;
    }
    const { error } = await supabase.rpc("place_prediction_stake", {
      p_market_id: m.id,
      p_side: side,
      p_amount: amount,
    });
    if (error) {
      toast({ title: "Stake failed", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Stake placed!", description: `${amount} ${m.currency === "points" ? "pts" : "₦"} on ${side.toUpperCase()}` });
    refetchWallet();
    load();
  };

  if (!authChecked) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-4 py-6 max-w-4xl">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-5">
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center justify-center gap-2">
            <TrendingUp className="h-6 w-6 text-primary" />
            <span className="text-gradient">Predict</span> & Win
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Real Nigeria & global events. Refreshed every 12 hours. Pool-split payouts.
          </p>
        </motion.div>

        {/* Wallet snapshot — 2 cols on mobile */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <Card className="p-3 text-center">
            <p className="text-[10px] text-muted-foreground uppercase">Points</p>
            <p className="text-xl font-bold text-primary">{(wallet?.points ?? 0).toLocaleString()}</p>
          </Card>
          <Card className="p-3 text-center">
            <p className="text-[10px] text-muted-foreground uppercase">Balance</p>
            <p className="text-xl font-bold text-green-500">₦{(wallet?.balance ?? 0).toLocaleString()}</p>
          </Card>
        </div>

        {/* Region tabs */}
        <Tabs value={region} onValueChange={(v) => setRegion(v as Region)} className="mb-3">
          <TabsList className="w-full grid grid-cols-2">
            <TabsTrigger value="nigeria" className="gap-1.5"><MapPin className="h-3.5 w-3.5" /> Nigeria</TabsTrigger>
            <TabsTrigger value="global" className="gap-1.5"><Globe className="h-3.5 w-3.5" /> Global</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Tier tabs */}
        <Tabs value={tier} onValueChange={(v) => setTier(v as Tier)} className="mb-4">
          <TabsList className="w-full grid grid-cols-2">
            <TabsTrigger value="regular" className="gap-1.5"><Sparkles className="h-3.5 w-3.5" /> Regular (Points)</TabsTrigger>
            <TabsTrigger value="vip" className="gap-1.5"><Crown className="h-3.5 w-3.5 text-amber-400" /> VIP (Cash)</TabsTrigger>
          </TabsList>
          <TabsContent value="regular" className="mt-1">
            <p className="text-[11px] text-muted-foreground text-center">Stake points (min 20). Win the losing pool, paid in points.</p>
          </TabsContent>
          <TabsContent value="vip" className="mt-1">
            <p className="text-[11px] text-amber-400/80 text-center">Stake real ₦ from your balance (min ₦100). Winnings go straight to your withdrawable balance.</p>
          </TabsContent>
        </Tabs>

        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <Card className="p-8 text-center text-sm text-muted-foreground">
            No markets yet — fresh ones drop every 12 hours.
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {filtered.map((m) => (
              <MarketCard key={m.id} market={m} onStake={handleStake} />
            ))}
          </div>
        )}

        <p className="text-center text-[10px] text-muted-foreground mt-6">
          Outcomes auto-resolved hourly after deadline. <Link to="/transactions" className="underline">View history</Link>
        </p>
      </main>
      <Footer />
    </div>
  );
};

export default Predictions;
