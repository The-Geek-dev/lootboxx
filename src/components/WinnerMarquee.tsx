import { useEffect, useState, useCallback, useRef } from "react";
import { Volume2, VolumeX } from "lucide-react";
import confetti from "canvas-confetti";

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

const WIN_AMOUNTS = [500, 1000, 2000, 3000, 5000, 7500, 10000, 15000, 20000, 50000];
const BIG_WIN_THRESHOLD = 5000;

const CITIES = ["Lagos", "Abuja", "Port Harcourt", "Ibadan", "Kano", "Enugu", "Benin", "Warri"];

type MarqueeEvent = { text: string; icon: string; isBigWin: boolean };

function randomName() {
  const name = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
  const initial = String.fromCharCode(65 + Math.floor(Math.random() * 26));
  return `${name} ${initial}.`;
}

function generateEvent(): MarqueeEvent {
  const roll = Math.random();

  if (roll < 0.5) {
    // Win event
    const game = GAMES[Math.floor(Math.random() * GAMES.length)];
    const amount = WIN_AMOUNTS[Math.floor(Math.random() * WIN_AMOUNTS.length)];
    return {
      text: `${randomName()} won ₦${amount.toLocaleString()} on ${game}`,
      icon: amount >= BIG_WIN_THRESHOLD ? "💰" : "🏆",
      isBigWin: amount >= BIG_WIN_THRESHOLD,
    };
  } else if (roll < 0.7) {
    // Sign in event
    const city = CITIES[Math.floor(Math.random() * CITIES.length)];
    return {
      text: `${randomName()} just signed in from ${city}`,
      icon: "👋",
      isBigWin: false,
    };
  } else if (roll < 0.82) {
    // Deposit event
    const amounts = [5000, 7000, 10000, 15000, 20000];
    const amt = amounts[Math.floor(Math.random() * amounts.length)];
    return {
      text: `${randomName()} deposited ₦${amt.toLocaleString()}`,
      icon: "💳",
      isBigWin: false,
    };
  } else if (roll < 0.92) {
    // Referral event
    return {
      text: `${randomName()} just referred a friend and earned 200 pts`,
      icon: "🤝",
      isBigWin: false,
    };
  } else {
    // Withdrawal event
    const amounts = [2000, 5000, 10000, 20000, 50000];
    const amt = amounts[Math.floor(Math.random() * amounts.length)];
    return {
      text: `${randomName()} withdrew ₦${amt.toLocaleString()}`,
      icon: "🎉",
      isBigWin: amt >= 20000,
    };
  }
}

// Simple cash register / coin sound via Web Audio API
function playWinSound() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sine";
    gain.gain.setValueAtTime(0.15, ctx.currentTime);

    // Quick ascending arpeggio
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5 E5 G5 C6
    const step = 0.08;
    notes.forEach((freq, i) => {
      osc.frequency.setValueAtTime(freq, ctx.currentTime + i * step);
    });
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + notes.length * step + 0.2);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + notes.length * step + 0.3);
  } catch {
    // Audio not available
  }
}

function fireBigWinConfetti() {
  confetti({
    particleCount: 80,
    spread: 70,
    origin: { y: 0, x: 0.5 },
    colors: ["#8B5CF6", "#F59E0B", "#10B981", "#EC4899", "#3B82F6"],
    gravity: 1.2,
    ticks: 120,
  });
}

const WinnerMarquee = () => {
  const [events, setEvents] = useState<MarqueeEvent[]>(() =>
    Array.from({ length: 8 }, generateEvent)
  );
  const [muted, setMuted] = useState(() => {
    try { return localStorage.getItem("lootbox_muted") === "true"; } catch { return false; }
  });
  const hasInteracted = useRef(false);

  const toggleMute = () => {
    setMuted((prev) => {
      const next = !prev;
      try { localStorage.setItem("lootbox_muted", String(next)); } catch {}
      return next;
    });
  };

  useEffect(() => {
    const handler = () => { hasInteracted.current = true; };
    window.addEventListener("click", handler, { once: true });
    window.addEventListener("touchstart", handler, { once: true });
    return () => {
      window.removeEventListener("click", handler);
      window.removeEventListener("touchstart", handler);
    };
  }, []);

  const addEvent = useCallback(() => {
    const ev = generateEvent();
    setEvents((prev) => [...prev.slice(1), ev]);
    if (ev.isBigWin) {
      fireBigWinConfetti();
      if (hasInteracted.current && !muted) playWinSound();
    }
  }, [muted]);

  useEffect(() => {
    const interval = setInterval(addEvent, 4000);
    return () => clearInterval(interval);
  }, [addEvent]);

  const marqueeContent = events.map((e) => `${e.icon} ${e.text}`).join("  •  ");

  return (
    <>
      <div className="fixed top-0 left-0 right-0 z-[60] bg-primary/90 backdrop-blur-sm text-primary-foreground text-[11px] py-1 overflow-hidden flex items-center">
        <div className="animate-marquee whitespace-nowrap inline-block flex-1">
          <span className="mx-4">{marqueeContent}  •  </span>
          <span className="mx-4">{marqueeContent}  •  </span>
        </div>
        <button
          onClick={toggleMute}
          className="shrink-0 mr-2 p-0.5 rounded hover:bg-white/10 transition-colors"
          title={muted ? "Unmute sounds" : "Mute sounds"}
        >
          {muted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
        </button>
      </div>
      <div className="h-6" />
    </>
  );
};

export default WinnerMarquee;
