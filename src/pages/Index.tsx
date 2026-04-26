import { motion } from "framer-motion";
import { ArrowRight, Gamepad2, Gift } from "lucide-react";

import { Button } from "@/components/ui/button";
import Navigation from "@/components/Navigation";
import AppSidebar from "@/components/AppSidebar";
import { FeaturesSection } from "@/components/features/FeaturesSection";
import LogoCarousel from "@/components/LogoCarousel";
import TestimonialsSection from "@/components/TestimonialsSection";
import Footer from "@/components/Footer";
import { TextGenerateEffect } from "@/components/ui/text-generate-effect";
import CyberpunkParticles from "@/components/CyberpunkParticles";
import HexagonGrid from "@/components/HexagonGrid";
import MascotBackground from "@/components/MascotBackground";
import TutorialVideoButton from "@/components/TutorialVideoButton";
import dashboardPreview from "@/assets/dashboard-preview-new.jpg";
import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const Index = () => {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  
  const [animationKey, setAnimationKey] = useState(Date.now());

  useEffect(() => {
    setAnimationKey(Date.now());
  }, []);




  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(!!session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navigation />
      <AppSidebar />
      
      {/* Hero Section */}
      <motion.section 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative container px-4 pt-40 pb-20"
      >
        <HexagonGrid />
        <CyberpunkParticles />
        <div className="absolute inset-0 -z-10 bg-[#0A0A0A]" />
        
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="inline-block mb-4 px-4 py-1.5 rounded-full glass"
        >
          <span className="text-sm font-medium">
            <Gamepad2 className="w-4 h-4 inline-block mr-2" />
            Play games, win real rewards
          </span>
        </motion.div>
        
        <div className="max-w-4xl relative z-10">
          <h1 className="text-5xl md:text-7xl font-normal mb-4 tracking-tight text-left">
            <span className="text-gray-200">
              <TextGenerateEffect key={`line1-${animationKey}`} words="Play, Win, and" />
            </span>
            <br />
            <span className="text-white font-medium">
              <TextGenerateEffect key={`line2-${animationKey}`} words="Earn Amazing Rewards" />
            </span>
          </h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-lg md:text-xl text-gray-200 mb-8 max-w-2xl text-left"
          >
            Join LootBoxx and play exciting games — raffles, spin-the-wheel, trivia and more.{" "}
            <span className="text-white">Deposit, play, and win big today.</span>
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex flex-col sm:flex-row gap-4 items-start"
          >
            <Link to="/signup">
              <Button size="lg" className="button-gradient">
                Start Playing
              </Button>
            </Link>
            <Link to="/how-it-works">
              <Button size="lg" variant="link" className="text-white">
                See How It Works <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="relative mx-auto max-w-5xl mt-20"
        >
          <div className="glass rounded-xl overflow-hidden border border-primary/20 shadow-[0_0_30px_rgba(94,231,223,0.15)]">
            <img
              src={dashboardPreview}
              alt="LootBoxx Gaming Platform"
              className="w-full h-auto"
            />
          </div>
        </motion.div>
      </motion.section>

      {/* Logo Carousel */}
      <LogoCarousel />

      {/* Features Section */}
      <div id="features" className="bg-black relative overflow-hidden">
        <MascotBackground position="right" />
        <FeaturesSection />
      </div>

      {/* Testimonials Section */}
      <div className="bg-black relative overflow-hidden">
        <MascotBackground position="left" />
        <TestimonialsSection />
      </div>

      {/* Footer */}
      <div className="bg-black">
        <Footer />
      </div>

      {/* Login Dialog */}
      <AlertDialog open={showLoginDialog} onOpenChange={setShowLoginDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Login Required</AlertDialogTitle>
            <AlertDialogDescription>
              You need to be logged in to play games. Please login or create an account to continue.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => navigate("/login")}>
              Go to Login
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Floating tutorial video button */}
      <TutorialVideoButton />

    </div>
  );
};

export default Index;
