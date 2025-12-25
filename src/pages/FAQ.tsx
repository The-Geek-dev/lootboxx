import { motion } from "framer-motion";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import MascotBackground from "@/components/MascotBackground";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const FAQ = () => {
  const faqs = [
    // General Questions
    {
      category: "General",
      question: "What is SQUANCH AI?",
      answer: "SQUANCH AI is a comprehensive ecosystem that combines advanced Artificial Intelligence (AI) and Machine Learning (ML) with real-time blockchain analytics. We provide users with 'Alpha'—a tangible competitive edge in the cryptocurrency market through automated signal detection, security risk mitigation via KOLSCAN, and lowered entry barriers through our Bootstrap Program."
    },
    {
      category: "General",
      question: "What problems does SQUANCH solve?",
      answer: "SQUANCH addresses four critical bottlenecks in the DeFi environment: 1) Information Overload - tracking transactions across dozens of chains is impossible manually, 2) High Barriers to Entry - steep learning curves and gas fees discourage new participants, 3) Fraud and Market Manipulation - rug pulls cost investors billions annually, and 4) Analytical Inefficiency - manual chart reading leads to missed opportunities."
    },
    // AlphaChain & Trading
    {
      category: "Trading",
      question: "What is AlphaChain and how does it work?",
      answer: "AlphaChain is the engine of the SQUANCH ecosystem. It monitors multi-chain transactions in real-time from Etherscan, Solana Explorer, and BSCScan. Features include: instant alerts for whale movements and DEX swaps, AI-driven bots using reinforcement learning for autonomous trade execution, and LSTM networks for time-series price forecasting with sub-second latency."
    },
    {
      category: "Trading",
      question: "How does the AI make trading decisions?",
      answer: "Our AI uses Computer Vision models to identify complex technical patterns (flags, wedges, Fibonacci levels) across multiple timeframes simultaneously. We employ an Ensemble Methodology combining Random Forest and Gradient Boosting for high-confidence market trend forecasting, delivering personalized trade signals with back-tested win rates exceeding 70%."
    },
    {
      category: "Trading",
      question: "Which blockchains does SQUANCH support?",
      answer: "SQUANCH currently monitors and trades across multiple major blockchains including Ethereum, Solana, and Binance Smart Chain (BSC). Our infrastructure is built on Ethereum for governance and Polygon for Layer-2 scalability, supporting up to 10,000 transactions per second."
    },
    // Security & KOLSCAN
    {
      category: "Security",
      question: "What is KOLSCAN and how does it protect me?",
      answer: "KOLSCAN is our decentralized oracle for trust that acts as an Anti-Rug Protocol. It evaluates the 'Alpha' provided by social media influencers using Natural Language Processing (NLP) to score their historical reliability on X, Telegram, and Discord. It also performs on-chain auditing to detect red flags like unlocked liquidity or centralized owner privileges with 95% accuracy."
    },
    {
      category: "Security",
      question: "Is my money safe with SQUANCH?",
      answer: "Yes. SQUANCH never has withdrawal access to your funds. We connect to your exchange via API keys with trading permissions only. Your funds always remain in your exchange account, and you maintain full control. We use bank-grade encryption for all data transmission and our KOLSCAN protocol actively protects against rug pulls and market manipulation."
    },
    // Bootstrap Program & Getting Started
    {
      category: "Getting Started",
      question: "What is the Bootstrap Program?",
      answer: "To foster community growth, the first 10,000 new users are eligible for our Bootstrap Program which includes: Pre-funded accounts with up to 500 SQH tokens, a Zero-Fee Period with no transaction, withdrawal, or subscription fees for the first 6 months, and secure KYC Integration to ensure the sustainability of the treasury-backed funding pool."
    },
    {
      category: "Getting Started",
      question: "What is the minimum investment required?",
      answer: "The minimum investment varies by exchange and trading pair, but typically starts around $100. With our Bootstrap Program, eligible users can start with pre-funded SQH tokens. We recommend starting with an amount you're comfortable with while you familiarize yourself with the platform."
    },
    {
      category: "Getting Started",
      question: "Do I need trading experience?",
      answer: "No trading experience is required. SQUANCH is designed for both beginners and experienced traders. Our AI handles the complex technical analysis and trade execution. We offer pre-configured strategies for newcomers, while advanced users can customize parameters to their preferences."
    },
    // Tokenomics & SQH Token
    {
      category: "Tokenomics",
      question: "What is the SQH token and its utility?",
      answer: "SQH is our native utility and governance token with a total supply of 1 billion tokens. It's used for platform governance voting, accessing premium features, staking rewards, and ecosystem participation. The distribution includes: 40% Community & Ecosystem, 20% Team (3-year vesting), 15% Private Sale, 15% Liquidity & Treasury, and 10% Airdrop & Marketing."
    },
    {
      category: "Tokenomics",
      question: "What are the fees and how do I earn?",
      answer: "SQUANCH operates on a subscription model with tiered access. Token holders can earn through staking rewards and governance participation. The Bootstrap Program offers a zero-fee period for the first 6 months for early adopters. Platform fees are used to buy back and burn SQH tokens, creating deflationary pressure."
    },
    // Technical Questions
    {
      category: "Technical",
      question: "What technology powers SQUANCH?",
      answer: "SQUANCH is built on a high-throughput, hybrid infrastructure: React-based Web & Mobile Apps for frontend, Node.js backend, TensorFlow & PyTorch for AI/ML, Akash/Render Network for decentralized compute, and Ethereum (Governance) with Polygon (Layer-2) for blockchain operations. We can handle up to 10,000 transactions per second."
    },
    {
      category: "Technical",
      question: "Can I access SQUANCH via API?",
      answer: "Yes! SQUANCH provides a comprehensive Trading Bot API for programmatic access. You can generate API keys with customizable permissions (read/write) from your Settings page. The API provides endpoints for bot status, trade history, and configuration management."
    },
    // Control & Withdrawals
    {
      category: "Control",
      question: "Can I stop the bot at any time?",
      answer: "Absolutely. You have complete control and can pause, stop, or modify your bot settings at any time through the dashboard. Your funds remain in your exchange account, so you can withdraw them whenever you wish. The bot includes risk management features like stop-loss orders."
    },
    {
      category: "Control",
      question: "How quickly can I withdraw profits?",
      answer: "Since your funds are always in your exchange account, you can withdraw at any time according to your exchange's policies. SQUANCH doesn't hold your funds, so there's no withdrawal process through us—you have direct access to your assets at all times."
    },
    // Risk Management
    {
      category: "Risk",
      question: "What if the market crashes?",
      answer: "SQUANCH includes comprehensive risk management features: stop-loss orders, position sizing, and our KOLSCAN anti-rug protocol. The AI can be configured to take defensive positions or pause trading during extreme market volatility. Our reinforcement learning models continuously adapt to changing market conditions."
    },
    {
      category: "Risk",
      question: "What returns can I expect?",
      answer: "Returns vary based on market conditions, your chosen strategy, and risk settings. Our AI-powered Alpha Placements deliver trade signals with back-tested win rates exceeding 70%. Conservative strategies offer more stable returns, while aggressive strategies aim for higher gains with increased risk. Past performance isn't indicative of future results."
    }
  ];

  return (
    <div className="min-h-screen bg-black text-foreground">
      <Navigation />
      
      <div className="container px-4 pt-32 pb-20 relative overflow-hidden">
        <MascotBackground position="right" />
        <MascotBackground variant="watermark" corner="top-left" />
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
                    <div className="flex items-start gap-3">
                      <span className="text-xs px-2 py-1 rounded-full bg-primary/20 text-primary shrink-0 mt-1">
                        {faq.category}
                      </span>
                      <span>{faq.question}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="text-gray-400 text-base pl-16">
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
