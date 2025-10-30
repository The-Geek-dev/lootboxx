import { motion } from "framer-motion";
import { CheckCircle2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

const HowItWorks = () => {
  const steps = [
    {
      number: "01",
      title: "Start on Telegram",
      description: "Connect with our Astra Bot on Telegram. This is where your entire investment journey begins. Our bot guides you through setup and provides 24/7 support.",
      details: ["Easy-to-follow conversation flow", "Instant notifications and updates", "Manage everything from your phone"]
    },
    {
      number: "02",
      title: "Create Your Account",
      description: "Sign up with basic information through the bot. Set a secure password and verify your identity. The entire process takes less than 2 minutes.",
      details: ["No complicated forms", "Quick identity verification", "Instant account activation"]
    },
    {
      number: "03",
      title: "Generate Your Wallet",
      description: "Receive your secure crypto wallet addresses generated exclusively for you. Support for Bitcoin, Ethereum, USDT, and 10+ other cryptocurrencies.",
      details: ["Multi-currency support", "Bank-grade encryption", "Your addresses are unique and secure"]
    },
    {
      number: "04",
      title: "Make Your First Deposit",
      description: "Transfer cryptocurrency to your wallet. Minimum deposit is just $10 to get started. Funds appear in your account instantly—no waiting periods.",
      details: ["Minimum $10 to start", "Instant fund confirmation", "No hidden fees or charges"]
    },
    {
      number: "05",
      title: "Choose Your Strategy",
      description: "Select from multiple automated trading strategies based on your risk tolerance. Conservative, Balanced, or Aggressive—we have options for every investor.",
      details: ["Professional trading algorithms", "Risk-adjusted strategies", "Change strategies anytime"]
    },
    {
      number: "06",
      title: "Let It Grow",
      description: "Your automated trading system is now live. Watch your portfolio grow 24/7 as our AI executes trades based on real-time market signals. Monitor everything via the bot.",
      details: ["Live performance tracking", "Real-time profit updates", "Withdraw anytime, no lockups"]
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
            Your Journey to <span className="text-primary">Automated Crypto Investing</span>
          </h1>
          
          <p className="text-xl text-gray-300 mb-16 text-center max-w-3xl mx-auto">
            Follow our simple 6-step process to start growing your wealth with Astra. From account creation to your first automated trade in minutes.
          </p>

          <div className="space-y-12 mb-20">
            {steps.map((step, index) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="glass rounded-2xl p-8 md:p-10"
              >
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="text-6xl font-bold text-primary/20 md:min-w-[100px]">
                    {step.number}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold mb-3">{step.title}</h3>
                    <p className="text-lg text-gray-300 mb-4">{step.description}</p>
                    <ul className="space-y-2">
                      {step.details.map((detail) => (
                        <li key={detail} className="flex items-start gap-2">
                          <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                          <span className="text-gray-400">{detail}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="glass rounded-2xl p-8 md:p-12 text-center"
          >
            <h2 className="text-3xl font-bold mb-4">Ready to Begin Your Journey?</h2>
            <p className="text-lg text-gray-300 mb-8 max-w-2xl mx-auto">
              Start automated trading in under 5 minutes. Join thousands earning passive income with Astra.
            </p>
            <Button size="lg" className="button-gradient">
              Activate Your Bot <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </motion.div>
        </motion.div>
      </div>

      <Footer />
    </div>
  );
};

export default HowItWorks;
