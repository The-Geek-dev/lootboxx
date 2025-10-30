import { motion } from "framer-motion";
import { CheckCircle2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

const HowItWorks = () => {
  const steps = [
    {
      number: "01",
      title: "Connect Your Exchange",
      description: "Securely link Astra to your preferred crypto exchange using API keys. Your funds stay in your account - we never have withdrawal access.",
      details: ["Support for major exchanges", "Encrypted API connections", "Read-only access option"]
    },
    {
      number: "02",
      title: "Configure Your Strategy",
      description: "Choose from pre-built strategies or customize your own. Set risk levels, trading pairs, and investment amounts.",
      details: ["Conservative to aggressive strategies", "Multiple asset support", "Customizable risk parameters"]
    },
    {
      number: "03",
      title: "AI Analyzes Markets",
      description: "Astra's advanced algorithms continuously scan markets, analyzing thousands of data points to identify profitable opportunities.",
      details: ["24/7 market monitoring", "Technical analysis", "Sentiment analysis"]
    },
    {
      number: "04",
      title: "Automatic Execution",
      description: "When opportunities arise, Astra executes trades instantly with precision timing and optimal pricing.",
      details: ["Lightning-fast execution", "Smart order routing", "Risk management built-in"]
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
            How <span className="text-primary">Astra</span> Works
          </h1>
          
          <p className="text-xl text-gray-300 mb-16 text-center max-w-3xl mx-auto">
            Get started in minutes and let AI handle the complexity of crypto trading
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
            <h2 className="text-3xl font-bold mb-4">Ready to Start?</h2>
            <p className="text-lg text-gray-300 mb-8 max-w-2xl mx-auto">
              Join thousands of traders who are already earning passive income with Astra's intelligent trading.
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
