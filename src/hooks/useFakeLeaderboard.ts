import { useState, useEffect } from "react";

// Seeded PRNG (mulberry32)
function mulberry32(seed: number) {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const FIRST_NAMES = [
  "Chinedu", "Amara", "Emeka", "Ngozi", "Tunde", "Funke", "Obinna", "Yemi",
  "Adaeze", "Kemi", "Ifeanyi", "Blessing", "Chioma", "Segun", "Aisha",
  "Damilola", "Oluchi", "Ikenna", "Fatima", "Eze", "Bola", "Uche",
  "Zainab", "Nnamdi", "Tobi", "Halima", "Chidi", "Nneka", "Musa", "Bukola",
];

const LAST_INITIALS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

// Fixed anchor — leaderboard "started" here. Numbers grow steadily from this point.
const LEADERBOARD_ANCHOR_MS = new Date("2025-01-01T00:00:00Z").getTime();
const LEADERBOARD_SEED = 4242; // stable seed → same players + same baselines forever

function getSeed30Min(): number {
  const now = Date.now();
  const window = Math.floor(now / (30 * 60 * 1000));
  return window;
}

function generateName(rng: () => number): string {
  const first = FIRST_NAMES[Math.floor(rng() * FIRST_NAMES.length)];
  const lastInit = LAST_INITIALS[Math.floor(rng() * LAST_INITIALS.length)];
  return `${first} ${lastInit}.`;
}

export interface FakePlayer {
  rank: number;
  player_name: string;
  total_winnings: number;
  games_played: number;
  wins: number;
  base_winnings: number;
  daily_growth: number;
  win_rate: number;
  current_streak: number;
  longest_streak: number;
  seed: number;
}

export interface FakeJackpotWinner {
  name: string;
  amount: number;
  timeAgo: string;
}

interface PlayerBase {
  name: string;
  baseWinnings: number;     // ₦ at anchor
  dailyGrowth: number;      // ₦ per day
  baseGames: number;
  gamesPerDay: number;
  winRate: number;          // 0..1
}

function buildBasePlayers(count: number): PlayerBase[] {
  const rng = mulberry32(LEADERBOARD_SEED);
  const players: PlayerBase[] = [];
  for (let i = 0; i < count; i++) {
    const baseWinnings = Math.floor(rng() * 380000) + 20000;       // 20k–400k starting
    const dailyGrowth = Math.floor(rng() * 1800) + 200;            // 200–2000 ₦/day
    const baseGames = Math.floor(rng() * 180) + 20;
    const gamesPerDay = rng() * 4 + 0.5;                           // 0.5–4.5 games/day
    const winRate = 0.25 + rng() * 0.35;                           // 25%–60%
    players.push({
      name: generateName(rng),
      baseWinnings,
      dailyGrowth,
      baseGames,
      gamesPerDay,
      winRate,
    });
  }
  return players;
}

export function useFakeLeaderboard(count = 20) {
  const [leaders, setLeaders] = useState<FakePlayer[]>([]);
  const [jackpotWinners, setJackpotWinners] = useState<FakeJackpotWinner[]>([]);

  useEffect(() => {
    const basePlayers = buildBasePlayers(count);

    const generate = () => {
      const daysElapsed = Math.max(0, (Date.now() - LEADERBOARD_ANCHOR_MS) / (1000 * 60 * 60 * 24));

      const players: FakePlayer[] = basePlayers.map((p) => {
        const winnings = Math.floor(p.baseWinnings + p.dailyGrowth * daysElapsed);
        const gamesPlayed = Math.floor(p.baseGames + p.gamesPerDay * daysElapsed);
        const wins = Math.floor(gamesPlayed * p.winRate);
        return {
          rank: 0,
          player_name: p.name,
          total_winnings: winnings,
          games_played: Math.max(1, gamesPlayed),
          wins,
        };
      });
      players.sort((a, b) => b.total_winnings - a.total_winnings);
      players.forEach((p, i) => (p.rank = i + 1));
      setLeaders(players);

      // Jackpot winners stay on 30-min rotation (recent activity feel)
      const jpRng = mulberry32(getSeed30Min() + 9999);
      const timeLabels = [
        "2 min ago", "18 min ago", "45 min ago", "1 hr ago",
        "2 hrs ago", "3 hrs ago", "5 hrs ago", "8 hrs ago",
        "12 hrs ago", "1 day ago",
      ];
      const winners: FakeJackpotWinner[] = [];
      for (let i = 0; i < 10; i++) {
        winners.push({
          name: generateName(jpRng),
          amount: Math.floor(jpRng() * 80000) + 5000,
          timeAgo: timeLabels[i],
        });
      }
      setJackpotWinners(winners);
    };

    generate();

    // Tick every 60s so totals visibly creep upward, never reset/decrease
    const interval = setInterval(generate, 60 * 1000);
    return () => clearInterval(interval);
  }, [count]);

  return { leaders, jackpotWinners };
}
