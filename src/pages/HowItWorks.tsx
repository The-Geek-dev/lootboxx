import { motion } from "framer-motion";
import { CheckCircle2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navigation from "@/components/Navigation";
import AppSidebar from "@/components/AppSidebar";
import Footer from "@/components/Footer";
import MascotBackground from "@/components/MascotBackground";
import { Link } from "react-router-dom";

const HowItWorks = () => {
  const steps = [
    {
      number: "01",
      title: "Create Your Account",
      description: "Sign up for free in seconds. Provide your basic info and verify your email to get started on LootBoxx.",
      details: ["Quick registration process", "Email verification", "Instant account activation"]
    },
    {
      number: "02",
      title: "Deposit Funds",
      description: "Add funds to your LootBoxx wallet. We accept multiple payment methods for easy deposits starting from ₦7,000.",
      details: ["Multiple payment options", "Secure transactions", "Instant balance updates"]
    },
    {
      number: "03",
      title: "Buy Coupons",
      description: "Use your balance to buy game coupons. Coupons give you access to various games — raffles, spin-the-wheel, trivia and more.",
      details: ["Choose your favorite games", "Multiple coupon tiers", "Better coupons = bigger rewards"]
    },
    {
      number: "04",
      title: "Play & Win",
      description: "Play exciting games and win real rewards! Every game gives you a chance to multiply your investment.",
      details: ["Fair and transparent games", "Instant reward distribution", "Multiple games to choose from"]
    },
    {
      number: "05",
      title: "Refer Friends",
      description: "Share your referral code with friends. When they sign up and play, you both earn bonus rewards.",
      details: ["Unique referral code", "Earn on every referral", "No limit on referrals"]
    },
    {
      number: "06",
      title: "Withdraw Winnings",
      description: "Withdraw your winnings anytime directly to your bank account or wallet. Fast and hassle-free.",
      details: ["Quick withdrawal processing", "Multiple withdrawal options", "No hidden fees"]
    }
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navigation />
      <AppSidebar />
      <div className="md:pl-16 container px-4 pt-32 pb-20 relative overflow-hidden">
        <MascotBackground position="center" />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-4xl mx-auto"
        >
          <h1 className="text-5xl md:text-6xl font-bold mb-6 text-center">
            How <span className="text-primary">LootBoxx</span> Works
          </h1>
          
          <p className="text-xl text-gray-300 mb-16 text-center max-w-3xl mx-auto">
            Follow our simple 6-step process to start playing games and winning rewards on LootBoxx.
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
            <h2 className="text-3xl font-bold mb-4">Ready to Start Winning?</h2>
            <p className="text-lg text-gray-300 mb-8 max-w-2xl mx-auto">
              Create your account in under a minute and start playing exciting games on LootBoxx today.
            </p>
            <Link to="/signup">
              <Button size="lg" className="button-gradient">
                Create Account <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
          </motion.div>
        </motion.div>
      </div>

      <Footer />
    </div>
  );
};

export default HowItWorks;
