import { useEffect, useState, useCallback, useRef } from "react";
import { useLaunchStatus } from "@/hooks/useLaunchStatus";

// Lightweight Web Audio "coin/ding" effect — no asset needed
function playCoinSound() {
  try {
    const AC: typeof AudioContext =
      (window as any).AudioContext || (window as any).webkitAudioContext;
    if (!AC) return;
    const ctx = new AC();
    const now = ctx.currentTime;

    const tones = [880, 1320]; // two-note ding
    tones.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, now + i * 0.09);
      gain.gain.setValueAtTime(0.0001, now + i * 0.09);
      gain.gain.exponentialRampToValueAtTime(0.18, now + i * 0.09 + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.09 + 0.25);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now + i * 0.09);
      osc.stop(now + i * 0.09 + 0.26);
    });
    setTimeout(() => ctx.close().catch(() => {}), 600);
  } catch {
    /* ignore */
  }
}

function playSignupSound() {
  try {
    const AC: typeof AudioContext =
      (window as any).AudioContext || (window as any).webkitAudioContext;
    if (!AC) return;
    const ctx = new AC();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(660, now);
    osc.frequency.linearRampToValueAtTime(990, now + 0.12);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.12, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.2);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.21);
    setTimeout(() => ctx.close().catch(() => {}), 400);
  } catch {
    /* ignore */
  }
}

const FIRST_NAMES = [
  "Chidi", "Amara", "Tunde", "Ngozi", "Emeka", "Fatima", "Yusuf", "Blessing",
  "Obinna", "Aisha", "Kola", "Chioma", "Segun", "Halima", "Uche", "Zainab",
  "Dayo", "Nneka", "Ibrahim", "Grace", "Kunle", "Funke", "Musa", "Ada",
  "Femi", "Joy", "Ahmed", "Bola", "Sani", "Ify", "Tobi", "Kemi",
  "Tayo", "Amina", "Eze", "Bukola", "Chinedu", "Hauwa", "Ifeanyi", "Jumoke",
  "Kabiru", "Lola", "Nnamdi", "Oluwaseun", "Rasheed", "Stella", "Usman", "Vivian",
  "Wale", "Yakubu", "Zara", "Adebayo", "Biola", "Chukwuma", "Doyin",
  "Ese", "Folake", "Gbenga", "Hafsat", "Ikenna", "Janet", "Adaeze", "Babatunde",
  "Chiamaka", "Damilola", "Ebuka", "Folashade", "Gideon", "Hadiza", "Isioma",
  "Jide", "Kehinde", "Lawal", "Modupe", "Nkechi", "Olumide", "Patience",
  "Quadri", "Ronke", "Sulaimon", "Temitope", "Ugochi", "Victor", "Wasiu",
  "Yetunde", "Zikora", "Abimbola", "Bolaji", "Chibuzor", "Deborah", "Elijah",
  "Favour", "Goodness", "Haruna", "Ifeoma", "Joseph", "Kelechi", "Lekan",
  "Mercy", "Nonso", "Ogechi", "Peter", "Ruth", "Samuel", "Taiwo",
  "Uchenna", "Victoria", "Wisdom", "Yinka", "Adaobi", "Bamidele",
  "Chidinma", "Dare", "Esther", "Festus", "Gloria", "Hassan", "Ify",
  "Jameelah", "Kingsley", "Lateefah", "Moses", "Nnenna", "Olayinka", "Precious",
];

const CITIES = ["Lagos", "Abuja", "Port Harcourt", "Ibadan", "Kano", "Enugu", "Benin", "Warri", "Calabar", "Abeokuta", "Jos", "Owerri", "Kaduna", "Uyo", "Asaba"];

const GAME_NAMES = ["Lucky Slots", "Spin Wheel", "Crash Rocket", "Dice Roll", "Mine Field", "Tower Climb", "Coin Flip", "Speed Race", "Scratch Win", "Mega Wheel", "Trivia Quiz", "Raffle Draw"];

type MarqueeEvent = { text: string; icon: string; isBigWin: boolean };

function randomName() {
  const name = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
  const initial = String.fromCharCode(65 + Math.floor(Math.random() * 26));
  return `${name} ${initial}.`;
}

function generatePreLaunchEvent(): MarqueeEvent {
  const roll = Math.random();
  const city = CITIES[Math.floor(Math.random() * CITIES.length)];

  if (roll < 0.4) {
    return { text: `${randomName()} just signed up from ${city}`, icon: "🎉", isBigWin: false };
  } else if (roll < 0.7) {
    return { text: `${randomName()} joined the waitlist from ${city}`, icon: "📝", isBigWin: false };
  } else if (roll < 0.85) {
    return { text: `${randomName()} referred a friend from ${city}`, icon: "🤝", isBigWin: false };
  } else {
    return { text: `${randomName()} is excited for launch in ${city}!`, icon: "🚀", isBigWin: false };
  }
}

function generatePostLaunchEvent(): MarqueeEvent {
  const roll = Math.random();
  const city = CITIES[Math.floor(Math.random() * CITIES.length)];
  const game = GAME_NAMES[Math.floor(Math.random() * GAME_NAMES.length)];

  if (roll < 0.35) {
    const amounts = [500, 1000, 2000, 3000, 5000, 10000, 15000, 25000];
    const amount = amounts[Math.floor(Math.random() * amounts.length)];
    const isBig = amount >= 10000;
    return { text: `${randomName()} won ₦${amount.toLocaleString()} on ${game} from ${city}!`, icon: isBig ? "🔥" : "🎰", isBigWin: isBig };
  } else if (roll < 0.55) {
    return { text: `${randomName()} just signed up from ${city}`, icon: "🎉", isBigWin: false };
  } else if (roll < 0.7) {
    return { text: `${randomName()} activated their account from ${city}`, icon: "✅", isBigWin: false };
  } else if (roll < 0.85) {
    return { text: `${randomName()} is playing ${game} in ${city}`, icon: "🎮", isBigWin: false };
  } else {
    const amounts = [50000, 75000, 100000];
    const amount = amounts[Math.floor(Math.random() * amounts.length)];
    return { text: `${randomName()} hit ₦${amount.toLocaleString()} JACKPOT on ${game}! 🎊`, icon: "💰", isBigWin: true };
  }
}

const WinnerMarquee = () => {
  const { isLaunched } = useLaunchStatus();
  const generateEvent = isLaunched ? generatePostLaunchEvent : generatePreLaunchEvent;

  const [events, setEvents] = useState<MarqueeEvent[]>(() =>
    Array.from({ length: 8 }, generateEvent)
  );

  const userInteractedRef = useRef(false);

  useEffect(() => {
    const onInteract = () => { userInteractedRef.current = true; };
    window.addEventListener("pointerdown", onInteract, { once: true });
    window.addEventListener("keydown", onInteract, { once: true });
    return () => {
      window.removeEventListener("pointerdown", onInteract);
      window.removeEventListener("keydown", onInteract);
    };
  }, []);

  const addEvent = useCallback(() => {
    const ev = generateEvent();
    setEvents((prev) => [...prev.slice(1), ev]);

    // Respect the user's mute preference from Settings
    let muted = false;
    try { muted = localStorage.getItem("lootboxx_muted") === "true"; } catch {}
    if (muted || !userInteractedRef.current) return;

    if (ev.isBigWin) {
      playCoinSound();
    } else if (ev.icon === "🎉" || ev.icon === "✅") {
      // softer ping for sign-ups / activations
      playSignupSound();
    }
  }, [isLaunched]);

  useEffect(() => {
    const interval = setInterval(addEvent, 4000);
    return () => clearInterval(interval);
  }, [addEvent]);

  const marqueeContent = events.map((e) => `${e.icon} ${e.text}`).join("  •  ");

  return (
    <>
      <div className="fixed top-0 left-0 right-0 z-[60] backdrop-blur-sm text-primary-foreground text-[11px] py-1 overflow-hidden flex items-center bg-primary/90">
        <div className="animate-marquee whitespace-nowrap inline-block flex-1">
          <span className="mx-4">{marqueeContent}  •  </span>
          <span className="mx-4">{marqueeContent}  •  </span>
        </div>
      </div>
      <div className="h-6" />
    </>
  );
};

export default WinnerMarquee;
