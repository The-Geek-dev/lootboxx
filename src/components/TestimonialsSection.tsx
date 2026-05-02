"use client";

import { motion } from "framer-motion";
import { Star } from "lucide-react";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Card } from "./ui/card";

const testimonials = [
  {
    name: "Chinedu Okafor",
    role: "Daily Player • Lagos",
    initials: "CO",
    rating: 5,
    content: "LootBoxx don change my weekend plans! I play spin-the-wheel and trivia every evening, and I've cashed out twice already. Withdrawals on Saturday were smooth.",
  },
  {
    name: "Aisha Bello",
    role: "Top Winner • Abuja",
    initials: "AB",
    rating: 5,
    content: "I activated with ₦7,000 and within two weeks I'd recovered it and more. The raffle draws are my favourite — won ₦25,000 last month. Legit platform!",
  },
  {
    name: "Tunde Adebayo",
    role: "Referred 30+ Friends • Ibadan",
    initials: "TA",
    rating: 5,
    content: "The referral system is sweet. Every five people that join through my link, I get a milestone bonus. I've made more from referrals than from games sef.",
  },
  {
    name: "Ngozi Eze",
    role: "Trivia Champion • Enugu",
    initials: "NE",
    rating: 4,
    content: "I love the trivia quiz — questions are challenging but fair. Wish there were more categories, but the points add up fast and converting to cash is easy.",
  },
  {
    name: "Emeka Nwosu",
    role: "Raffle Enthusiast • Port Harcourt",
    initials: "EN",
    rating: 5,
    content: "Three raffle wins in two months! The platform feels fair and the WhatsApp support replied fast when I had a question about my coupon renewal.",
  },
  {
    name: "Funke Adeyemi",
    role: "VIP Member • Lagos",
    initials: "FA",
    rating: 4,
    content: "Variety of games keeps me coming back. From slots to roulette to instant scratch cards. Payouts hit my GTBank account same evening on weekend withdrawal window.",
  },
  {
    name: "Ibrahim Suleiman",
    role: "Weekend Player • Kano",
    initials: "IS",
    rating: 5,
    content: "I only play Friday nights and weekends, but the daily reminders keep me engaged. Won ₦12,000 on lucky slots last Saturday — straight to my account.",
  },
  {
    name: "Blessing Okoro",
    role: "New Player • Benin City",
    initials: "BO",
    rating: 4,
    content: "Signed up two weeks ago. The ₦7,000 activation felt steep at first but the welcome bonus and points convinced me. Already up ₦4,500. No regrets.",
  },
];

const StarRating = ({ rating }: { rating: number }) => (
  <div className="flex gap-0.5 mb-3">
    {Array.from({ length: 5 }).map((_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${i < rating ? "fill-yellow-400 text-yellow-400" : "text-white/20"}`}
      />
    ))}
  </div>
);

const TestimonialsSection = () => {
  return (
    <section className="py-20 overflow-hidden bg-black">
      <div className="container px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-center mb-16"
        >
          <h2 className="text-5xl font-normal mb-4">Trusted by Nigerians</h2>
          <p className="text-muted-foreground text-lg">
            Real players, real wins across Nigeria
          </p>
        </motion.div>

        <div className="relative flex flex-col antialiased">
          <div className="relative flex overflow-hidden py-4">
            <div className="animate-marquee flex min-w-full shrink-0 items-stretch gap-8">
              {testimonials.map((t, index) => (
                <Card key={`${index}-1`} className="w-[400px] shrink-0 bg-black/40 backdrop-blur-xl border-white/5 hover:border-white/10 transition-all duration-300 p-8">
                  <div className="flex items-center gap-4 mb-4">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-primary/20 text-primary font-semibold">{t.initials}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h4 className="font-medium text-white/90">{t.name}</h4>
                      <p className="text-sm text-white/60">{t.role}</p>
                    </div>
                  </div>
                  <StarRating rating={t.rating} />
                  <p className="text-white/70 leading-relaxed">{t.content}</p>
                </Card>
              ))}
            </div>
            <div className="animate-marquee flex min-w-full shrink-0 items-stretch gap-8">
              {testimonials.map((t, index) => (
                <Card key={`${index}-2`} className="w-[400px] shrink-0 bg-black/40 backdrop-blur-xl border-white/5 hover:border-white/10 transition-all duration-300 p-8">
                  <div className="flex items-center gap-4 mb-4">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-primary/20 text-primary font-semibold">{t.initials}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h4 className="font-medium text-white/90">{t.name}</h4>
                      <p className="text-sm text-white/60">{t.role}</p>
                    </div>
                  </div>
                  <StarRating rating={t.rating} />
                  <p className="text-white/70 leading-relaxed">{t.content}</p>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
