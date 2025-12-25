import { motion } from "framer-motion";
import { FileText, Download } from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import MascotBackground from "@/components/MascotBackground";
import { Button } from "@/components/ui/button";

const Whitepaper = () => {
  return (
    <div className="min-h-screen bg-black text-foreground">
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

          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            SQUANCH White Paper
          </h1>
          
          <p className="text-lg text-muted-foreground mb-8">
            AI-Powered Cryptocurrency Trading - Version 1.4
          </p>

          <div className="glass rounded-xl p-8 mb-8">
            <h2 className="text-2xl font-semibold mb-4">Executive Summary</h2>
            <p className="text-muted-foreground mb-6">
              SQUANCH is a cutting-edge, non-custodial cryptocurrency trading platform that harnesses the power of advanced Machine Learning (AI) algorithms to perform high-frequency, automated trading. This powerful functionality is delivered directly through the user-friendly and highly accessible Telegram bot interface.
            </p>
            
            <a href="/SQUANCH-Whitepaper.pdf" download>
              <Button className="button-gradient">
                <Download className="mr-2 w-4 h-4" />
                Download Full White Paper
              </Button>
            </a>
          </div>

          <div className="space-y-6">
            <div className="glass rounded-xl p-6">
              <h3 className="text-xl font-semibold mb-3">Project Vision</h3>
              <p className="text-muted-foreground">
                The SQUANCH Project is committed to a long-term vision of transforming into a comprehensive, decentralized, AI-driven financial ecosystem, extending well beyond the confines of a simple execution bot. SQUANCH's enduring vision is to become the world's most accessible, secure, and intelligent automated trading platform.
              </p>
            </div>

            <div className="glass rounded-xl p-6">
              <h3 className="text-xl font-semibold mb-3">Core Features</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li>• Non-custodial security with self-custody of assets</li>
                <li>• Advanced AI and Machine Learning algorithms</li>
                <li>• High-frequency automated trading</li>
                <li>• 24/7 market analysis and execution</li>
                <li>• Risk management and portfolio optimization</li>
              </ul>
            </div>

            <div className="glass rounded-xl p-6">
              <h3 className="text-xl font-semibold mb-3">Strategic Roadmap</h3>
              <div className="space-y-4 text-muted-foreground">
                <div>
                  <h4 className="text-white font-medium mb-2">Phase 1: Q4 2025 - Platform Hardening</h4>
                  <p>Launch of Web Dashboard with real-time analytics and custom AI strategy plans for Pro-tier users.</p>
                </div>
                <div>
                  <h4 className="text-white font-medium mb-2">Phase 2: 2026 - Ecosystem Build-out</h4>
                  <p>Multi-exchange API support, social trading module, and $SQUANCH token launch with internal mining.</p>
                </div>
                <div>
                  <h4 className="text-white font-medium mb-2">Phase 3: 2027 - Decentralization</h4>
                  <p>Full DAO transition and complete AI autonomy for governance and trading decisions.</p>
                </div>
              </div>
            </div>

            <div className="glass rounded-xl p-6">
              <h3 className="text-xl font-semibold mb-3">Technology Stack</h3>
              <p className="text-muted-foreground">
                SQUANCH leverages cutting-edge technologies including advanced machine learning models, high-frequency trading algorithms, and secure non-custodial wallet integrations. The platform is built on a robust infrastructure designed to handle millions of transactions while maintaining security and performance.
              </p>
            </div>
          </div>

          <div className="mt-12 text-center">
            <p className="text-muted-foreground mb-4">
              For complete technical details, tokenomics, and strategic roadmap
            </p>
            <a href="/SQUANCH-Whitepaper.pdf" download>
              <Button size="lg" className="button-gradient">
                <Download className="mr-2 w-5 h-5" />
                Download Complete White Paper
              </Button>
            </a>
          </div>
        </div>
      </motion.section>

      <Footer />
    </div>
  );
};

export default Whitepaper;
