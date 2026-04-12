import { useEffect, useState } from "react";

const FIRST_NAMES = [
  "Chidi", "Amara", "Tunde", "Ngozi", "Emeka", "Fatima", "Yusuf", "Blessing",
  "Obinna", "Aisha", "Kola", "Chioma", "Segun", "Halima", "Uche", "Zainab",
  "Dayo", "Nneka", "Ibrahim", "Grace", "Kunle", "Funke", "Musa", "Ada",
  "Femi", "Joy", "Ahmed", "Bola", "Sani", "Ify", "Tobi", "Kemi",
];

const GAMES = [
  "🎡 Spin the Wheel", "🎰 Lucky Slots", "🧠 Trivia Quiz", "🎟️ Raffle Draw",
  "✈️ Aviator", "🃏 Blackjack", "🎲 Dice Roll", "💎 Diamond Rush",
];

const AMOUNTS = [500, 1000, 2000, 3000, 5000, 7500, 10000, 15000, 20000, 50000];

function generateWin() {
  const name = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
  const game = GAMES[Math.floor(Math.random() * GAMES.length)];
  const amount = AMOUNTS[Math.floor(Math.random() * AMOUNTS.length)];
  const initial = String.fromCharCode(65 + Math.floor(Math.random() * 26));
  return `${name} ${initial}. won ₦${amount.toLocaleString()} on ${game}`;
}

const WinnerMarquee = () => {
  const [wins, setWins] = useState<string[]>(() =>
    Array.from({ length: 8 }, generateWin)
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setWins((prev) => [...prev.slice(1), generateWin()]);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const text = wins.join("  •  ");

  return (
    <div className="fixed top-0 left-0 right-0 z-[60] bg-primary/90 backdrop-blur-sm text-primary-foreground text-xs py-1.5 overflow-hidden">
      <div className="animate-marquee whitespace-nowrap inline-block">
        <span className="mx-4">🏆 {text}  •  </span>
        <span className="mx-4">🏆 {text}  •  </span>
      </div>
    </div>
  );
};

export default WinnerMarquee;
