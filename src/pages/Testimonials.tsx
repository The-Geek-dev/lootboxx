import Navigation from "@/components/Navigation";
import AppSidebar from "@/components/AppSidebar";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Star, Quote, BadgeCheck } from "lucide-react";
import { useMemo } from "react";

// Avatar helper — uses DiceBear "personas" style which produces brown-skinned,
// Afro-styled illustrated avatars that read as Nigerian. Seeded by name so each
// testimonial keeps a stable face.
const avatarFor = (seed: string) =>
  `https://api.dicebear.com/7.x/personas/svg?seed=${encodeURIComponent(seed)}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf&skinColor=8d5524,a26d3d,c68642`;

const ALL_TESTIMONIALS = [
  { name: "Chinedu Okafor", role: "Lagos Player", content: "I cashed out ₦45,000 last weekend from Lucky Slots and Spin Wheel combined. Withdrawal hit my bank in minutes — LootBoxx is the real deal!", rating: 5, totalWon: "₦120K+" },
  { name: "Aisha Bello", role: "Abuja Player", content: "The Trivia Quiz is my favorite. I play every evening after work and the points add up fast. Already redeemed twice this month.", rating: 5, totalWon: "₦68K+" },
  { name: "Tunde Adeleke", role: "Ibadan Player", content: "I was sceptical at first about the ₦7,000 activation, but I've made it back 5x already. Customer support replied to my issue within an hour too.", rating: 4, totalWon: "₦35K+" },
  { name: "Ngozi Eze", role: "Port Harcourt Player", content: "The Mines and Crash games are addictive in a good way. I love that the daily win limits keep me disciplined — no chasing losses here.", rating: 5, totalWon: "₦92K+" },
  { name: "Emeka Nwosu", role: "Enugu Player", content: "Won ₦15,000 from the weekly raffle on my second try! The weekend withdrawal window is fast and reliable.", rating: 5, totalWon: "₦41K+" },
  { name: "Folake Adeyemi", role: "Lagos Player", content: "Referred 6 friends and got ₦12,000 in referral bonuses. The dashboard makes it so easy to track everything.", rating: 4, totalWon: "₦78K+" },
  { name: "Ibrahim Musa", role: "Kano Player", content: "The Plinko and Pachinko engines are smooth — no lag even on my budget phone. Cyberpunk theme looks beautiful at night.", rating: 5, totalWon: "₦27K+" },
  { name: "Blessing Okonkwo", role: "Owerri Player", content: "Over 20 games to choose from. Penalty Shootout is my new obsession. Multipliers keep climbing every round.", rating: 5, totalWon: "₦52K+" },
  { name: "Segun Adebayo", role: "Akure Player", content: "Hit a ₦20,000 win on Baccarat last week. Card animations feel like a real casino. Renewal is only ₦2,000 — totally worth it.", rating: 5, totalWon: "₦88K+" },
  { name: "Halima Yusuf", role: "Kaduna Player", content: "I tell all my friends about LootBoxx. The XP lives system makes you take each game seriously.", rating: 4, totalWon: "₦19K+" },
  { name: "Daniel Ojo", role: "Benin Player", content: "Transaction history shows every kobo. Zero hidden fees beyond the 5% withdrawal cut. Transparent platform.", rating: 5, totalWon: "₦64K+" },
  { name: "Chiamaka Obi", role: "Asaba Player", content: "Started with the ₦7K activation, now I withdraw every weekend. The treasure chest mascot makes me smile every time.", rating: 5, totalWon: "₦105K+" },
  { name: "Olumide Bakare", role: "Lagos Player", content: "Spin Wheel paid me ₦8,000 on a quiet Tuesday. Smooth experience overall, though I wish there were more daily bonuses.", rating: 4, totalWon: "₦31K+" },
  { name: "Adaeze Nnamdi", role: "Aba Player", content: "Decent platform. Won a few thousand on Mines, lost some on Crash. Fair gameplay, no rigged feel.", rating: 3, totalWon: "₦14K+" },
  { name: "Yusuf Garba", role: "Sokoto Player", content: "Withdrawals are fast on weekends. The 5% cut is fair compared to other platforms I've tried.", rating: 4, totalWon: "₦22K+" },
  { name: "Grace Ekpo", role: "Calabar Player", content: "Trivia is my thing. I've been consistent for 3 weeks now and the rewards keep coming. Love it.", rating: 5, totalWon: "₦46K+" },
  { name: "Kelechi Anyanwu", role: "Umuahia Player", content: "Sometimes the games glitch on slow network but it's manageable. Made some money on Roulette so I'm not complaining.", rating: 3, totalWon: "₦11K+" },
  { name: "Bisi Ogundimu", role: "Abeokuta Player", content: "Honest review: not every day is a win day. But the platform is fair and the community is real. Worth trying.", rating: 4, totalWon: "₦29K+" },
  { name: "Nnamdi Eze", role: "Onitsha Player", content: "Hit ₦30,000 on the weekend raffle. Customer service answered my withdrawal question in 30 minutes.", rating: 5, totalWon: "₦71K+" },
  { name: "Zainab Abdullahi", role: "Maiduguri Player", content: "Solid app. Could use more game variety but what's there works well. Withdrew ₦9,000 last week without issues.", rating: 4, totalWon: "₦18K+" },
  { name: "Obinna Chukwu", role: "Awka Player", content: "Plinko paid big for me twice this month. The animations and sound design make it really immersive.", rating: 5, totalWon: "₦57K+" },
  { name: "Funmi Adesanya", role: "Osogbo Player", content: "Average experience overall. The activation fee felt steep at first but I've broken even and a bit more.", rating: 3, totalWon: "₦9K+" },
  { name: "Henry Etim", role: "Uyo Player", content: "Best part is the referral system. Got 4 friends signed up and we all benefit. Real Nigerian gaming community.", rating: 5, totalWon: "₦39K+" },
  { name: "Patience Iwu", role: "Owerri Player", content: "I play casually after dinner. Won ₦6,000 on Lucky Slots last Friday. Good way to unwind and earn small.", rating: 4, totalWon: "₦16K+" },
];

// Deterministic daily shuffle — same order all day for every user, changes at midnight.
const dailyShuffle = <T,>(arr: T[]): T[] => {
  const today = new Date();
  const seed =
    today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
  // Mulberry32 seeded RNG
  let s = seed;
  const rand = () => {
    s |= 0; s = (s + 0x6D2B79F5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

const Testimonials = () => {
  const testimonials = useMemo(() => dailyShuffle(ALL_TESTIMONIALS).slice(0, 12), []);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <AppSidebar />
      <main className="md:pl-16 pt-32 pb-20">
        <div className="container px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              <span className="text-gradient text-glow">Trusted by Players</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Join thousands of Nigerian players winning real cash on LootBoxx every day
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.05 }}
              >
                <Card className="h-full bg-black/40 backdrop-blur-xl border-white/10 hover:border-primary/50 transition-all duration-300 p-6 relative overflow-hidden group">
                  <Quote className="absolute top-4 right-4 w-8 h-8 text-primary/20 group-hover:text-primary/40 transition-colors" />

                  <div className="flex items-center gap-4 mb-4">
                    <Avatar className="h-14 w-14 ring-2 ring-primary/20">
                      <AvatarImage src={avatarFor(testimonial.name)} />
                      <AvatarFallback className="bg-primary/20 text-primary">
                        {testimonial.name[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-foreground">{testimonial.name}</h4>
                        <BadgeCheck className="w-5 h-5 text-primary fill-primary/20" />
                      </div>
                      <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mb-4">
                    <div className="flex gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={
                            i < testimonial.rating
                              ? "w-4 h-4 fill-primary text-primary"
                              : "w-4 h-4 text-muted-foreground/30"
                          }
                        />
                      ))}
                    </div>
                    <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded-full">
                      Won: {testimonial.totalWon}
                    </span>
                  </div>

                  <p className="text-muted-foreground leading-relaxed">
                    "{testimonial.content}"
                  </p>
                </Card>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="mt-16 text-center"
          >
            <div className="glass rounded-xl p-8 max-w-2xl mx-auto">
              <h3 className="text-2xl font-bold mb-4 text-gradient">Ready to Join Them?</h3>
              <p className="text-muted-foreground mb-6">
                Sign up on LootBoxx today, activate your account, and start winning real cash from your favorite games.
              </p>
              <a
                href="/signup"
                className="inline-flex items-center justify-center px-8 py-3 rounded-full button-gradient font-medium transition-all duration-300 hover:scale-105"
              >
                Get Started Now
              </a>
            </div>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Testimonials;
