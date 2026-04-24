import Navigation from "@/components/Navigation";
import AppSidebar from "@/components/AppSidebar";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Star, Quote, BadgeCheck } from "lucide-react";

const testimonials = [
  {
    name: "Chinedu Okafor",
    role: "Lagos Player",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
    content: "I cashed out ₦45,000 last weekend from Lucky Slots and Spin Wheel combined. Withdrawal hit my bank in minutes — LootBoxx is the real deal!",
    rating: 5,
    verified: true,
    totalWon: "₦120K+"
  },
  {
    name: "Aisha Bello",
    role: "Abuja Player",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face",
    content: "The Trivia Quiz is my favorite. I play every evening after work and the points add up fast. Already redeemed twice this month.",
    rating: 5,
    verified: true,
    totalWon: "₦68K+"
  },
  {
    name: "Tunde Adeleke",
    role: "Ibadan Player",
    image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
    content: "I was sceptical at first about the ₦7,000 activation, but I've made it back 5x already. Customer support replied to my issue within an hour too.",
    rating: 5,
    verified: true,
    totalWon: "₦35K+"
  },
  {
    name: "Ngozi Eze",
    role: "Port Harcourt Player",
    image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
    content: "The Mines and Crash games are addictive in a good way. I love that the daily win limits keep me disciplined — no chasing losses here.",
    rating: 5,
    verified: true,
    totalWon: "₦92K+"
  },
  {
    name: "Emeka Nwosu",
    role: "Enugu Player",
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face",
    content: "Won ₦15,000 from the weekly raffle on my second try! The weekend withdrawal window is fast and reliable. LootBoxx pays for sure.",
    rating: 5,
    verified: true,
    totalWon: "₦41K+"
  },
  {
    name: "Folake Adeyemi",
    role: "Lagos Player",
    image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face",
    content: "Referred 6 friends and got ₦12,000 in referral bonuses. The dashboard makes it so easy to track everything I've won and withdrawn.",
    rating: 5,
    verified: true,
    totalWon: "₦78K+"
  },
  {
    name: "Ibrahim Musa",
    role: "Kano Player",
    image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&h=150&fit=crop&crop=face",
    content: "The Plinko and Pachinko engines are smooth — no lag even on my budget phone. And the cyberpunk theme looks beautiful at night.",
    rating: 5,
    verified: true,
    totalWon: "₦27K+"
  },
  {
    name: "Blessing Okonkwo",
    role: "Owerri Player",
    image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face",
    content: "I love the variety — over 20 games to choose from. Penalty Shootout is my new obsession. Multipliers keep climbing every round.",
    rating: 5,
    verified: true,
    totalWon: "₦52K+"
  },
  {
    name: "Segun Adebayo",
    role: "Akure Player",
    image: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&h=150&fit=crop&crop=face",
    content: "Hit a ₦20,000 win on Baccarat last week. The card animations feel like a real casino. Renewal is only ₦2,000 — totally worth it.",
    rating: 5,
    verified: true,
    totalWon: "₦88K+"
  },
  {
    name: "Halima Yusuf",
    role: "Kaduna Player",
    image: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=150&h=150&fit=crop&crop=face",
    content: "I tell all my friends about LootBoxx. The XP lives system makes you take each game seriously. Best entertainment app for Nigerians.",
    rating: 5,
    verified: true,
    totalWon: "₦19K+"
  },
  {
    name: "Daniel Ojo",
    role: "Benin Player",
    image: "https://images.unsplash.com/photo-1463453091185-61582044d556?w=150&h=150&fit=crop&crop=face",
    content: "The transaction history page shows every kobo. Zero hidden fees beyond the 5% withdrawal cut. Transparent and trustworthy platform.",
    rating: 5,
    verified: true,
    totalWon: "₦64K+"
  },
  {
    name: "Chiamaka Obi",
    role: "Asaba Player",
    image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&h=150&fit=crop&crop=face",
    content: "Started with the ₦7K activation, now I withdraw every weekend. The treasure chest mascot makes me smile every time I open the app.",
    rating: 5,
    verified: true,
    totalWon: "₦105K+"
  }
];

const Testimonials = () => {
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
                      <AvatarImage src={testimonial.image} />
                      <AvatarFallback className="bg-primary/20 text-primary">
                        {testimonial.name[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-foreground">{testimonial.name}</h4>
                        {testimonial.verified && (
                          <BadgeCheck className="w-5 h-5 text-primary fill-primary/20" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mb-4">
                    <div className="flex gap-1">
                      {Array.from({ length: testimonial.rating }).map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-primary text-primary" />
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
