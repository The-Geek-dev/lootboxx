import { motion } from "framer-motion";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const FAQ = () => {
  const faqs = [
    {
      question: "How does SQUANCH make trading decisions?",
      answer: "SQUANCH uses advanced machine learning algorithms that analyze thousands of market indicators, including price movements, volume patterns, order book data, and social sentiment. The AI continuously learns from market conditions and adjusts its strategies to optimize for profitability."
    },
    {
      question: "Is my money safe with SQUANCH?",
      answer: "Yes. SQUANCH never has withdrawal access to your funds. We connect to your exchange via API keys with trading permissions only. Your funds always remain in your exchange account, and you maintain full control. We use bank-grade encryption for all data transmission."
    },
    {
      question: "What is the minimum investment required?",
      answer: "The minimum investment varies by exchange and trading pair, but typically starts around $100. We recommend starting with an amount you're comfortable with while you familiarize yourself with the platform. You can always increase your investment later."
    },
    {
      question: "How much profit can I expect?",
      answer: "Returns vary based on market conditions, your chosen strategy, and risk settings. While past performance isn't indicative of future results, our users have averaged 5-15% monthly returns. Conservative strategies offer lower but more stable returns, while aggressive strategies aim for higher gains with increased risk."
    },
    {
      question: "Which exchanges does SQUANCH support?",
      answer: "SQUANCH currently supports major exchanges including Binance, Coinbase Pro, Kraken, and KuCoin. We're continuously adding support for more exchanges based on user demand."
    },
    {
      question: "Can I stop the bot at any time?",
      answer: "Absolutely. You have complete control and can pause, stop, or modify your bot settings at any time through the dashboard. Your funds remain in your exchange account, so you can withdraw them whenever you wish."
    },
    {
      question: "Do I need trading experience?",
      answer: "No trading experience is required. SQUANCH is designed for both beginners and experienced traders. We offer pre-configured strategies for those new to trading, and advanced customization options for experienced users."
    },
    {
      question: "What are the fees?",
      answer: "SQUANCH operates on a subscription model with three tiers: Basic ($29/month), Pro ($79/month), and Elite ($199/month). There are no hidden fees or commissions on your profits. You only pay the subscription fee."
    },
    {
      question: "How quickly can I withdraw profits?",
      answer: "Since your funds are always in your exchange account, you can withdraw at any time according to your exchange's policies. SQUANCH doesn't hold your funds, so there's no withdrawal process through us."
    },
    {
      question: "What if the market crashes?",
      answer: "SQUANCH includes risk management features like stop-loss orders and position sizing to protect your capital during downturns. The bot can be configured to take defensive positions or pause trading during extreme market volatility."
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
            Frequently Asked <span className="text-primary">Questions</span>
          </h1>
          
          <p className="text-xl text-gray-300 mb-16 text-center max-w-3xl mx-auto">
            Everything you need to know about SQUANCH and automated crypto trading
          </p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass rounded-2xl p-8 md:p-12"
          >
            <Accordion type="single" collapsible className="space-y-4">
              {faqs.map((faq, index) => (
                <AccordionItem key={index} value={`item-${index}`} className="border-white/10">
                  <AccordionTrigger className="text-left text-lg font-semibold hover:text-primary">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-gray-400 text-base">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-12 text-center"
          >
            <p className="text-lg text-gray-300 mb-4">
              Still have questions?
            </p>
            <a href="/contact" className="text-primary hover:underline text-lg font-medium">
              Contact our support team →
            </a>
          </motion.div>
        </motion.div>
      </div>

      <Footer />
    </div>
  );
};

export default FAQ;
