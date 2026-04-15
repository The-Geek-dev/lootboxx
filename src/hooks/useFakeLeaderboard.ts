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
}

export interface FakeJackpotWinner {
  name: string;
  amount: number;
  timeAgo: string;
}

export function useFakeLeaderboard(count = 20) {
  const [leaders, setLeaders] = useState<FakePlayer[]>([]);
  const [jackpotWinners, setJackpotWinners] = useState<FakeJackpotWinner[]>([]);

  useEffect(() => {
    const generate = () => {
      const seed = getSeed30Min();
      const rng = mulberry32(seed);

      // Generate leaderboard
      const players: FakePlayer[] = [];
      for (let i = 0; i < count; i++) {
        const winnings = Math.floor(rng() * 450000) + 5000;
        const gamesPlayed = Math.floor(rng() * 200) + 10;
        const wins = Math.floor(rng() * gamesPlayed * 0.6);
        players.push({
          rank: 0,
          player_name: generateName(rng),
          total_winnings: winnings,
          games_played: gamesPlayed,
          wins,
        });
      }
      players.sort((a, b) => b.total_winnings - a.total_winnings);
      players.forEach((p, i) => (p.rank = i + 1));
      setLeaders(players);

      // Generate jackpot winners (last 10)
      const jpRng = mulberry32(seed + 9999);
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

    // Refresh at next 30-min boundary
    const now = Date.now();
    const windowMs = 30 * 60 * 1000;
    const nextRefresh = Math.ceil(now / windowMs) * windowMs - now + 1000;
    const timeout = setTimeout(generate, nextRefresh);
    return () => clearTimeout(timeout);
  }, [count]);

  return { leaders, jackpotWinners };
}
