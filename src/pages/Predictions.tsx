import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Loader2, Sparkles, Globe, MapPin, TrendingUp, Clock, Crown, ListChecks, Trophy, TimerReset, Filter } from "lucide-react";
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
  created_at?: string;
}

interface MyStake {
  id: string;
  market_id: string;
  side: Side;
  amount: number;
  currency: "points" | "cash";
  payout: number;
  settled: boolean;
  created_at: string;
  market: Market | null;
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

// Deterministic seeded baseline + monotonic growth for phantom staker counts.
// Always non-decreasing per market id.
const hashId = (id: string) => {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = (h * 16777619) >>> 0;
  }
  return h;
};
const phantomStakers = (m: Market) => {
  const seed = hashId(m.id);
  const base = 28 + (seed % 140); // 28–167 baseline
  const refMs = m.created_at ? new Date(m.created_at).getTime() : new Date(m.deadline).getTime() - 24 * 3600_000;
  const minutes = Math.max(0, (Date.now() - refMs) / 60000);
  const ratePerMin = 0.04 + ((seed >> 8) % 12) / 100; // 0.04–0.15 per min
  return base + Math.floor(minutes * ratePerMin);
};
const displayStakers = (m: Market) => m.total_stakers + phantomStakers(m);

// Odds & potential payout based on current pools (pari-mutuel).
// Pretend the staker is added to chosen pool; payout = stake + share of opposing pool.
const computePotential = (m: Market, side: Side, stake: number) => {
  const yes = Math.max(m.yes_pool, 0);
  const no = Math.max(m.no_pool, 0);
  const winning = side === "yes" ? yes + stake : no + stake;
  const losing = side === "yes" ? no : yes;
  if (winning <= 0) return stake;
  const payout = stake + (losing * stake) / winning;
  return payout;
};
const computeOdds = (m: Market, side: Side) => {
  // Implied multiplier on a 1-unit stake at current pool (excluding own stake)
  const yes = Math.max(m.yes_pool, 1);
  const no = Math.max(m.no_pool, 1);
  const total = yes + no;
  // payout multiple = total / chosen_pool (pari-mutuel)
  return total / (side === "yes" ? yes : no);
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

  const stakeNum = Math.max(parseFloat(amount) || 0, min);
  const oddsYes = computeOdds(market, "yes");
  const oddsNo = computeOdds(market, "no");
  const potYes = computePotential(market, "yes", stakeNum);
  const potNo = computePotential(market, "no", stakeNum);
  const unit = market.currency === "points" ? "pts" : "₦";

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
          <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
            <Badge
              variant="outline"
              className={
                status === "open"
                  ? "text-[10px] border-green-500/50 text-green-500 bg-green-500/10"
                  : status === "pending"
                  ? "text-[10px] border-amber-500/50 text-amber-500 bg-amber-500/10"
                  : "text-[10px] border-muted-foreground/40 text-muted-foreground"
              }
            >
              <span className={`h-1.5 w-1.5 rounded-full mr-1 ${status === "open" ? "bg-green-500 animate-pulse" : status === "pending" ? "bg-amber-500 animate-pulse" : "bg-muted-foreground"}`} />
              {status === "open" ? "Open" : status === "pending" ? "Awaiting payout" : "Resolved"}
            </Badge>
            {market.category && (
              <Badge variant="secondary" className="text-[10px]">{market.category}</Badge>
            )}
            <span className="text-[10px] text-muted-foreground flex items-center gap-1 ml-auto font-mono">
              <Clock className="h-3 w-3" />
              {status === "open"
                ? fmtTimeLeft(market.deadline)
                : status === "pending"
                ? "Resolving ≤1h"
                : "Closed"}
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
          <span className="text-green-500 font-medium">Yes {yesPct}% · {oddsYes.toFixed(2)}x</span>
          <span className="text-red-500 font-medium">No {noPct}% · {oddsNo.toFixed(2)}x</span>
        </div>
        <div className="h-1.5 rounded-full overflow-hidden bg-muted/40 flex">
          <div className="bg-green-500" style={{ width: `${yesPct}%` }} />
          <div className="bg-red-500" style={{ width: `${noPct}%` }} />
        </div>
        <p className="text-[10px] text-muted-foreground">
          Pool: {market.currency === "points" ? `${total.toLocaleString()} pts` : `₦${total.toLocaleString()}`} · {displayStakers(market).toLocaleString()} stakers
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
            placeholder={`Min ${min} ${unit}`}
            className="h-9 text-sm"
          />
          <div className="grid grid-cols-2 gap-2">
            <Button
              size="sm"
              variant="outline"
              className="border-green-500/50 text-green-500 hover:bg-green-500/10 hover:text-green-400 flex-col h-auto py-1.5"
              disabled={!!busy}
              onClick={() => submit("yes")}
            >
              <span className="text-xs font-semibold">{busy === "yes" ? <Loader2 className="h-3 w-3 animate-spin" /> : "Stake YES"}</span>
              <span className="text-[10px] opacity-80 font-normal">Win ~{unit === "₦" ? "₦" : ""}{Math.round(potYes).toLocaleString()}{unit === "pts" ? " pts" : ""}</span>
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="border-red-500/50 text-red-500 hover:bg-red-500/10 hover:text-red-400 flex-col h-auto py-1.5"
              disabled={!!busy}
              onClick={() => submit("no")}
            >
              <span className="text-xs font-semibold">{busy === "no" ? <Loader2 className="h-3 w-3 animate-spin" /> : "Stake NO"}</span>
              <span className="text-[10px] opacity-80 font-normal">Win ~{unit === "₦" ? "₦" : ""}{Math.round(potNo).toLocaleString()}{unit === "pts" ? " pts" : ""}</span>
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
};

const getStakeStatus = (stake: MyStake): "open" | "pending" | "won" | "lost" | "void" => {
  const m = stake.market;
  if (!m) return "void";
  if (m.resolved) {
    if (m.outcome === "void") return "void";
    return m.outcome === stake.side ? "won" : "lost";
  }
  if (new Date(m.deadline).getTime() <= Date.now()) return "pending";
  return "open";
};

const MyStakeCard = ({
  stake,
  onIncrease,
}: {
  stake: MyStake;
  onIncrease: (stake: MyStake, addAmount: number) => Promise<void>;
}) => {
  useTick(1000);
  const status = getStakeStatus(stake);
  const m = stake.market;
  const unit = stake.currency === "points" ? "pts" : "₦";
  const potential = m ? computePotential(m, stake.side, stake.amount) : stake.amount;
  const deadlineMs = m ? new Date(m.deadline).getTime() : 0;
  const minAdd = stake.currency === "points" ? 20 : 100;
  const [addAmt, setAddAmt] = useState<string>(String(minAdd));
  const [busy, setBusy] = useState(false);
  const quickAdds = stake.currency === "points" ? [50, 100, 250, 500] : [100, 250, 500, 1000];
  const submitIncrease = async (override?: number) => {
    const amt = override ?? parseFloat(addAmt);
    if (!amt || amt < minAdd) return;
    setBusy(true);
    try {
      await onIncrease(stake, amt);
    } finally {
      setBusy(false);
    }
  };

  const statusMeta = {
    open: { label: "Open", cls: "border-green-500/50 text-green-500 bg-green-500/10" },
    pending: { label: "Awaiting payout", cls: "border-amber-500/50 text-amber-500 bg-amber-500/10" },
    won: { label: "Won", cls: "border-green-500/50 text-green-400 bg-green-500/10" },
    lost: { label: "Lost", cls: "border-red-500/50 text-red-500 bg-red-500/10" },
    void: { label: "Refunded", cls: "border-muted-foreground/40 text-muted-foreground" },
  }[status];

  return (
    <Card className="p-4 space-y-3 bg-card/60 border-border/60">
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-sm font-semibold leading-snug flex-1">
          {m?.question ?? "Market unavailable"}
        </h3>
        <Badge variant="outline" className={`text-[10px] ${statusMeta.cls}`}>{statusMeta.label}</Badge>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="rounded-md bg-muted/30 p-2">
          <p className="text-[9px] text-muted-foreground uppercase">Side</p>
          <p className={`text-sm font-bold ${stake.side === "yes" ? "text-green-500" : "text-red-500"}`}>
            {stake.side.toUpperCase()}
          </p>
        </div>
        <div className="rounded-md bg-muted/30 p-2">
          <p className="text-[9px] text-muted-foreground uppercase">Stake</p>
          <p className="text-sm font-bold">
            {unit === "₦" ? "₦" : ""}{stake.amount.toLocaleString()}{unit === "pts" ? " pts" : ""}
          </p>
        </div>
        <div className="rounded-md bg-muted/30 p-2">
          <p className="text-[9px] text-muted-foreground uppercase">
            {status === "won" || status === "lost" || status === "void" ? "Payout" : "Potential"}
          </p>
          <p className="text-sm font-bold text-primary">
            {unit === "₦" ? "₦" : ""}
            {Math.round(stake.settled ? stake.payout : potential).toLocaleString()}
            {unit === "pts" ? " pts" : ""}
          </p>
        </div>
      </div>

      {/* Payout math breakdown */}
      {m && (() => {
        const fmt = (n: number) =>
          `${unit === "₦" ? "₦" : ""}${Math.round(n).toLocaleString()}${unit === "pts" ? " pts" : ""}`;
        const yourSidePool = stake.side === "yes" ? m.yes_pool : m.no_pool;
        const oppSidePool = stake.side === "yes" ? m.no_pool : m.yes_pool;
        const winningSide: "yes" | "no" | null = m.resolved
          ? m.outcome === "yes" || m.outcome === "no"
            ? m.outcome
            : null
          : m.yes_pool === m.no_pool
          ? null
          : m.yes_pool > m.no_pool
          ? "yes"
          : "no";
        const sharePct = yourSidePool > 0 ? (stake.amount / yourSidePool) * 100 : 0;
        const projectedWinnings = oppSidePool * (stake.amount / Math.max(yourSidePool, 1));
        return (
          <div className="rounded-md border border-border/60 bg-muted/20 p-2.5 space-y-1.5">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold flex items-center gap-1">
              <Sparkles className="h-3 w-3" /> Payout math
            </p>
            <div className="grid grid-cols-2 gap-1 text-[11px]">
              <span className="text-muted-foreground">YES pool</span>
              <span className="text-right font-mono text-green-500">{fmt(m.yes_pool)}</span>
              <span className="text-muted-foreground">NO pool</span>
              <span className="text-right font-mono text-red-500">{fmt(m.no_pool)}</span>
              <span className="text-muted-foreground">
                {m.resolved ? "Winning side" : "Currently leading"}
              </span>
              <span className={`text-right font-mono font-semibold ${winningSide === "yes" ? "text-green-500" : winningSide === "no" ? "text-red-500" : "text-muted-foreground"}`}>
                {winningSide ? winningSide.toUpperCase() : "TIED"}
              </span>
              <span className="text-muted-foreground">Your share of {stake.side.toUpperCase()}</span>
              <span className="text-right font-mono">{sharePct.toFixed(2)}%</span>
            </div>
            <div className="border-t border-border/60 pt-1.5 mt-1 text-[11px] space-y-1">
              {stake.settled ? (
                <>
                  <p className="font-mono text-[10px] text-muted-foreground leading-snug">
                    payout = stake + (opposing pool × your share)
                  </p>
                  <p className="font-mono text-[11px]">
                    = {fmt(stake.amount)} + ({fmt(oppSidePool)} × {sharePct.toFixed(2)}%)
                  </p>
                  <p className="font-mono text-[11px] font-bold text-primary">
                    = {fmt(stake.payout)}
                  </p>
                </>
              ) : (
                <>
                  <p className="font-mono text-[10px] text-muted-foreground leading-snug">
                    if {stake.side.toUpperCase()} wins → stake + share of NO pool
                  </p>
                  <p className="font-mono text-[11px]">
                    = {fmt(stake.amount)} + {fmt(projectedWinnings)} = <span className="font-bold text-primary">{fmt(stake.amount + projectedWinnings)}</span>
                  </p>
                  <p className="font-mono text-[10px] text-red-400/80">
                    if {stake.side === "yes" ? "NO" : "YES"} wins → lose {fmt(stake.amount)}
                  </p>
                </>
              )}
            </div>
          </div>
        );
      })()}

      {m && status === "open" && (
        <>
          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1"><TimerReset className="h-3 w-3" /> Matures in</span>
            <span className="font-mono text-foreground">{fmtTimeLeft(m.deadline)}</span>
          </div>
          <div className="rounded-md border border-primary/30 bg-primary/5 p-2.5 space-y-2">
            <p className="text-[10px] uppercase tracking-wide text-primary font-semibold">
              Increase stake on {stake.side.toUpperCase()}
            </p>
            <div className="flex gap-2">
              <Input
                type="number"
                min={minAdd}
                value={addAmt}
                onChange={(e) => setAddAmt(e.target.value)}
                placeholder={`Min ${minAdd} ${unit}`}
                className="h-9 text-sm flex-1"
              />
              <Button
                size="sm"
                className="h-9"
                disabled={busy}
                onClick={() => submitIncrease()}
              >
                {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Add"}
              </Button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {quickAdds.map((q) => (
                <button
                  key={q}
                  type="button"
                  disabled={busy}
                  onClick={() => submitIncrease(q)}
                  className="text-[11px] px-2 py-1 rounded-full border border-primary/40 bg-primary/10 text-primary hover:bg-primary/20 disabled:opacity-50 transition-colors font-mono"
                >
                  +{unit === "₦" ? "₦" : ""}{q.toLocaleString()}{unit === "pts" ? " pts" : ""}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
      {m && status === "pending" && (
        <p className="text-[11px] text-amber-400 text-center">Resolving within 1 hour…</p>
      )}
      {m && (status === "won" || status === "lost" || status === "void") && (
        <p className="text-[11px] text-muted-foreground text-center">
          Outcome: <span className="font-semibold text-foreground">{m.outcome?.toUpperCase() ?? "—"}</span>
        </p>
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
  const [myStakes, setMyStakes] = useState<MyStake[]>([]);
  const [view, setView] = useState<"markets" | "mine">("markets");
  const [stakeFilter, setStakeFilter] = useState<"all" | "open" | "pending" | "won" | "lost">("all");
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

  const loadMyStakes = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const { data } = await supabase
      .from("prediction_stakes")
      .select("id, market_id, side, amount, currency, payout, settled, created_at, market:prediction_markets(*)")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false })
      .limit(200);
    setMyStakes((data ?? []) as any);
  };

  useEffect(() => {
    if (!authed) return;
    load();
    loadMyStakes();
    const ch = supabase
      .channel("prediction_markets_live")
      .on("postgres_changes", { event: "*", schema: "public", table: "prediction_markets" }, () => { load(); loadMyStakes(); })
      .on("postgres_changes", { event: "*", schema: "public", table: "prediction_stakes" }, loadMyStakes)
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [authed]);

  const stakedMarketIds = useMemo(
    () => new Set(myStakes.map((s) => s.market_id)),
    [myStakes]
  );

  const filtered = useMemo(
    () =>
      markets.filter(
        (m) =>
          m.region === region &&
          m.tier === tier &&
          !stakedMarketIds.has(m.id) &&
          (!m.resolved || (Date.now() - new Date(m.deadline).getTime()) < 24 * 3600_000)
      ),
    [markets, region, tier, stakedMarketIds]
  );

  const sortedStakes = useMemo(() => {
    // Aggregate top-ups: same (market_id, side) → sum amount & payout, keep latest id/created_at
    const grouped = new Map<string, MyStake>();
    for (const s of myStakes) {
      const key = `${s.market_id}::${s.side}`;
      const prev = grouped.get(key);
      if (!prev) {
        grouped.set(key, { ...s });
      } else {
        grouped.set(key, {
          ...prev,
          amount: prev.amount + s.amount,
          payout: prev.payout + s.payout,
          settled: prev.settled && s.settled,
          created_at: prev.created_at > s.created_at ? prev.created_at : s.created_at,
        });
      }
    }
    const rank = (s: MyStake) => {
      const m = s.market;
      if (!m) return 4;
      if (m.resolved) return 3;
      if (new Date(m.deadline).getTime() <= Date.now()) return 2;
      return 1;
    };
    let arr = [...grouped.values()].sort((a, b) => rank(a) - rank(b) || (b.created_at.localeCompare(a.created_at)));
    if (stakeFilter !== "all") {
      arr = arr.filter((s) => getStakeStatus(s) === stakeFilter);
    }
    return arr;
  }, [myStakes, stakeFilter]);

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
    // Optimistic: insert a synthetic stake row so totals update instantly
    const optimistic: MyStake = {
      id: `optimistic-${Date.now()}`,
      market_id: m.id,
      side,
      amount,
      currency: m.currency,
      payout: 0,
      settled: false,
      created_at: new Date().toISOString(),
      market: { ...m, [side === "yes" ? "yes_pool" : "no_pool"]: (side === "yes" ? m.yes_pool : m.no_pool) + amount } as Market,
    };
    setMyStakes((prev) => [optimistic, ...prev]);
    setMarkets((prev) =>
      prev.map((mm) =>
        mm.id === m.id
          ? { ...mm, [side === "yes" ? "yes_pool" : "no_pool"]: (side === "yes" ? mm.yes_pool : mm.no_pool) + amount }
          : mm,
      ),
    );
    setWallet((w) =>
      m.currency === "points"
        ? { ...w, points: Math.max(0, w.points - amount) }
        : { ...w, balance: Math.max(0, w.balance - amount) },
    );
    refetchWallet();
    load();
    loadMyStakes();
  };

  const handleIncrease = async (stake: MyStake, amount: number) => {
    if (!stake.market) return;
    await handleStake(stake.market, stake.side, amount);
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

        {/* Top-level: Markets vs My Stakes */}
        <Tabs value={view} onValueChange={(v) => setView(v as any)} className="mb-4">
          <TabsList className="w-full grid grid-cols-2">
            <TabsTrigger value="markets" className="gap-1.5">
              <Trophy className="h-3.5 w-3.5" /> Markets
            </TabsTrigger>
            <TabsTrigger value="mine" className="gap-1.5">
              <ListChecks className="h-3.5 w-3.5" /> My Stakes
              {myStakes.length > 0 && (
                <span className="ml-1 text-[10px] px-1.5 rounded-full bg-primary/20 text-primary">
                  {myStakes.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {view === "markets" ? (
          <>
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
          </>
        ) : (
          <>
            {/* My Stakes filters */}
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <Filter className="h-3.5 w-3.5 text-muted-foreground" />
              {(["all", "open", "pending", "won", "lost"] as const).map((f) => {
                const count = f === "all" ? myStakes.length : myStakes.filter((s) => getStakeStatus(s) === f).length;
                const active = stakeFilter === f;
                return (
                  <button
                    key={f}
                    onClick={() => setStakeFilter(f)}
                    className={`text-[11px] px-2.5 py-1 rounded-full border transition-colors ${
                      active
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-muted/40 text-muted-foreground border-border hover:bg-muted/60"
                    }`}
                  >
                    {f === "all" ? "All" : f === "open" ? "Open" : f === "pending" ? "Pending" : f === "won" ? "Won" : "Lost"}
                    <span className={`ml-1 ${active ? "text-primary-foreground/80" : "text-muted-foreground/70"}`}>{count}</span>
                  </button>
                );
              })}
            </div>
            {sortedStakes.length === 0 ? (
              <Card className="p-8 text-center text-sm text-muted-foreground">
                {stakeFilter === "all" ? (
                  <>You haven't placed any predictions yet. Head to <button className="underline text-primary" onClick={() => setView("markets")}>Markets</button> to start.</>
                ) : (
                  <>No <span className="text-foreground font-medium">{stakeFilter}</span> stakes found.</>
                )}
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {sortedStakes.map((s) => (
                  <MyStakeCard key={s.id} stake={s} onIncrease={handleIncrease} />
                ))}
              </div>
            )}
          </>
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
