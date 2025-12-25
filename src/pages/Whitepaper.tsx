import { motion } from "framer-motion";
import { FileText, Download, Zap, Shield, TrendingUp, Users, Cpu, Coins, Calendar, Target, ChevronRight } from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import MascotBackground from "@/components/MascotBackground";
import { Button } from "@/components/ui/button";

const sections = [
  { id: "executive-summary", label: "Executive Summary", number: "1" },
  { id: "problem-statement", label: "Problem Statement", number: "2" },
  { id: "solution", label: "The Solution", number: "3" },
  { id: "architecture", label: "Technical Architecture", number: "4" },
  { id: "tokenomics", label: "Tokenomics", number: "5" },
  { id: "roadmap", label: "Roadmap", number: "6" },
  { id: "team", label: "The Team", number: "7" },
  { id: "conclusion", label: "Conclusion", number: "8" },
];

const scrollToSection = (id: string) => {
  const element = document.getElementById(id);
  if (element) {
    const offset = 100;
    const elementPosition = element.getBoundingClientRect().top;
    const offsetPosition = elementPosition + window.pageYOffset - offset;
    
    window.scrollTo({
      top: offsetPosition,
      behavior: "smooth"
    });
  }
};

const Whitepaper = () => {
  return (
    <div className="min-h-screen bg-black text-foreground scroll-smooth">
      <Navigation />
      
      <motion.section 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="container px-4 pt-32 pb-20 relative overflow-hidden"
      >
        <MascotBackground position="center" />
        <MascotBackground variant="watermark" corner="top-right" />
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="inline-block mb-4 px-4 py-1.5 rounded-full glass"
          >
            <span className="text-sm font-medium">
              <FileText className="w-4 h-4 inline-block mr-2" />
              Technical Documentation
            </span>
          </motion.div>

          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            SQUANCH AI White Paper
          </h1>
          
          <p className="text-xl text-primary mb-2">
            The Convergence of Artificial Intelligence and Blockchain Intelligence
          </p>
          
          <p className="text-muted-foreground mb-8">
            Version 1.0 | 2025
          </p>

          {/* Table of Contents */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass rounded-xl p-6 mb-8"
          >
            <h3 className="text-lg font-semibold mb-4">Table of Contents</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {sections.map((section, index) => (
                <motion.button
                  key={section.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + index * 0.05 }}
                  onClick={() => scrollToSection(section.id)}
                  className="flex items-center gap-2 text-left text-muted-foreground hover:text-primary transition-colors duration-200 group py-2 px-3 rounded-lg hover:bg-white/5"
                >
                  <span className="text-primary font-medium">{section.number}.</span>
                  <span className="group-hover:translate-x-1 transition-transform duration-200">{section.label}</span>
                  <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200 ml-auto" />
                </motion.button>
              ))}
            </div>
          </motion.div>

          {/* Executive Summary */}
          <motion.div 
            id="executive-summary"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5 }}
            className="glass rounded-xl p-8 mb-8 scroll-mt-28"
          >
            <div className="flex items-center gap-3 mb-4">
              <Target className="w-6 h-6 text-primary" />
              <h2 className="text-2xl font-semibold">1. Executive Summary</h2>
            </div>
            <p className="text-muted-foreground mb-6">
              The cryptocurrency market has entered a new era of maturity, with a global market cap exceeding $3 trillion as of 2025. Despite this growth, the landscape remains fraught with information asymmetry, sophisticated market manipulation, and the constant threat of "rug pulls." Retail traders are often left at a disadvantage, lacking the computational power and real-time data access utilized by institutional entities.
            </p>
            <p className="text-muted-foreground mb-6">
              SQUANCH AI is a comprehensive ecosystem designed to level the playing field. By integrating advanced Artificial Intelligence (AI) and Machine Learning (ML) with real-time blockchain analytics, we provide users with "Alpha"—a tangible competitive edge. Our platform automates the detection of high-value signals, mitigates security risks via the KOLSCAN protocol, and lowers entry barriers through our pioneering Bootstrap Program.
            </p>
            
            <a href="/SQUANCH-Whitepaper.pdf" download>
              <Button className="button-gradient">
                <Download className="mr-2 w-4 h-4" />
                Download Full White Paper
              </Button>
            </a>
          </motion.div>

          {/* Problem Statement */}
          <motion.div 
            id="problem-statement"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5 }}
            className="glass rounded-xl p-6 mb-6 scroll-mt-28"
          >
            <div className="flex items-center gap-3 mb-4">
              <Shield className="w-6 h-6 text-primary" />
              <h3 className="text-xl font-semibold">2. Problem Statement</h3>
            </div>
            <p className="text-muted-foreground mb-4">
              The current decentralized finance (DeFi) environment faces four critical bottlenecks that hinder mass adoption and profitability:
            </p>
            <ul className="space-y-3 text-muted-foreground">
              <li className="flex gap-3">
                <span className="text-primary font-bold">1.</span>
                <span><strong className="text-white">Information Overload:</strong> While blockchain data is public, the sheer volume of transactions across dozens of chains makes manual tracking impossible for human traders.</span>
              </li>
              <li className="flex gap-3">
                <span className="text-primary font-bold">2.</span>
                <span><strong className="text-white">High Barriers to Entry:</strong> Steep learning curves and the financial friction of gas fees discourage 90% of potential new participants.</span>
              </li>
              <li className="flex gap-3">
                <span className="text-primary font-bold">3.</span>
                <span><strong className="text-white">Fraud and Market Manipulation:</strong> Malicious actors and "Key Opinion Leaders" (KOLs) frequently exploit retail sentiment to orchestrate rug pulls, costing investors billions annually.</span>
              </li>
              <li className="flex gap-3">
                <span className="text-primary font-bold">4.</span>
                <span><strong className="text-white">Analytical Inefficiency:</strong> Manual chart reading is prone to bias and fatigue, leading to missed opportunities and poor risk management.</span>
              </li>
            </ul>
          </motion.div>

          {/* Key Ecosystem Features */}
          <motion.div 
            id="solution"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5 }}
            className="space-y-6 mb-8 scroll-mt-28"
          >
            <div className="flex items-center gap-3 mb-2">
              <Zap className="w-6 h-6 text-primary" />
              <h3 className="text-2xl font-semibold">3. The Solution: Key Ecosystem Features</h3>
            </div>
            <p className="text-muted-foreground mb-4">
              SQUANCH AI addresses these systemic issues through a modular, AI-first architecture.
            </p>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4 }}
              className="glass rounded-xl p-6"
            >
              <h4 className="text-lg font-semibold mb-3 text-primary">3.1 AlphaChain: On-Chain Tracking & AI Trading</h4>
              <p className="text-muted-foreground mb-3">
                AlphaChain is the engine of the SQUANCH ecosystem. It monitors multi-chain transactions in real-time, pulling data from Etherscan, Solana Explorer, and BSCScan.
              </p>
              <ul className="space-y-2 text-muted-foreground">
                <li>• <strong className="text-white">Real-Time Monitoring:</strong> Instant alerts for whale movements, DEX swaps, and NFT floor sweeps.</li>
                <li>• <strong className="text-white">AI-Driven Execution:</strong> Bots utilize reinforcement learning to execute trades autonomously, optimizing for slippage and gas efficiency.</li>
                <li>• <strong className="text-white">Predictive Modeling:</strong> We utilize Long Short-Term Memory (LSTM) networks for time-series forecasting, predicting price action with sub-second latency.</li>
              </ul>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="glass rounded-xl p-6"
            >
              <h4 className="text-lg font-semibold mb-3 text-primary">3.2 The Bootstrap Program: Fee-Free Entry</h4>
              <p className="text-muted-foreground mb-3">
                To foster community growth, the first 10,000 new users are eligible for our Bootstrap Program:
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <tbody>
                    <tr className="border-b border-white/10">
                      <td className="py-3 pr-4 font-medium text-white">Pre-funded Accounts:</td>
                      <td className="py-3 text-muted-foreground">Up to 500 in SQH tokens.</td>
                    </tr>
                    <tr className="border-b border-white/10">
                      <td className="py-3 pr-4 font-medium text-white">Zero-Fee Period:</td>
                      <td className="py-3 text-muted-foreground">No transaction, withdrawal, or subscription fees for the first 6 months.</td>
                    </tr>
                    <tr>
                      <td className="py-3 pr-4 font-medium text-white">KYC Integration:</td>
                      <td className="py-3 text-muted-foreground">Secure verification ensures the sustainability of the treasury-backed funding pool.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="glass rounded-xl p-6"
            >
              <h4 className="text-lg font-semibold mb-3 text-primary">3.3 KOLSCAN: Anti-Rug Protocol</h4>
              <p className="text-muted-foreground mb-3">
                KOLSCAN acts as a decentralized oracle for trust. It evaluates the "Alpha" provided by social media influencers and scans smart contracts for malicious backdoors.
              </p>
              <ul className="space-y-2 text-muted-foreground">
                <li>• <strong className="text-white">Sentiment & Accuracy Analysis:</strong> Uses Natural Language Processing (NLP) to score the historical reliability of KOLs on X, Telegram, and Discord.</li>
                <li>• <strong className="text-white">On-Chain Auditing:</strong> Detects red flags like unlocked liquidity or centralized owner privileges with 95% accuracy.</li>
              </ul>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.3 }}
              className="glass rounded-xl p-6"
            >
              <h4 className="text-lg font-semibold mb-3 text-primary">3.4 AI Chart Reading & Alpha Placements</h4>
              <p className="text-muted-foreground mb-3">
                Our Computer Vision models identify complex technical patterns (flags, wedges, Fibonacci levels) across multiple timeframes simultaneously.
              </p>
              <ul className="space-y-2 text-muted-foreground">
                <li>• <strong className="text-white">Ensemble Methodology:</strong> Combines Random Forest and Gradient Boosting for high-confidence market trend forecasting.</li>
                <li>• <strong className="text-white">Alpha Placements:</strong> Delivers personalized trade signals with back-tested win rates exceeding 70%.</li>
              </ul>
            </motion.div>
          </motion.div>

          {/* Technical Architecture */}
          <motion.div 
            id="architecture"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5 }}
            className="glass rounded-xl p-6 mb-6 scroll-mt-28"
          >
            <div className="flex items-center gap-3 mb-4">
              <Cpu className="w-6 h-6 text-primary" />
              <h3 className="text-xl font-semibold">4. Technical Architecture</h3>
            </div>
            <p className="text-muted-foreground mb-4">
              SQUANCH is built on a high-throughput, hybrid infrastructure:
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/20">
                    <th className="py-3 pr-4 text-left font-semibold text-white">Component</th>
                    <th className="py-3 text-left font-semibold text-white">Technology</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-white/10">
                    <td className="py-3 pr-4 text-muted-foreground">Frontend</td>
                    <td className="py-3 text-muted-foreground">React-based Web & Mobile Apps</td>
                  </tr>
                  <tr className="border-b border-white/10">
                    <td className="py-3 pr-4 text-muted-foreground">Backend</td>
                    <td className="py-3 text-muted-foreground">Node.js</td>
                  </tr>
                  <tr className="border-b border-white/10">
                    <td className="py-3 pr-4 text-muted-foreground">AI/ML Stack</td>
                    <td className="py-3 text-muted-foreground">TensorFlow & PyTorch</td>
                  </tr>
                  <tr className="border-b border-white/10">
                    <td className="py-3 pr-4 text-muted-foreground">Decentralized Compute</td>
                    <td className="py-3 text-muted-foreground">Akash / Render Network</td>
                  </tr>
                  <tr className="border-b border-white/10">
                    <td className="py-3 pr-4 text-muted-foreground">Blockchain</td>
                    <td className="py-3 text-muted-foreground">Ethereum (Governance) & Polygon (Layer-2)</td>
                  </tr>
                  <tr>
                    <td className="py-3 pr-4 text-muted-foreground">Scalability</td>
                    <td className="py-3 text-muted-foreground">Up to 10,000 TPS</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </motion.div>

          {/* Tokenomics */}
          <motion.div 
            id="tokenomics"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5 }}
            className="glass rounded-xl p-6 mb-6 scroll-mt-28"
          >
            <div className="flex items-center gap-3 mb-4">
              <Coins className="w-6 h-6 text-primary" />
              <h3 className="text-xl font-semibold">5. Tokenomics ($SQH)</h3>
            </div>
            <p className="text-muted-foreground mb-4">
              The $SQH token is the utility backbone of the ecosystem, designed with a deflationary bias.
            </p>
            <p className="text-white font-semibold mb-4">Total Supply: 1,000,000,000 $SQH</p>
            
            <h4 className="text-white font-medium mb-3">Distribution Breakdown</h4>
            <div className="overflow-x-auto mb-6">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/20">
                    <th className="py-3 pr-4 text-left font-semibold text-white">Percentage</th>
                    <th className="py-3 text-left font-semibold text-white">Description</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-white/10">
                    <td className="py-3 pr-4 text-primary font-medium">40%</td>
                    <td className="py-3 text-muted-foreground">Community Incentives & Staking Rewards</td>
                  </tr>
                  <tr className="border-b border-white/10">
                    <td className="py-3 pr-4 text-primary font-medium">20%</td>
                    <td className="py-3 text-muted-foreground">Team (3-Year Vesting Schedule)</td>
                  </tr>
                  <tr className="border-b border-white/10">
                    <td className="py-3 pr-4 text-primary font-medium">20%</td>
                    <td className="py-3 text-muted-foreground">Liquidity & Marketing</td>
                  </tr>
                  <tr className="border-b border-white/10">
                    <td className="py-3 pr-4 text-primary font-medium">10%</td>
                    <td className="py-3 text-muted-foreground">Treasury for Funded Accounts</td>
                  </tr>
                  <tr>
                    <td className="py-3 pr-4 text-primary font-medium">10%</td>
                    <td className="py-3 text-muted-foreground">Ongoing Development Fund</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h4 className="text-white font-medium mb-3">Utility & Deflation</h4>
            <ul className="space-y-2 text-muted-foreground">
              <li>• <strong className="text-white">Staking:</strong> Up to 15% APY.</li>
              <li>• <strong className="text-white">Burn Mechanism:</strong> A 0.5% burn tax on every transaction progressively reduces total supply.</li>
              <li>• <strong className="text-white">Access:</strong> Holding $SQH grants access to premium AI features and governance voting rights.</li>
            </ul>
          </motion.div>

          {/* Roadmap */}
          <motion.div 
            id="roadmap"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5 }}
            className="glass rounded-xl p-6 mb-6 scroll-mt-28"
          >
            <div className="flex items-center gap-3 mb-4">
              <Calendar className="w-6 h-6 text-primary" />
              <h3 className="text-xl font-semibold">6. Roadmap</h3>
            </div>
            
            <h4 className="text-white font-medium mb-4">2026: The Year of Deployment</h4>
            <div className="space-y-4 text-muted-foreground mb-6">
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3 }}
                className="border-l-2 border-primary pl-4"
              >
                <h5 className="text-white font-medium mb-1">Q1: Beta Launch</h5>
                <p>AlphaChain tracking and core AI trading bots.</p>
              </motion.div>
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: 0.1 }}
                className="border-l-2 border-primary pl-4"
              >
                <h5 className="text-white font-medium mb-1">Q2: Expansion</h5>
                <p>Deployment of the Bootstrap Program and KOLSCAN integration.</p>
              </motion.div>
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: 0.2 }}
                className="border-l-2 border-primary pl-4"
              >
                <h5 className="text-white font-medium mb-1">Q3: Intelligence Update</h5>
                <p>Full AI chart reading and Alpha Placement release.</p>
              </motion.div>
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: 0.3 }}
                className="border-l-2 border-primary pl-4"
              >
                <h5 className="text-white font-medium mb-1">Q4: Mainnet</h5>
                <p>Transition to decentralized governance and DEX partnerships.</p>
              </motion.div>
            </div>

            <h4 className="text-white font-medium mb-4">2027: Global Scaling</h4>
            <ul className="space-y-2 text-muted-foreground">
              <li>• Multi-chain expansion to emerging networks.</li>
              <li>• Advanced AI upgrades focusing on cross-chain arbitrage.</li>
            </ul>
          </motion.div>

          {/* The Team */}
          <motion.div 
            id="team"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5 }}
            className="glass rounded-xl p-6 mb-6 scroll-mt-28"
          >
            <div className="flex items-center gap-3 mb-4">
              <Users className="w-6 h-6 text-primary" />
              <h3 className="text-xl font-semibold">7. The Team</h3>
            </div>
            <p className="text-muted-foreground">
              SQUANCH is spearheaded by the APEX ARISTOCRAT CABAL, a collective of seasoned blockchain developers, data scientists, and veteran traders. Our advisory board includes pioneers from leading organizations such as Binance and OpenAI. We believe in radical transparency; our team is fully doxxed, with credentials verifiable via LinkedIn.
            </p>
          </motion.div>

          {/* Conclusion */}
          <motion.div 
            id="conclusion"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5 }}
            className="glass rounded-xl p-6 mb-8 scroll-mt-28"
          >
            <div className="flex items-center gap-3 mb-4">
              <TrendingUp className="w-6 h-6 text-primary" />
              <h3 className="text-xl font-semibold">8. Conclusion</h3>
            </div>
            <p className="text-muted-foreground mb-4">
              SQUANCH AI is more than a trading tool; it is a fundamental shift in how retail investors interact with decentralized markets. By automating the "hard" parts of crypto—data analysis, risk assessment, and execution—we empower our users to trade with the precision of a machine and the intuition of a pro.
            </p>
            <p className="text-xl font-semibold text-primary">Join the Revolution.</p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <p className="text-muted-foreground mb-4">
              For complete technical details, tokenomics, and strategic roadmap
            </p>
            <a href="/SQUANCH-Whitepaper.pdf" download>
              <Button size="lg" className="button-gradient">
                <Download className="mr-2 w-5 h-5" />
                Download Complete White Paper
              </Button>
            </a>
          </motion.div>
        </div>
      </motion.section>

      <Footer />
    </div>
  );
};

export default Whitepaper;
