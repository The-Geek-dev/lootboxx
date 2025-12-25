import { motion } from "framer-motion";
import { Bot, Zap, TrendingUp, Wallet, Shield, Users, Activity, Settings } from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import MascotBackground from "@/components/MascotBackground";

const Features = () => {
  const featureCategories = [
    {
      title: "Trading & Automation",
      icon: <Activity className="w-8 h-8" />,
      features: [
        {
          icon: "🤖",
          title: "Auto-Trading",
          description: "Set it and forget it. Our algorithms execute trades 24/7 based on real-time market signals without your intervention."
        },
        {
          icon: "⚡",
          title: "Instant Execution",
          description: "Execute buy and sell orders instantly with real-time crypto prices. Zero delays, maximum efficiency."
        },
        {
          icon: "📈",
          title: "Smart Rebalancing",
          description: "Automatic portfolio rebalancing keeps your holdings optimized for maximum returns while managing risk."
        },
        {
          icon: "💰",
          title: "12+ Cryptocurrencies",
          description: "Trade BTC, ETH, BNB, XRP, ADA, DOGE, SOL, DOT, MATIC, AVAX, LINK, UNI and more directly from Telegram."
        }
      ]
    },
    {
      title: "Security & Wallets",
      icon: <Shield className="w-8 h-8" />,
      features: [
        {
          icon: "🔑",
          title: "Self-Custody Wallets",
          description: "You own your private keys. Generate or import your own wallets with 12-word seed phrases for complete control."
        },
        {
          icon: "🛡️",
          title: "Multi-Signature Ready",
          description: "Support for industry-standard multi-signature authentication to add extra security layers to your account."
        },
        {
          icon: "💾",
          title: "Seed Phrase Backup",
          description: "Never lose access. Generate and save your 12-word seed phrase to recover your wallet anytime, anywhere."
        },
        {
          icon: "📱",
          title: "Telegram Security",
          description: "All operations through Telegram's encrypted messaging. No separate logins or passwords to manage."
        }
      ]
    },
    {
      title: "Portfolio Management",
      icon: <TrendingUp className="w-8 h-8" />,
      features: [
        {
          icon: "📊",
          title: "Real-Time Dashboard",
          description: "Check your portfolio value, holdings, and performance metrics instantly with detailed breakdowns."
        },
        {
          icon: "📈",
          title: "Profit/Loss Tracking",
          description: "Monitor your PnL in real-time with percentage returns. See gains and losses calculated automatically."
        },
        {
          icon: "💹",
          title: "Live Price Updates",
          description: "Get current market prices for all supported coins. Make informed decisions with up-to-the-minute data."
        },
        {
          icon: "📋",
          title: "Detailed Analytics",
          description: "Comprehensive statistics including total trades, trade counts per day, deposit/withdrawal history, and more."
        }
      ]
    },
    {
      title: "Account Management",
      icon: <Settings className="w-8 h-8" />,
      features: [
        {
          icon: "💳",
          title: "Instant Deposits",
          description: "Deposit BTC, ETH, USDT, and other cryptos directly to your wallet with just /deposit command."
        },
        {
          icon: "💸",
          title: "Easy Withdrawals",
          description: "Request withdrawals anytime. Admin approval required for security. Funds sent to your wallet address."
        },
        {
          icon: "💰",
          title: "Low Fees",
          description: "Only 0.1% trading fee per transaction. No hidden costs, no monthly charges, no management fees."
        },
        {
          icon: "🚀",
          title: "Minimum $10",
          description: "Get started with just $10. No high barriers to entry. Scale up at your own pace."
        }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-black text-foreground">
      <Navigation />
      
      <div className="container px-4 pt-32 pb-20 relative overflow-hidden">
        <MascotBackground position="left" />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-4xl mx-auto mb-20"
        >
          <h1 className="text-5xl md:text-6xl font-bold mb-6 text-center">
            Powerful <span className="text-primary">Trading Features</span>
          </h1>
          
          <p className="text-xl text-gray-300 text-center max-w-3xl mx-auto">
            Discover everything Astra offers to maximize your crypto investments with automation, analytics, and control.
          </p>
        </motion.div>

        <div className="space-y-20">
          {featureCategories.map((category, categoryIndex) => (
            <motion.div
              key={category.title}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: categoryIndex * 0.1 }}
              className="space-y-8"
            >
              <div className="flex items-center gap-4 mb-8">
                <div className="text-primary">
                  {category.icon}
                </div>
                <h2 className="text-3xl md:text-4xl font-bold">{category.title}</h2>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {category.features.map((feature, featureIndex) => (
                  <motion.div
                    key={feature.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: (categoryIndex * 0.1) + (featureIndex * 0.05) }}
                    className="glass rounded-xl p-6 hover:border-primary/50 transition-all duration-300"
                  >
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