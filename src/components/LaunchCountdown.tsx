import { useState, useEffect } from "react";
import { Rocket } from "lucide-react";

// Launch at midnight tonight (user's local time)
function getMidnightTonight() {
  const now = new Date();
  const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0);
  return midnight;
}

const LAUNCH_DATE = getMidnightTonight();

const LaunchCountdown = () => {
  const [timeLeft, setTimeLeft] = useState(getTimeLeft());

  function getTimeLeft() {
    const diff = LAUNCH_DATE.getTime() - Date.now();
    if (diff <= 0) return { hours: 0, minutes: 0, seconds: 0, launched: true };
    return {
      hours: Math.floor(diff / (1000 * 60 * 60)),
      minutes: Math.floor((diff / (1000 * 60)) % 60),
      seconds: Math.floor((diff / 1000) % 60),
      launched: false,
    };
  }

  useEffect(() => {
    const interval = setInterval(() => setTimeLeft(getTimeLeft()), 1000);
    return () => clearInterval(interval);
  }, []);

  if (timeLeft.launched) return null;

  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[60] bg-gradient-to-r from-primary/90 via-primary to-accent/90 text-primary-foreground py-2.5 px-4 text-center backdrop-blur-sm border-t border-primary/30">
      <div className="flex items-center justify-center gap-2 flex-wrap">
        <Rocket className="w-4 h-4 animate-bounce" />
        <span className="text-sm font-medium">
          LootBoxx launches in your region in
        </span>
        <div className="flex items-center gap-1 font-mono font-bold text-base">
          <span className="bg-black/20 rounded px-1.5 py-0.5">{pad(timeLeft.hours)}h</span>
          <span>:</span>
          <span className="bg-black/20 rounded px-1.5 py-0.5">{pad(timeLeft.minutes)}m</span>
          <span>:</span>
          <span className="bg-black/20 rounded px-1.5 py-0.5">{pad(timeLeft.seconds)}s</span>
        </div>
        <span className="text-xs opacity-80">— Sign up now to be ready!</span>
      </div>
    </div>
  );
};

export default LaunchCountdown;
