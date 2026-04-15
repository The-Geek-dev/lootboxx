import { motion } from "framer-motion";
import { useEffect, useState } from "react";

interface RoundHistoryProps {
  results: { value: number; won: boolean }[];
  formatValue?: (val: number) => string;
  maxDisplay?: number;
}

const RoundHistory = ({ results, formatValue, maxDisplay = 6 }: RoundHistoryProps) => {
  const display = results.slice(-maxDisplay);
  const format = formatValue || ((v) => `${v.toFixed(2)}x`);

  if (display.length === 0) return null;

  return (
    <div className="flex gap-1.5 justify-center mb-3 overflow-hidden">
      {display.map((r, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, scale: 0.5, x: 20 }}
          animate={{ opacity: 1, scale: 1, x: 0 }}
          transition={{ delay: i * 0.05 }}
          className={`text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-full ${
            r.won
              ? "bg-green-500/20 text-green-400 border border-green-500/30"
              : "bg-red-500/20 text-red-400 border border-red-500/30"
          }`}
        >
          {format(r.value)}
        </motion.span>
      ))}
    </div>
  );
};

export default RoundHistory;
