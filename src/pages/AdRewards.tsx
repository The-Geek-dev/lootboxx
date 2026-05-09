import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Gift, Sparkles, Loader2, Tv, Clock, Volume2, VolumeX, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

const ADSTERRA_BANNER_KEY = "61b872ff8dc3a8cba392302b8e4f6d06";
const ADSTERRA_BANNER_SRC =
  "https://pl29358616.profitablecpmratenetwork.com/61/b8/72/61b872ff8dc3a8cba392302b8e4f6d06.js";

// Pool of real video ad creatives (publicly hosted short clips).
// You can swap these with your own VAST/IMA-tagged creatives later.
const VIDEO_AD_POOL = [
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4",
];


interface ClaimResult {
  success: boolean;
  reason?: string;
  seconds_left?: number;
  points_reward?: number;
  cash_reward?: number;
  won_cash?: boolean;
  cooldown_seconds?: number;
}

const MAX_COOLDOWN = 60;

const CircularCountdown = ({ seconds }: { seconds: number }) => {
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.max(0, Math.min(1, seconds / MAX_COOLDOWN));
  const offset = circumference * (1 - progress);
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const label = mins > 0 ? `${mins}m ${secs.toString().padStart(2, "0")}s` : `${secs}s`;

  return (
    <div className="relative w-[120px] h-[120px] mx-auto mb-4 flex items-center justify-center">
      <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 120 120">
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          className="text-muted/20"
        />
        <motion.circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          strokeLinecap="round"
          className="text-primary"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: offset }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.5, ease: "linear" }}
        />
      </svg>
      <div className="relative z-10 flex flex-col items-center justify-center">
        <Clock className="h-5 w-5 text-muted-foreground mb-0.5" />
        <span className="text-xl font-bold tabular-nums">{label}</span>
      </div>
    </div>
  );
};

const AdRewards = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const bannerRef = useRef<HTMLDivElement>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [authed, setAuthed] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [claiming, setClaiming] = useState(false);
  const [lastReward, setLastReward] = useState<ClaimResult | null>(null);
  const [adWatching, setAdWatching] = useState(false);
  const [totalEarned, setTotalEarned] = useState({ points: 0, cash: 0 });

  // Auth gate
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/login?redirect=/ad-rewards");
      } else {
        setAuthed(true);
      }
      setAuthChecked(true);
    });
  }, [navigate]);

  // Banner ad injection (native banner inside the page)
  useEffect(() => {
    if (!authed) return;
    const id = "adsterra-ad-rewards-banner";
    if (document.getElementById(id)) return;
    const s = document.createElement("script");
    s.id = id;
    s.src = ADSTERRA_BANNER_SRC;
    s.async = true;
    bannerRef.current?.appendChild(s);
    return () => {
      document.getElementById(id)?.remove();
    };
  }, [authed]);

  // Cooldown countdown
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  const triggerInterstitial = () => {
    // Inject a fresh popunder/interstitial-style script per claim.
    const s = document.createElement("script");
    s.src = ADSTERRA_INTERSTITIAL_SRC;
    s.async = true;
    s.dataset.cfasync = "false";
    document.body.appendChild(s);
    setTimeout(() => s.remove(), 30_000);
  };

  const handleWatchAndClaim = async () => {
    if (cooldown > 0 || claiming || adWatching) return;
    setAdWatching(true);
    triggerInterstitial();

    // Simulate ad-view duration (5s) before crediting reward
    await new Promise((r) => setTimeout(r, 5000));
    setAdWatching(false);
    setClaiming(true);

    const { data, error } = await supabase.rpc("claim_ad_reward");
    setClaiming(false);

    if (error) {
      toast({ title: "Reward failed", description: error.message, variant: "destructive" });
      return;
    }

    const result = data as unknown as ClaimResult;
    if (!result.success) {
      if (result.reason === "cooldown") {
        setCooldown(result.seconds_left ?? 60);
        toast({ title: "Cooldown active", description: `Wait ${result.seconds_left}s before next ad.` });
      } else {
        toast({ title: "Could not claim", description: result.reason, variant: "destructive" });
      }
      return;
    }

    setLastReward(result);
    setCooldown(result.cooldown_seconds ?? 60);
    setTotalEarned((p) => ({
      points: p.points + (result.points_reward ?? 0),
      cash: p.cash + (result.cash_reward ?? 0),
    }));

    if (result.won_cash) {
      toast({
        title: `🎉 Bonus ₦${result.cash_reward!.toLocaleString()}!`,
        description: `Plus ${result.points_reward} points.`,
      });
    } else {
      toast({
        title: `+${result.points_reward} points`,
        description: "Watch another ad after the cooldown.",
      });
    }
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

      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-6"
        >
          <h1 className="text-3xl sm:text-4xl font-bold mb-2">
            <span className="text-gradient">Ad</span> Rewards
          </h1>
          <p className="text-muted-foreground text-sm">
            Watch a quick ad, get points instantly. Small chance of bonus cash on every view.
          </p>
        </motion.div>

        {/* Earned totals — 2 cols on mobile per layout rule */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <Card className="p-4 text-center">
            <p className="text-xs text-muted-foreground">Session Points</p>
            <p className="text-2xl font-bold text-primary">+{totalEarned.points}</p>
          </Card>
          <Card className="p-4 text-center">
            <p className="text-xs text-muted-foreground">Session Cash</p>
            <p className="text-2xl font-bold text-green-500">
              ₦{totalEarned.cash.toLocaleString()}
            </p>
          </Card>
        </div>

        {/* Native banner ad slot */}
        <Card className="p-4 mb-6 bg-card/40">
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground mb-2 text-center">
            Sponsored
          </p>
          <div
            ref={bannerRef}
            id={`container-${ADSTERRA_BANNER_KEY}`}
            className="min-h-[90px] flex items-center justify-center text-xs text-muted-foreground"
          >
            Loading ad…
          </div>
        </Card>

        {/* Claim CTA */}
        <Card className="p-6 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent pointer-events-none" />
          <div className="relative">
            {cooldown > 0 ? (
              <CircularCountdown seconds={cooldown} />
            ) : (
              <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-primary/15 flex items-center justify-center">
                {adWatching ? (
                  <Tv className="h-8 w-8 text-primary animate-pulse" />
                ) : (
                  <Gift className="h-8 w-8 text-primary" />
                )}
              </div>
            )}

            <p className="text-sm text-muted-foreground mb-1">Reward per ad</p>
            <p className="text-lg font-semibold mb-4">
              5–10 points <span className="text-green-500">+ rare ₦20–₦100 bonus</span>
            </p>

            <Button
              size="lg"
              className="w-full button-gradient text-lg h-14"
              disabled={cooldown > 0 || claiming || adWatching}
              onClick={handleWatchAndClaim}
            >
              {adWatching ? (
                <>
                  <Tv className="mr-2 h-5 w-5 animate-pulse" />
                  Watching ad…
                </>
              ) : claiming ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Claiming…
                </>
              ) : cooldown > 0 ? (
                `Next ad in ${cooldown}s`
              ) : (
                <>
                  <Sparkles className="mr-2 h-5 w-5" />
                  Watch ad & claim
                </>
              )}
            </Button>

            <p className="text-[11px] text-muted-foreground mt-3">
              60-second cooldown between ads. Ads are served by Adsterra.
            </p>
          </div>

          <AnimatePresence>
            {lastReward?.success && (
              <motion.div
                key={lastReward.points_reward + "-" + lastReward.cash_reward}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mt-4 p-3 rounded-lg bg-primary/10 border border-primary/20"
              >
                <p className="text-sm">
                  Last claim:{" "}
                  <span className="font-bold text-primary">
                    +{lastReward.points_reward} pts
                  </span>
                  {lastReward.won_cash && (
                    <span className="font-bold text-green-500">
                      {" "}
                      + ₦{lastReward.cash_reward!.toLocaleString()} bonus 🎉
                    </span>
                  )}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
      </main>

      <Footer />
    </div>
  );
};

export default AdRewards;
