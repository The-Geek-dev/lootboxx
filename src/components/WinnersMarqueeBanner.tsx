import { useFakeLeaderboard } from "@/hooks/useFakeLeaderboard";
import { Trophy } from "lucide-react";

const WinnersMarqueeBanner = () => {
  const { jackpotWinners } = useFakeLeaderboard();

  if (jackpotWinners.length === 0) return null;

  const items = [...jackpotWinners, ...jackpotWinners]; // duplicate for seamless loop

  return (
    <div className="mb-4 rounded-lg bg-gradient-to-r from-yellow-500/10 via-amber-500/5 to-yellow-500/10 border border-yellow-500/15 overflow-hidden relative">
      <div className="flex items-center gap-2 px-3 py-1.5">
        <Trophy className="w-3.5 h-3.5 text-yellow-400 shrink-0" />
        <span className="text-[10px] uppercase tracking-wider text-yellow-400/70 font-semibold shrink-0">Winners</span>
        <div className="overflow-hidden flex-1 relative">
          <div className="flex gap-6 animate-marquee-scroll whitespace-nowrap">
            {items.map((w, i) => (
              <span key={i} className="inline-flex items-center gap-1.5 text-xs">
                <span className="text-foreground/80 font-medium">{w.name}</span>
                <span className="text-yellow-400 font-bold">₦{w.amount.toLocaleString()}</span>
                <span className="text-muted-foreground text-[10px]">{w.timeAgo}</span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WinnersMarqueeBanner;
