import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Star, Quote, BadgeCheck, Play } from "lucide-react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const testimonials = [
  {
    name: "Michael Chen",
    role: "Professional Trader",
    image: "https://avatars.githubusercontent.com/u/1234567?v=4",
    content: "The real-time market data and advanced trading features have significantly improved my trading performance. The platform's security measures give me peace of mind.",
    rating: 5,
    verified: true,
    tradingVolume: "$2.5M+"
  },
  {
    name: "Sarah Johnson",
    role: "Crypto Fund Manager",
    image: "https://avatars.githubusercontent.com/u/2345678?v=4",
    content: "SQUANCH's institutional-grade tools have transformed our trading strategy. The API integration and automated features have saved us countless hours.",
    rating: 5,
    verified: true,
    tradingVolume: "$10M+"
  },
  {
    name: "David Wilson",
    role: "Early Crypto Investor",
    image: "https://avatars.githubusercontent.com/u/3456789?v=4",
    content: "The customer support is exceptional, and the platform's intuitive design made getting started with crypto trading seamless. A game-changer for both beginners and pros.",
    rating: 5,
    verified: true,
    tradingVolume: "$500K+"
  },
  {
    name: "Emily Zhang",
    role: "DeFi Developer",
    image: "https://avatars.githubusercontent.com/u/4567890?v=4",
    content: "We've seen remarkable improvements in our trading efficiency since switching to SQUANCH. The smart order routing and liquidity aggregation are particularly impressive.",
    rating: 5,
    verified: true,
    tradingVolume: "$5M+"
  },
  {
    name: "James Rodriguez",
    role: "Crypto Security Expert",
    image: "https://avatars.githubusercontent.com/u/5678901?v=4",
    content: "The security features are robust and the regular updates keep us ahead of emerging threats. It's exactly what the crypto industry needed.",
    rating: 5,
    verified: true,
    tradingVolume: "$1M+"
  },
  {
    name: "Lisa Thompson",
    role: "Portfolio Manager",
    image: "https://avatars.githubusercontent.com/u/6789012?v=4",
    content: "The platform's ability to handle complex trading strategies while maintaining simplicity in its interface is remarkable. It's been invaluable for our portfolio management.",
    rating: 5,
    verified: true,
    tradingVolume: "$8M+"
  },
  {
    name: "Alex Martinez",
    role: "Day Trader",
    image: "https://avatars.githubusercontent.com/u/7890123?v=4",
    content: "I've tried many trading bots, but SQUANCH stands out with its accuracy and reliability. The AI predictions have been consistently profitable for my portfolio.",
    rating: 5,
    verified: true,
    tradingVolume: "$750K+"
  },
  {
    name: "Rachel Kim",
    role: "Blockchain Analyst",
    image: "https://avatars.githubusercontent.com/u/8901234?v=4",
    content: "The technical analysis tools and market insights provided by SQUANCH are unparalleled. It's become an essential part of my daily trading routine.",
    rating: 5,
    verified: true,
    tradingVolume: "$1.2M+"
  },
  {
    name: "Thomas Anderson",
    role: "Hedge Fund Analyst",
    image: "https://avatars.githubusercontent.com/u/9012345?v=4",
    content: "SQUANCH has revolutionized how we approach algorithmic trading. The machine learning models are incredibly accurate and have consistently outperformed our expectations.",
    rating: 5,
    verified: true,
    tradingVolume: "$15M+"
  },
  {
    name: "Maria Garcia",
    role: "Crypto Educator",
    image: "https://avatars.githubusercontent.com/u/1123456?v=4",
    content: "I recommend SQUANCH to all my students. The learning curve is minimal, yet the platform offers professional-grade features that grow with you.",
    rating: 5,
    verified: true,
    tradingVolume: "$300K+"
  },
  {
    name: "Kevin O'Brien",
    role: "Quantitative Trader",
    image: "https://avatars.githubusercontent.com/u/2234567?v=4",
    content: "The backtesting capabilities and historical data access have been crucial for developing our trading algorithms. SQUANCH delivers enterprise-level tools.",
    rating: 5,
    verified: true,
    tradingVolume: "$4M+"
  },
  {
    name: "Sophia Lee",
    role: "Venture Capitalist",
    image: "https://avatars.githubusercontent.com/u/3345678?v=4",
    content: "After evaluating dozens of trading platforms, SQUANCH stood out for its innovation and reliability. We've invested in several crypto startups, but this platform truly delivers.",
    rating: 5,
    verified: true,
    tradingVolume: "$25M+"
  }
];

const videoTestimonials = [
  {
    name: "Marcus Williams",
    role: "Full-time Crypto Trader",
    thumbnail: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop",
    videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    duration: "3:45",
    verified: true,
    quote: "SQUANCH helped me quit my 9-5 and trade full-time"
  },
  {
    name: "Jennifer Park",
    role: "Crypto Influencer",
    thumbnail: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=300&fit=crop",
    videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    duration: "5:12",
    verified: true,
    quote: "My followers love the results I share from SQUANCH"
  },
  {
    name: "Robert Chang",
    role: "Tech Entrepreneur",
    thumbnail: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=300&fit=crop",
    videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    duration: "4:30",
    verified: true,
    quote: "The AI predictions are scary accurate"
  },
  {
    name: "Amanda Foster",
    role: "Financial Advisor",
    thumbnail: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=300&fit=crop",
    videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    duration: "6:18",
    verified: true,
    quote: "I now recommend SQUANCH to all my crypto-curious clients"
  }
];

const Testimonials = () => {
  const [selectedVideo, setSelectedVideo] = useState<typeof videoTestimonials[0] | null>(null);

  return (
    <div className="min-h-screen bg-black">
      <Navigation />
      
      <main className="pt-32 pb-20">
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
            <div className="flex items-center justify-center gap-8 mt-8">
              <div className="text-center">
                <p className="text-3xl font-bold text-primary">50,000+</p>
                <p className="text-sm text-muted-foreground">Active Traders</p>
              </div>
              <div className="w-px h-12 bg-white/10" />
              <div className="text-center">
                <p className="text-3xl font-bold text-primary">$2B+</p>
                <p className="text-sm text-muted-foreground">Trading Volume</p>
              </div>
              <div className="w-px h-12 bg-white/10" />
              <div className="text-center">
                <p className="text-3xl font-bold text-primary">4.9/5</p>
                <p className="text-sm text-muted-foreground">Average Rating</p>
              </div>
            </div>
          </motion.div>

          {/* Video Testimonials Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mb-20"
          >
            <h2 className="text-3xl font-bold text-center mb-8">
              <span className="text-gradient">Video Testimonials</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {videoTestimonials.map((video, index) => (
                <motion.div
                  key={video.name}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Card 
                    className="overflow-hidden bg-black/40 backdrop-blur-xl border-white/10 hover:border-primary/50 transition-all duration-300 cursor-pointer group"
                    onClick={() => setSelectedVideo(video)}
                  >
                    <div className="relative aspect-video">
                      <img 
                        src={video.thumbnail} 
                        alt={video.name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                        <div className="w-16 h-16 rounded-full bg-primary/90 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <Play className="w-8 h-8 text-white fill-white ml-1" />
                        </div>
                      </div>
                      <div className="absolute bottom-2 right-2 bg-black/70 px-2 py-1 rounded text-xs">
                        {video.duration}
                      </div>
                    </div>
                    <div className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold text-foreground">{video.name}</h4>
                        {video.verified && (
                          <BadgeCheck className="w-4 h-4 text-primary fill-primary/20" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{video.role}</p>
                      <p className="text-sm text-foreground/80 italic">"{video.quote}"</p>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Written Testimonials */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            <h2 className="text-3xl font-bold text-center mb-8">
              <span className="text-gradient">Verified Reviews</span>
            </h2>
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
          </motion.div>

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

      {/* Video Dialog */}
      <Dialog open={!!selectedVideo} onOpenChange={() => setSelectedVideo(null)}>
        <DialogContent className="max-w-4xl bg-black/95 border-white/10">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedVideo?.name}
              {selectedVideo?.verified && (
                <BadgeCheck className="w-5 h-5 text-primary fill-primary/20" />
              )}
              <span className="text-muted-foreground font-normal text-sm ml-2">
                {selectedVideo?.role}
              </span>
            </DialogTitle>
          </DialogHeader>
          <div className="aspect-video">
            {selectedVideo && (
              <iframe
                src={selectedVideo.videoUrl}
                className="w-full h-full rounded-lg"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default Testimonials;
