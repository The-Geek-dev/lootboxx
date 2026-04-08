"use client";

import { motion } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Card } from "./ui/card";

const testimonials = [
  {
    name: "Michael Chen",
    role: "Daily Player",
    image: "https://avatars.githubusercontent.com/u/1234567?v=4",
    content: "LootBox is incredibly fun! I've won multiple raffle prizes and the spin-the-wheel game keeps me coming back every day. The referral bonuses are a great bonus too!"
  },
  {
    name: "Sarah Johnson",
    role: "Top Winner",
    image: "https://avatars.githubusercontent.com/u/2345678?v=4",
    content: "I started with a small deposit and the games are so engaging. The trivia challenges are my favorite — I've earned amazing rewards just by answering questions!"
  },
  {
    name: "David Wilson",
    role: "Referred 50+ Friends",
    image: "https://avatars.githubusercontent.com/u/3456789?v=4",
    content: "The referral program is unbeatable. I've invited my friends and we all earn bonuses together. The platform is smooth and payouts are reliable."
  },
  {
    name: "Emily Zhang",
    role: "Raffle Enthusiast",
    image: "https://avatars.githubusercontent.com/u/4567890?v=4",
    content: "Won the grand raffle twice! The excitement of waiting for the draw is addictive. LootBox has the most fair and transparent gaming system I've seen."
  },
  {
    name: "James Rodriguez",
    role: "Trivia Champion",
    image: "https://avatars.githubusercontent.com/u/5678901?v=4",
    content: "As someone who loves trivia, this platform is a dream. The questions are challenging and the rewards are real. Can't recommend it enough!"
  },
  {
    name: "Lisa Thompson",
    role: "VIP Member",
    image: "https://avatars.githubusercontent.com/u/6789012?v=4",
    content: "The variety of games keeps things fresh. From raffles to spin-the-wheel to trivia — there's always something new to play and win."
  }
];

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
          <h2 className="text-5xl font-normal mb-4">Trusted by Players</h2>
          <p className="text-muted-foreground text-lg">
            Join thousands of happy winners on LootBox
          </p>
        </motion.div>

        <div className="relative flex flex-col antialiased">
          <div className="relative flex overflow-hidden py-4">
            <div className="animate-marquee flex min-w-full shrink-0 items-stretch gap-8">
              {testimonials.map((testimonial, index) => (
                <Card key={`${index}-1`} className="w-[400px] shrink-0 bg-black/40 backdrop-blur-xl border-white/5 hover:border-white/10 transition-all duration-300 p-8">
                  <div className="flex items-center gap-4 mb-6">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={testimonial.image} />
                      <AvatarFallback>{testimonial.name[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h4 className="font-medium text-white/90">{testimonial.name}</h4>
                      <p className="text-sm text-white/60">{testimonial.role}</p>
                    </div>
                  </div>
                  <p className="text-white/70 leading-relaxed">
                    {testimonial.content}
                  </p>
                </Card>
              ))}
            </div>
            <div className="animate-marquee flex min-w-full shrink-0 items-stretch gap-8">
              {testimonials.map((testimonial, index) => (
                <Card key={`${index}-2`} className="w-[400px] shrink-0 bg-black/40 backdrop-blur-xl border-white/5 hover:border-white/10 transition-all duration-300 p-8">
                  <div className="flex items-center gap-4 mb-6">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={testimonial.image} />
                      <AvatarFallback>{testimonial.name[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h4 className="font-medium text-white/90">{testimonial.name}</h4>
                      <p className="text-sm text-white/60">{testimonial.role}</p>
                    </div>
                  </div>
                  <p className="text-white/70 leading-relaxed">
                    {testimonial.content}
                  </p>
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
