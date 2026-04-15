import { motion } from "framer-motion";
import { useJackpot } from "@/hooks/useJackpot";

const JackpotCounter = () => {
  const { jackpotAmount } = useJackpot();

  return (
    <motion.div
      className="mb-4 p-3 rounded-lg bg-gradient-to-r from-yellow-500/10 via-amber-500/15 to-yellow-500/10 border border-yellow-500/20 text-center relative overflow-hidden"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Shimmer effect */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-400/5 to-transparent"
        animate={{ x: ["-100%", "200%"] }}
        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
      />
      
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
    </motion.div>
  );
};

export default JackpotCounter;
