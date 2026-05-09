import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Gift, Sparkles, Loader2, Tv, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

const ADSTERRA_BANNER_KEY = "61b872ff8dc3a8cba392302b8e4f6d06";
const ADSTERRA_BANNER_SRC =
  "https://pl29358616.profitablecpmratenetwork.com/61/b8/72/61b872ff8dc3a8cba392302b8e4f6d06.js";

// Adsterra SocialBar — serves video / interactive ad creatives.
// When triggered it opens its own popup/new tab; we measure dwell time
// off-tab to confirm the user actually watched it.
const ADSTERRA_SOCIAL_BAR_SRC =
  "https://pl29386836.profitablecpmratenetwork.com/a1/e3/4f/a1e34f4c5a7b8011c18d0e08ec0162e6.js";
const ADSTERRA_SOCIAL_BAR_ID = "adsterra-social-bar";

// Minimum off-tab dwell required to count as a watched video ad.
const MIN_WATCH_SECONDS = 15;
// If the popup/tab never opens within this window, abort the attempt.
const ENGAGE_TIMEOUT_MS = 30_000;


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

  // Ad watch state — driven by Adsterra SocialBar (popup/new tab).
  const watchingRef = useRef(false);
  const awayMsRef = useRef(0);
  const lastBlurAtRef = useRef<number | null>(null);
  const engageDeadlineRef = useRef<number | null>(null);
  const [dwellSeconds, setDwellSeconds] = useState(0);

  const ensureSocialBar = () => {
    if (document.getElementById(ADSTERRA_SOCIAL_BAR_ID)) return;
    const s = document.createElement("script");
    s.id = ADSTERRA_SOCIAL_BAR_ID;
    s.src = ADSTERRA_SOCIAL_BAR_SRC;
    s.async = true;
    document.body.appendChild(s);
  };

  const stopWatching = () => {
    watchingRef.current = false;
    setAdWatching(false);
    awayMsRef.current = 0;
    lastBlurAtRef.current = null;
    engageDeadlineRef.current = null;
    setDwellSeconds(0);
  };

  const claimReward = async () => {
    stopWatching();
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

  const startAd = () => {
    if (cooldown > 0 || claiming || adWatching) return;
    ensureSocialBar();
    awayMsRef.current = 0;
    lastBlurAtRef.current = null;
    engageDeadlineRef.current = Date.now() + ENGAGE_TIMEOUT_MS;
    setDwellSeconds(0);
    watchingRef.current = true;
    setAdWatching(true);
    toast({
      title: "Ad starting…",
      description: `Watch the full ad (~${MIN_WATCH_SECONDS}s) to earn your reward.`,
    });
  };

  const cancelAd = (reason: "no-ad" | "too-short") => {
    stopWatching();
    if (reason === "no-ad") {
      toast({
        title: "No ad served",
        description: "Disable any ad-blocker and try again.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Ad closed too early",
        description: `You must watch at least ${MIN_WATCH_SECONDS}s of the ad to earn.`,
        variant: "destructive",
      });
    }
  };

  // Track off-tab dwell while watching. Adsterra SocialBar/Popunder opens
  // a new tab/window — we measure how long the user stayed there.
  useEffect(() => {
    if (!adWatching) return;

    const accumulate = () => {
      if (lastBlurAtRef.current != null) {
        awayMsRef.current += Date.now() - lastBlurAtRef.current;
        lastBlurAtRef.current = null;
      }
    };

    const onHidden = () => {
      // User left tab → ad opened. Clear engage deadline.
      lastBlurAtRef.current = Date.now();
      engageDeadlineRef.current = null;
    };

    const onVisible = () => {
      accumulate();
      const seconds = Math.floor(awayMsRef.current / 1000);
      setDwellSeconds(seconds);
      if (seconds >= MIN_WATCH_SECONDS) {
        claimReward();
      } else if (awayMsRef.current > 0) {
        // They came back early
        cancelAd("too-short");
      }
    };

    const onVisChange = () => {
      if (document.hidden) onHidden();
      else onVisible();
    };

    window.addEventListener("blur", onHidden);
    window.addEventListener("focus", onVisible);
    document.addEventListener("visibilitychange", onVisChange);

    // Watchdog: if user never engages with an ad within ENGAGE_TIMEOUT_MS, abort.
    const watchdog = setInterval(() => {
      if (!watchingRef.current) return;
      // live dwell counter
      let total = awayMsRef.current;
      if (lastBlurAtRef.current != null) total += Date.now() - lastBlurAtRef.current;
      setDwellSeconds(Math.floor(total / 1000));

      if (
        engageDeadlineRef.current != null &&
        Date.now() > engageDeadlineRef.current &&
        awayMsRef.current === 0 &&
        lastBlurAtRef.current == null
      ) {
        cancelAd("no-ad");
      }
    }, 500);

    return () => {
      window.removeEventListener("blur", onHidden);
      window.removeEventListener("focus", onVisible);
      document.removeEventListener("visibilitychange", onVisChange);
      clearInterval(watchdog);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adWatching]);

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
              onClick={startAd}
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

        {/* Watching-ad overlay (Adsterra SocialBar opens its own popup/tab). */}
        <AnimatePresence>
          {adWatching && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-background/90 backdrop-blur-sm flex items-center justify-center p-4"
            >
              <Card className="max-w-md w-full p-6 text-center">
                <Tv className="h-10 w-10 text-primary mx-auto mb-3 animate-pulse" />
                <h2 className="text-xl font-bold mb-2">Watching ad…</h2>
                <p className="text-sm text-muted-foreground mb-4">
                  An ad should open in a new tab/popup. Watch it for at least{" "}
                  <span className="font-semibold text-foreground">{MIN_WATCH_SECONDS}s</span>,
                  then come back here to claim your reward automatically.
                </p>

                <div className="mb-4">
                  <div className="text-3xl font-bold tabular-nums text-primary">
                    {dwellSeconds}s
                    <span className="text-base text-muted-foreground"> / {MIN_WATCH_SECONDS}s</span>
                  </div>
                  <div className="h-2 mt-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all"
                      style={{
                        width: `${Math.min(100, (dwellSeconds / MIN_WATCH_SECONDS) * 100)}%`,
                      }}
                    />
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => stopWatching()}
                  className="w-full"
                >
                  Cancel (no reward)
                </Button>
                <p className="text-[11px] text-muted-foreground mt-3">
                  No ad popup? Disable your ad-blocker, then try again.
                </p>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <Footer />
    </div>
  );
};

export default AdRewards;
