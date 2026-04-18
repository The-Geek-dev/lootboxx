import { motion } from "framer-motion";
import { useEffect, useRef } from "react";

// Background images by engine type
import crashSpace from "@/assets/game-bg/crash-space.jpg";
import raceCity from "@/assets/game-bg/race-city.jpg";
import slotsCasino from "@/assets/game-bg/slots-casino.jpg";
import cardsTable from "@/assets/game-bg/cards-table.jpg";
import sportsArena from "@/assets/game-bg/sports-arena.jpg";
import minesCave from "@/assets/game-bg/mines-cave.jpg";
import wheelFortune from "@/assets/game-bg/wheel-fortune.jpg";
import towerClimb from "@/assets/game-bg/tower-climb.jpg";
import coinFlip from "@/assets/game-bg/coin-flip.jpg";
import scratchLottery from "@/assets/game-bg/scratch-lottery.jpg";
import arcadeRetro from "@/assets/game-bg/arcade-retro.jpg";
import diceTable from "@/assets/game-bg/dice-table.jpg";

export type GameBgType = 
  | "crash" | "race" | "slots" | "cards" | "sports" 
  | "mines" | "wheel" | "tower" | "coinflip" | "scratch" 
  | "arcade" | "dice" | "lottery" | "instant" | "reaction"
  | "match3" | "numberpick" | "highlow" | "catcher" | "quickmath"
  | "plinko" | "roulette" | "keno" | "memory" | "rps";

const bgMap: Record<string, string> = {
  crash: crashSpace,
  race: raceCity,
  slots: slotsCasino,
  cards: cardsTable,
  sports: sportsArena,
  mines: minesCave,
  wheel: wheelFortune,
  tower: towerClimb,
  coinflip: coinFlip,
  scratch: scratchLottery,
  arcade: arcadeRetro,
  dice: diceTable,
  lottery: scratchLottery,
  instant: coinFlip,
  reaction: arcadeRetro,
  match3: arcadeRetro,
  numberpick: scratchLottery,
  highlow: cardsTable,
  catcher: arcadeRetro,
  quickmath: arcadeRetro,
  quickword: arcadeRetro,
  quickcolor: arcadeRetro,
  plinko: towerClimb,
  roulette: cardsTable,
  keno: scratchLottery,
  memory: arcadeRetro,
  rps: arcadeRetro,
};

interface ParticleConfig {
  color: string;
  count: number;
  speed: "slow" | "medium" | "fast";
}

const particlePresets: Record<string, ParticleConfig> = {
  crash: { color: "rgba(251, 146, 60, 0.6)", count: 20, speed: "fast" },
  race: { color: "rgba(168, 85, 247, 0.5)", count: 15, speed: "fast" },
  slots: { color: "rgba(234, 179, 8, 0.5)", count: 18, speed: "medium" },
  cards: { color: "rgba(34, 197, 94, 0.4)", count: 10, speed: "slow" },
  sports: { color: "rgba(59, 130, 246, 0.5)", count: 12, speed: "medium" },
  mines: { color: "rgba(6, 182, 212, 0.6)", count: 14, speed: "slow" },
  wheel: { color: "rgba(245, 158, 11, 0.5)", count: 16, speed: "medium" },
  tower: { color: "rgba(147, 197, 253, 0.4)", count: 10, speed: "slow" },
  coinflip: { color: "rgba(234, 179, 8, 0.6)", count: 20, speed: "medium" },
  scratch: { color: "rgba(234, 179, 8, 0.5)", count: 15, speed: "slow" },
  arcade: { color: "rgba(236, 72, 153, 0.5)", count: 20, speed: "fast" },
  dice: { color: "rgba(239, 68, 68, 0.5)", count: 12, speed: "medium" },
};

const FloatingParticles = ({ config }: { config: ParticleConfig }) => {
  const speedMap = { slow: 6, medium: 4, fast: 2.5 };
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {Array.from({ length: config.count }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: 2 + Math.random() * 4,
            height: 2 + Math.random() * 4,
            backgroundColor: config.color,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            y: [0, -30 - Math.random() * 50, 0],
            x: [0, (Math.random() - 0.5) * 30, 0],
            opacity: [0.2, 0.8, 0.2],
            scale: [1, 1.5, 1],
          }}
          transition={{
            duration: speedMap[config.speed] + Math.random() * 3,
            repeat: Infinity,
            delay: Math.random() * 3,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
};

interface GameBackgroundProps {
  type: GameBgType;
  children: React.ReactNode;
  className?: string;
  overlay?: "dark" | "medium" | "light";
}

const GameBackground = ({ type, children, className = "", overlay = "medium" }: GameBackgroundProps) => {
  const bg = bgMap[type] || crashSpace;
  const particles = particlePresets[type] || particlePresets.crash;
  const overlayOpacity = overlay === "dark" ? "bg-black/70" : overlay === "light" ? "bg-black/40" : "bg-black/55";

  return (
    <div className={`relative rounded-2xl overflow-hidden ${className}`}>
      {/* Background image */}
      <div className="absolute inset-0">
        <img
          src={bg}
          alt=""
          className="w-full h-full object-cover"
          loading="lazy"
        />
        <div className={`absolute inset-0 ${overlayOpacity}`} />
      </div>

      {/* Animated gradient overlay */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.4) 100%)`,
        }}
        animate={{ opacity: [0.5, 0.8, 0.5] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Floating particles */}
      <FloatingParticles config={particles} />

      {/* Vignette effect */}
      <div className="absolute inset-0 pointer-events-none" style={{
        boxShadow: "inset 0 0 60px rgba(0,0,0,0.5)",
      }} />

      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};

export default GameBackground;
