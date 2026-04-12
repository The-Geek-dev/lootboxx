import Navigation from "@/components/Navigation";
import AppSidebar from "@/components/AppSidebar";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Star, Quote, BadgeCheck } from "lucide-react";

const testimonials = [
  {
    name: "Michael Chen",
    role: "Professional Trader",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
    content: "The real-time market data and advanced trading features have significantly improved my trading performance. The platform's security measures give me peace of mind.",
    rating: 5,
    verified: true,
    tradingVolume: "$2.5M+"
  },
  {
    name: "Sarah Johnson",
    role: "Crypto Fund Manager",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face",
    content: "SQUANCH's institutional-grade tools have transformed our trading strategy. The API integration and automated features have saved us countless hours.",
    rating: 5,
    verified: true,
    tradingVolume: "$10M+"
  },
  {
    name: "David Wilson",
    role: "Early Crypto Investor",
    image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
    content: "The customer support is exceptional, and the platform's intuitive design made getting started with crypto trading seamless. A game-changer for both beginners and pros.",
    rating: 5,
    verified: true,
    tradingVolume: "$500K+"
  },
  {
    name: "Emily Zhang",
    role: "DeFi Developer",
    image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
    content: "We've seen remarkable improvements in our trading efficiency since switching to SQUANCH. The smart order routing and liquidity aggregation are particularly impressive.",
    rating: 5,
    verified: true,
    tradingVolume: "$5M+"
  },
  {
    name: "James Rodriguez",
    role: "Crypto Security Expert",
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face",
    content: "The security features are robust and the regular updates keep us ahead of emerging threats. It's exactly what the crypto industry needed.",
    rating: 5,
    verified: true,
    tradingVolume: "$1M+"
  },
  {
    name: "Lisa Thompson",
    role: "Portfolio Manager",
    image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face",
    content: "The platform's ability to handle complex trading strategies while maintaining simplicity in its interface is remarkable. It's been invaluable for our portfolio management.",
    rating: 5,
    verified: true,
    tradingVolume: "$8M+"
  },
  {
    name: "Alex Martinez",
    role: "Day Trader",
    image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&h=150&fit=crop&crop=face",
    content: "I've tried many trading bots, but SQUANCH stands out with its accuracy and reliability. The AI predictions have been consistently profitable for my portfolio.",
    rating: 5,
    verified: true,
    tradingVolume: "$750K+"
  },
  {
    name: "Rachel Kim",
    role: "Blockchain Analyst",
    image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face",
    content: "The technical analysis tools and market insights provided by SQUANCH are unparalleled. It's become an essential part of my daily trading routine.",
    rating: 5,
    verified: true,
    tradingVolume: "$1.2M+"
  },
  {
    name: "Thomas Anderson",
    role: "Hedge Fund Analyst",
    image: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&h=150&fit=crop&crop=face",
    content: "SQUANCH has revolutionized how we approach algorithmic trading. The machine learning models are incredibly accurate and have consistently outperformed our expectations.",
    rating: 5,
    verified: true,
    tradingVolume: "$15M+"
  },
  {
    name: "Maria Garcia",
    role: "Crypto Educator",
    image: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=150&h=150&fit=crop&crop=face",
    content: "I recommend SQUANCH to all my students. The learning curve is minimal, yet the platform offers professional-grade features that grow with you.",
    rating: 5,
    verified: true,
    tradingVolume: "$300K+"
  },
  {
    name: "Kevin O'Brien",
    role: "Quantitative Trader",
    image: "https://images.unsplash.com/photo-1463453091185-61582044d556?w=150&h=150&fit=crop&crop=face",
    content: "The backtesting capabilities and historical data access have been crucial for developing our trading algorithms. SQUANCH delivers enterprise-level tools.",
    rating: 5,
    verified: true,
    tradingVolume: "$4M+"
  },
  {
    name: "Sophia Lee",
    role: "Venture Capitalist",
    image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&h=150&fit=crop&crop=face",
    content: "After evaluating dozens of trading platforms, SQUANCH stood out for its innovation and reliability. We've invested in several crypto startups, but this platform truly delivers.",
    rating: 5,
    verified: true,
    tradingVolume: "$25M+"
  }
];

const Testimonials = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <AppSidebar />
      <main className="pl-16 pt-32 pb-20">
        <div className="container px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              <span className="text-gradient text-glow">Trusted by Traders</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Join thousands of satisfied traders who have transformed their crypto trading experience with SQUANCH
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
                      Volume: {testimonial.tradingVolume}
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
                Start your journey with SQUANCH today and experience the power of AI-driven crypto trading.
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
