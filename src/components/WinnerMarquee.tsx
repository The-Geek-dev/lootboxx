import { useEffect, useState, useCallback } from "react";

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

const WinnerMarquee = () => {
  const [events, setEvents] = useState<MarqueeEvent[]>(() =>
    Array.from({ length: 8 }, generateEvent)
  );

  const addEvent = useCallback(() => {
    const ev = generateEvent();
    setEvents((prev) => [...prev.slice(1), ev]);
  }, []);

  useEffect(() => {
    const interval = setInterval(addEvent, 4000);
    return () => clearInterval(interval);
  }, [addEvent]);

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
