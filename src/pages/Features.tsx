import { motion } from "framer-motion";
import { Gamepad2, Gift, Brain, Shield, Users, Settings, Ticket, Trophy } from "lucide-react";
import Navigation from "@/components/Navigation";
import AppSidebar from "@/components/AppSidebar";
import Footer from "@/components/Footer";
import MascotBackground from "@/components/MascotBackground";

const Features = () => {
  const featureCategories = [
    {
      title: "Games & Entertainment",
      icon: <Gamepad2 className="w-8 h-8" />,
      features: [
        { icon: "🎰", title: "Spin the Wheel", description: "Try your luck with our exciting spin-the-wheel game. Every spin guarantees a prize — from bonus credits to jackpot rewards." },
        { icon: "🎟️", title: "Raffle Draws", description: "Enter raffles with huge prize pools. Buy tickets and stand a chance to win big rewards every draw." },
        { icon: "🧠", title: "Trivia Quizzes", description: "Test your knowledge across various topics. Answer correctly to earn rewards and climb the leaderboard." },
        { icon: "🎮", title: "Lucky Slots", description: "Classic slot machine action with modern rewards. Match symbols to win big prizes." }
      ]
    },
    {
      title: "Security & Trust",
      icon: <Shield className="w-8 h-8" />,
      features: [
        { icon: "🔒", title: "Secure Payments", description: "All deposits and transactions are protected with bank-grade encryption and secure payment gateways." },
        { icon: "🛡️", title: "Fair Gaming", description: "All games use provably fair algorithms ensuring transparent and honest results every time." },
        { icon: "🔑", title: "Two-Factor Auth", description: "Add extra security with email-based 2FA. Protect your account from unauthorized access." },
        { icon: "✅", title: "Verified Platform", description: "We operate transparently with verified gaming systems and regular security audits." }
      ]
    },
    {
      title: "Rewards & Bonuses",
      icon: <Gift className="w-8 h-8" />,
      features: [
        { icon: "💰", title: "Real Rewards", description: "Win real money and bonuses that you can withdraw anytime. No fake points or worthless tokens." },
        { icon: "🏆", title: "Leaderboard Prizes", description: "Compete with other players and climb the rankings for extra prizes and exclusive rewards." },
        { icon: "🎁", title: "Daily Bonuses", description: "Log in daily to claim bonus rewards. The more you play, the bigger your daily bonuses grow." },
        { icon: "🚀", title: "VIP Program", description: "Level up through our VIP tiers to unlock exclusive games, bigger prizes, and special perks." }
      ]
    },
    {
      title: "Account & Referrals",
      icon: <Users className="w-8 h-8" />,
      features: [
        { icon: "💳", title: "Easy Deposits", description: "Deposit funds quickly with multiple payment options. Minimum deposit of ₦7,000 to get started." },
        { icon: "💸", title: "Fast Withdrawals", description: "Withdraw your winnings anytime directly to your bank account or wallet. Quick processing." },
        { icon: "👥", title: "Referral Program", description: "Invite friends and earn bonus rewards. No limit on referrals — the more you invite, the more you earn." },
        { icon: "📊", title: "Dashboard", description: "Track your balance, game history, wins, and referral earnings all from your personal dashboard." }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navigation />
      <AppSidebar />
      <div className="md:pl-16 container px-4 pt-32 pb-20 relative overflow-hidden">
        <MascotBackground position="left" />
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="max-w-4xl mx-auto mb-20">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 text-center">
            Platform <span className="text-primary">Features</span>
          </h1>
          <p className="text-xl text-gray-300 text-center max-w-3xl mx-auto">
            Discover everything LootBox offers — exciting games, real rewards, and a trusted gaming experience.
          </p>
        </motion.div>
        <div className="space-y-20">
          {featureCategories.map((category, categoryIndex) => (
            <motion.div key={category.title} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: categoryIndex * 0.1 }} className="space-y-8">
              <div className="flex items-center gap-4 mb-8">
                <div className="text-primary">{category.icon}</div>
                <h2 className="text-3xl md:text-4xl font-bold">{category.title}</h2>
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                {category.features.map((feature, featureIndex) => (
                  <motion.div key={feature.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: (categoryIndex * 0.1) + (featureIndex * 0.05) }} className="glass rounded-xl p-6 hover:border-primary/50 transition-all duration-300">
                    <div className="text-4xl mb-4">{feature.icon}</div>
                    <h3 className="text-xl font-bold mb-3 text-primary">{feature.title}</h3>
                    <p className="text-gray-300 leading-relaxed">{feature.description}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Features;
