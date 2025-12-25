import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import LoadingScreen from "@/components/LoadingScreen";
import Index from "./pages/Index";
import About from "./pages/About";
import Features from "./pages/Features";
import HowItWorks from "./pages/HowItWorks";
import Contact from "./pages/Contact";
import FAQ from "./pages/FAQ";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Mining from "./pages/Mining";
import CryptoPayment from "./pages/CryptoPayment";
import Whitepaper from "./pages/Whitepaper";
import Privacy from "./pages/Privacy";
import TermsOfService from "./pages/TermsOfService";

const queryClient = new QueryClient();

const AppRoutes = () => {
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(true);
  const [isFirstLoad, setIsFirstLoad] = useState(true);

  useEffect(() => {
    // Show loading screen
    setIsLoading(true);
    
    // Longer duration for first load, shorter for navigation
    const duration = isFirstLoad ? 2000 : 800;
    
    const timer = setTimeout(() => {
      setIsLoading(false);
      setIsFirstLoad(false);
    }, duration);

    return () => clearTimeout(timer);
  }, [location.pathname]);

  return (
    <>
      <LoadingScreen isLoading={isLoading} />
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/about" element={<About />} />
        <Route path="/features" element={<Features />} />
        <Route path="/how-it-works" element={<HowItWorks />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/faq" element={<FAQ />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/mining" element={<Mining />} />
        <Route path="/crypto-payment" element={<CryptoPayment />} />
        <Route path="/whitepaper" element={<Whitepaper />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<TermsOfService />} />
      </Routes>
    </>
  );
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen bg-background">
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;