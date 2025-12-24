import { motion } from "framer-motion";
import { Shield, TrendingUp, Users, Award, CheckCircle2, Lock, BarChart3 } from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

const About = () => {
  const automationBenefits = [
    {
      icon: "🤖",
      title: "AI-Powered Algorithms",
      description: "Our advanced AI analyzes thousands of market signals per second, identifying profitable trading opportunities that humans would miss. The system learns from market patterns and adapts to changing conditions."
    },
    {
      icon: "⚡",
      title: "Lightning-Fast Execution",
      description: "In crypto markets, milliseconds matter. Our automated system executes trades instantly when conditions are optimal, capturing profits that manual traders can't match."
    },
    {
      icon: "🌍",
      title: "24/7 Market Coverage",
      description: "Cryptocurrency markets never sleep, and neither does SQUANCH. Our bots monitor and trade around the clock, ensuring you never miss an opportunity in any time zone."
    }
  ];

  const securityFeatures = [
    {
      icon: <Lock className="w-8 h-8" />,
      title: "Bank-Level Encryption",
      description: "All your data and transactions are protected with AES-256 encryption, the same standard used by financial institutions worldwide.",
      details: ["Encrypted wallet storage", "Secure API connections", "Two-factor authentication", "Regular security audits"]
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: "Fund Protection",
      description: "Your cryptocurrency is stored in secure, multi-signature wallets with industry-leading cold storage solutions.",
      details: ["95% of funds in cold storage", "Insurance coverage", "Segregated user accounts", "Instant withdrawal access"]
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: "Regulatory Compliance",
      description: "We operate in full compliance with cryptocurrency regulations and follow strict KYC/AML procedures.",
      details: ["Licensed operations", "Regular compliance reviews", "Transparent reporting", "Legal framework adherence"]
    },
    {
      icon: <BarChart3 className="w-8 h-8" />,
      title: "Risk Management",
      description: "Sophisticated risk controls protect your capital from excessive losses during market volatility.",
      details: ["Automatic stop-losses", "Position size limits", "Diversification strategies", "Volatility adjustments"]
    }
  ];

  const performanceMetrics = [
    {
      icon: "📈",
      title: "Average Annual Returns",
      value: "20-50%"
    },
    {
      icon: "✅",
      title: "Win Rate",
      value: "65-70%"
    },
    {
      icon: "📊",
      title: "Maximum Drawdown",
      value: "15-20%"
    },
    {
      icon: "⚡",
      title: "Uptime",
      value: "99.9%"
    }
  ];

  const comparisonData = [
    { feature: "Trading Hours", manual: "Limited to when you're available", automated: "24/7 non-stop trading" },
    { feature: "Emotional Control", manual: "Prone to fear and greed", automated: "100% emotion-free decisions" },
    { feature: "Speed", manual: "Seconds to minutes per trade", automated: "Millisecond execution" },
    { feature: "Data Analysis", manual: "Limited human capacity", automated: "Processes thousands of data points" },
    { feature: "Consistency", manual: "Variable performance", automated: "Consistent strategy execution" },
    { feature: "Time Required", manual: "Hours of daily monitoring", automated: "Set it and forget it" },
    { feature: "Learning Curve", manual: "Years of experience needed", automated: "No trading knowledge required" }
  ];

  return (
    <div className="min-h-screen bg-black text-foreground">
      <Navigation />
      
      <div className="container px-4 pt-32 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-4xl mx-auto mb-16"
        >
          <h1 className="text-5xl md:text-6xl font-bold mb-6 text-center">
            Understanding <span className="text-primary">Automated Crypto Trading</span>
          </h1>
          
          <p className="text-xl text-gray-300 mb-8 text-center max-w-3xl mx-auto">
            Discover how SQUANCH uses cutting-edge technology to maximize your cryptocurrency investments while you sleep.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="glass rounded-2xl p-8 md:p-12 mb-20"
        >
          <h2 className="text-3xl font-bold mb-6">What is Automated Crypto Trading?</h2>
          <p className="text-lg text-gray-300 leading-relaxed">
            Automated trading uses sophisticated algorithms to execute trades on your behalf, 24/7, without human intervention. 
            Our AI-powered system analyzes market conditions, identifies opportunities, and executes trades with precision—all 
            while you focus on what matters most to you.
          </p>
        </motion.div>

        <div className="mb-20">
          <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center">Why Choose Automation?</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {automationBenefits.map((benefit, index) => (
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

        <div className="mb-20">
          <h2 className="text-3xl md:text-4xl font-bold mb-6 text-center">Manual vs. Automated Trading</h2>
          <p className="text-center text-gray-300 mb-12 max-w-2xl mx-auto">
            See why automation outperforms manual trading
          </p>
          <div className="glass rounded-2xl p-8 overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-primary/20">
                  <th className="text-left py-4 px-4 font-bold">Feature</th>
                  <th className="text-left py-4 px-4 font-bold">Manual Trading</th>
                  <th className="text-left py-4 px-4 font-bold text-primary">SQUANCH Automated Trading</th>
                </tr>
              </thead>
              <tbody>
                {comparisonData.map((row, index) => (
                  <tr key={index} className="border-b border-white/5 hover:bg-primary/5 transition-colors">
                    <td className="py-4 px-4 font-semibold">{row.feature}</td>
                    <td className="py-4 px-4 text-gray-400">{row.manual}</td>
                    <td className="py-4 px-4 text-primary flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                      {row.automated}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mb-20">
          <h2 className="text-3xl md:text-4xl font-bold mb-6 text-center">Security & Your Safety</h2>
          <p className="text-center text-gray-300 mb-12 max-w-2xl mx-auto">
            How we protect your investments
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
            <h2 className="text-3xl font-bold mb-4">Proven Performance Since 2021</h2>
            <p className="text-lg text-gray-300 max-w-3xl mx-auto">
              SQUANCH has consistently delivered strong returns across different market conditions, from bull runs to bear markets. 
              Our algorithmic approach adapts to changing conditions while maintaining risk controls.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-4 gap-6">
            {performanceMetrics.map((metric, index) => (
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
