import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

interface BetControlsProps {
  onPlay: () => void;
  disabled?: boolean;
  isPlaying?: boolean;
  playLabel?: string;
  disabledLabel?: string;
  onCashOut?: () => void;
  cashOutLabel?: string;
  showCashOut?: boolean;
  pointCost: number;
  xpLives: number;
}

const BetControls = ({
  onPlay,
  disabled = false,
  isPlaying = false,
  playLabel,
  disabledLabel = "No XP Lives",
  onCashOut,
  cashOutLabel,
  showCashOut = false,
  pointCost,
  xpLives,
}: BetControlsProps) => {
  if (showCashOut && onCashOut) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Button
          className="w-full py-6 text-lg font-bold bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-600/30"
          onClick={onCashOut}
        >
          💰 {cashOutLabel || "Cash Out"}
        </Button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Button
        className="w-full py-5 text-lg font-bold bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg shadow-primary/20"
        onClick={onPlay}
        disabled={disabled || isPlaying || xpLives <= 0}
      >
        {xpLives <= 0
          ? disabledLabel
          : isPlaying
          ? "Playing..."
          : playLabel || `BET ${pointCost} pts`}
      </Button>
    </motion.div>
  );
};

export default BetControls;
