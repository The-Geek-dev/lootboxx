import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useJackpot } from "@/hooks/useJackpot";
import { useFakeLeaderboard } from "@/hooks/useFakeLeaderboard";
import { Trophy, ChevronDown, ChevronUp } from "lucide-react";

const JackpotCounter = () => {
  const { jackpotAmount } = useJackpot();
  const { jackpotWinners } = useFakeLeaderboard();
  const [showHistory, setShowHistory] = useState(false);

  return (
    <motion.div
      className="mb-4 rounded-lg bg-gradient-to-r from-yellow-500/10 via-amber-500/15 to-yellow-500/10 border border-yellow-500/20 relative overflow-hidden"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Shimmer effect */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-400/5 to-transparent"
        animate={{ x: ["-100%", "200%"] }}
        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
      />

      <div className="p-3 text-center relative">
        <p className="text-xs text-yellow-400/70 uppercase tracking-wider font-medium mb-0.5">
          🏆 Progressive Jackpot
        </p>
        <motion.p
          className="text-2xl sm:text-3xl font-bold text-yellow-400"
          key={jackpotAmount}
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          ₦{jackpotAmount.toLocaleString()}
        </motion.p>
        <p className="text-[10px] text-muted-foreground mt-0.5">
          2% of every spin contributes • Win it all with a lucky spin!
        </p>

        <button
          onClick={() => setShowHistory(!showHistory)}
          className="mt-2 inline-flex items-center gap-1 text-xs text-yellow-400/80 hover:text-yellow-400 transition-colors"
        >
          <Trophy className="w-3 h-3" />
          Recent Winners
          {showHistory ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
      </div>

      <AnimatePresence>
        {showHistory && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="border-t border-yellow-500/10 px-3 pb-3 pt-2 space-y-1.5">
              {jackpotWinners.slice(0, 5).map((w, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-yellow-400/60">
                      {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : "•"}
                    </span>
                    <span className="text-foreground/80 font-medium">{w.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-yellow-400">₦{w.amount.toLocaleString()}</span>
                    <span className="text-muted-foreground text-[10px] w-16 text-right">{w.timeAgo}</span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default JackpotCounter;
