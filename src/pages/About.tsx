import { motion } from "framer-motion";
import { Bot, Shield, TrendingUp, Zap } from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

const About = () => {
  const values = [
    {
      icon: Bot,
      title: "AI-Powered Intelligence",
      description: "Advanced machine learning algorithms analyze market patterns 24/7 to identify profitable trading opportunities."
    },
    {
      icon: Shield,
      title: "Security First",
      description: "Bank-grade encryption and secure API connections ensure your funds and data are always protected."
    },
    {
      icon: TrendingUp,
      title: "Proven Results",
      description: "Consistently outperforming manual trading with data-driven decisions and instant execution."
    },
    {
      icon: Zap,
      title: "Lightning Fast",
      description: "Execute trades in milliseconds, taking advantage of market opportunities before they disappear."
    }
  ];

  return (
    <div className="min-h-screen bg-black text-foreground">
      <Navigation />
      
      <div className="container px-4 pt-32 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-4xl mx-auto"
        >
          <h1 className="text-5xl md:text-6xl font-bold mb-6 text-center">
            About <span className="text-primary">Astra</span>
          </h1>
          
          <p className="text-xl text-gray-300 mb-12 text-center max-w-3xl mx-auto">
            Astra is an advanced AI-powered crypto trading bot designed to maximize your profits 
            while you sleep. Built by traders, for traders.
          </p>

          <div className="glass rounded-2xl p-8 md:p-12 mb-16">
            <h2 className="text-3xl font-bold mb-6">Our Mission</h2>
            <p className="text-lg text-gray-300 mb-4">
              We believe that sophisticated trading strategies shouldn't be limited to institutional 
              investors and hedge funds. Astra democratizes access to professional-grade trading 
              algorithms, allowing anyone to benefit from AI-powered market analysis.
            </p>
            <p className="text-lg text-gray-300">
              Our team of experienced traders and AI engineers has developed a system that combines 
              technical analysis, sentiment analysis, and machine learning to make intelligent trading 
              decisions in real-time.
            </p>
          </div>

          <h2 className="text-3xl font-bold mb-12 text-center">What Sets Us Apart</h2>
          
          <div className="grid md:grid-cols-2 gap-6 mb-16">
            {values.map((value, index) => (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="glass glass-hover rounded-xl p-6"
              >
                <value.icon className="w-12 h-12 text-primary mb-4" />
                <h3 className="text-xl font-semibold mb-2">{value.title}</h3>
                <p className="text-gray-400">{value.description}</p>
              </motion.div>
            ))}
          </div>

          <div className="glass rounded-2xl p-8 md:p-12 text-center">
            <h2 className="text-3xl font-bold mb-4">Join Thousands of Satisfied Traders</h2>
            <p className="text-lg text-gray-300 mb-8">
              Astra has already helped traders generate over $50M in profits. Start your journey today.
            </p>
            <div className="flex flex-wrap justify-center gap-12">
              <div>
                <div className="text-4xl font-bold text-primary mb-2">10,000+</div>
                <div className="text-gray-400">Active Users</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-primary mb-2">$50M+</div>
                <div className="text-gray-400">Total Profits</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-primary mb-2">99.9%</div>
                <div className="text-gray-400">Uptime</div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      <Footer />
    </div>
  );
};

export default About;
