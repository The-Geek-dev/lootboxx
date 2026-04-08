import { motion } from "framer-motion";
import { Shield, Trophy, Users, Gift, CheckCircle2, Lock, Gamepad2 } from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import MascotBackground from "@/components/MascotBackground";

const About = () => {
  const platformBenefits = [
    {
      icon: "🎮",
      title: "Exciting Games",
      description: "From raffles to spin-the-wheel to trivia challenges, LootBox offers a variety of games designed to be fun and rewarding. New games are added regularly."
    },
    {
      icon: "💰",
      title: "Real Rewards",
      description: "Every game gives you a chance to win real rewards. Deposit, play, and withdraw your winnings — it's that simple."
    },
    {
      icon: "👥",
      title: "Referral Bonuses",
      description: "Invite friends and earn bonus rewards. The more people you bring to LootBox, the more you earn together."
    }
  ];

  const securityFeatures = [
    {
      icon: <Lock className="w-8 h-8" />,
      title: "Secure Deposits",
      description: "All deposits and transactions are protected with bank-grade encryption and security measures.",
      details: ["Encrypted transactions", "Secure payment gateway", "Two-factor authentication", "Regular security audits"]
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: "Fair Gaming",
      description: "All games use provably fair algorithms ensuring transparent and honest results.",
      details: ["Verifiable randomness", "Transparent draw results", "Audited game algorithms", "Real-time fairness checks"]
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: "Community First",
      description: "We prioritize our community with responsive support and user-driven feature development.",
      details: ["24/7 customer support", "Active community channels", "User feedback integration", "Regular platform updates"]
    },
    {
      icon: <Gamepad2 className="w-8 h-8" />,
      title: "Responsible Gaming",
      description: "We promote responsible gaming with tools and limits to keep the experience fun and safe.",
      details: ["Deposit limits", "Self-exclusion options", "Gaming history tracking", "Age verification"]
    }
  ];

  const platformStats = [
    { icon: "🏆", title: "Total Winners", value: "10,000+" },
    { icon: "🎮", title: "Games Available", value: "5+" },
    { icon: "💰", title: "Rewards Paid", value: "₦50M+" },
    { icon: "⚡", title: "Uptime", value: "99.9%" }
  ];

  return (
    <div className="min-h-screen bg-black text-foreground">
      <Navigation />
      
      <div className="container px-4 pt-32 pb-20 relative overflow-hidden">
        <MascotBackground position="right" />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-4xl mx-auto mb-16"
        >
          <h1 className="text-5xl md:text-6xl font-bold mb-6 text-center">
            About <span className="text-primary">LootBox</span>
          </h1>
          
          <p className="text-xl text-gray-300 mb-8 text-center max-w-3xl mx-auto">
            Discover the ultimate gaming platform where fun meets rewards. Play games, win prizes, and earn bonuses every day.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="glass rounded-2xl p-8 md:p-12 mb-20"
        >
          <h2 className="text-3xl font-bold mb-6">What is LootBox?</h2>
          <p className="text-lg text-gray-300 leading-relaxed">
            LootBox is a gaming rewards platform where players can deposit funds, play exciting games like raffles, spin-the-wheel, 
            and trivia quizzes, and win real rewards. Our platform combines the thrill of gaming with genuine earning opportunities, 
            creating an engaging experience for everyone.
          </p>
        </motion.div>

        <div className="mb-20 relative">
          <MascotBackground variant="watermark" corner="top-left" />
          <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center">Why Choose LootBox?</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {platformBenefits.map((benefit, index) => (
              <motion.div
                key={benefit.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                className="glass rounded-xl p-8"
              >
                <div className="text-5xl mb-4">{benefit.icon}</div>
                <h3 className="text-2xl font-bold mb-3 text-primary">{benefit.title}</h3>
                <p className="text-gray-300 leading-relaxed">{benefit.description}</p>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="mb-20 relative">
          <MascotBackground variant="watermark" corner="bottom-right" />
          <h2 className="text-3xl md:text-4xl font-bold mb-6 text-center">Security & Trust</h2>
          <p className="text-center text-gray-300 mb-12 max-w-2xl mx-auto">
            How we keep your gaming experience safe
          </p>
          <div className="grid md:grid-cols-2 gap-8">
            {securityFeatures.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                className="glass rounded-xl p-8"
              >
                <div className="text-primary mb-4">{feature.icon}</div>
                <h3 className="text-2xl font-bold mb-3">{feature.title}</h3>
                <p className="text-gray-300 leading-relaxed mb-4">{feature.description}</p>
                <ul className="space-y-2">
                  {feature.details.map((detail, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-gray-400">{detail}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="mb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="glass rounded-2xl p-8 md:p-12 text-center mb-12"
          >
            <h2 className="text-3xl font-bold mb-4">Platform Stats</h2>
            <p className="text-lg text-gray-300 max-w-3xl mx-auto">
              LootBox has been delivering winning moments and real rewards to players across the platform.
            </p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {platformStats.map((metric, index) => (
              <motion.div
                key={metric.title}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 + index * 0.1 }}
                className="glass rounded-xl p-6 text-center"
              >
                <div className="text-4xl mb-3">{metric.icon}</div>
                <div className="text-3xl font-bold text-primary mb-2">{metric.value}</div>
                <div className="text-sm text-gray-400">{metric.title}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default About;
