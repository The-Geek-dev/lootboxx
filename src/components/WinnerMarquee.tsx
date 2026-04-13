import { useEffect, useState, useCallback, useRef } from "react";
import { Volume2, VolumeX } from "lucide-react";
import confetti from "canvas-confetti";

const FIRST_NAMES = [
  "Chidi", "Amara", "Tunde", "Ngozi", "Emeka", "Fatima", "Yusuf", "Blessing",
  "Obinna", "Aisha", "Kola", "Chioma", "Segun", "Halima", "Uche", "Zainab",
  "Dayo", "Nneka", "Ibrahim", "Grace", "Kunle", "Funke", "Musa", "Ada",
  "Femi", "Joy", "Ahmed", "Bola", "Sani", "Ify", "Tobi", "Kemi",
  "Tayo", "Amina", "Eze", "Bukola", "Chinedu", "Hauwa", "Ifeanyi", "Jumoke",
  "Kabiru", "Lola", "Nnamdi", "Oluwaseun", "Rasheed", "Stella", "Usman", "Vivian",
  "Wale", "Xander", "Yakubu", "Zara", "Adebayo", "Biola", "Chukwuma", "Doyin",
  "Ese", "Folake", "Gbenga", "Hafsat", "Ikenna", "Janet",
];

const CITIES = ["Lagos", "Abuja", "Port Harcourt", "Ibadan", "Kano", "Enugu", "Benin", "Warri", "Calabar", "Abeokuta", "Jos", "Owerri", "Kaduna", "Uyo", "Asaba"];

type MarqueeEvent = { text: string; icon: string; isBigWin: boolean };

function randomName() {
  const name = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
  const initial = String.fromCharCode(65 + Math.floor(Math.random() * 26));
  return `${name} ${initial}.`;
}

function generateEvent(): MarqueeEvent {
  const roll = Math.random();
  const city = CITIES[Math.floor(Math.random() * CITIES.length)];

  if (roll < 0.4) {
    return {
      text: `${randomName()} just signed up from ${city}`,
      icon: "🎉",
      isBigWin: false,
    };
  } else if (roll < 0.7) {
    return {
      text: `${randomName()} joined the waitlist from ${city}`,
      icon: "📝",
      isBigWin: false,
    };
  } else if (roll < 0.85) {
    return {
      text: `${randomName()} referred a friend from ${city}`,
      icon: "🤝",
      isBigWin: false,
    };
  } else {
    return {
      text: `${randomName()} is excited for launch in ${city}!`,
      icon: "🚀",
      isBigWin: false,
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
    try { return localStorage.getItem("lootboxx_muted") === "true"; } catch { return false; }
  });
  const [flash, setFlash] = useState(false);
  const hasInteracted = useRef(false);

  const toggleMute = () => {
    setMuted((prev) => {
      const next = !prev;
      try { localStorage.setItem("lootboxx_muted", String(next)); } catch {}
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
      setFlash(true);
      setTimeout(() => setFlash(false), 1200);
    }
  }, [muted]);

  useEffect(() => {
    const interval = setInterval(addEvent, 4000);
    return () => clearInterval(interval);
  }, [addEvent]);

  const marqueeContent = events.map((e) => `${e.icon} ${e.text}`).join("  •  ");

  return (
    <>
      <div
        className={`fixed top-0 left-0 right-0 z-[60] backdrop-blur-sm text-primary-foreground text-[11px] py-1 overflow-hidden flex items-center transition-all duration-300 ${
          flash
            ? "bg-yellow-500/90 shadow-[0_0_20px_rgba(234,179,8,0.6)] text-black font-bold"
            : "bg-primary/90"
        }`}
      >
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
