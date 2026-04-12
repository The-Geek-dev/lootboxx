import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import LoadingScreen from "@/components/LoadingScreen";
import WinnerMarquee from "@/components/WinnerMarquee";
import Index from "./pages/Index";
import Points from "./pages/Points";
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
import Games from "./pages/Games";
import SpinWheel from "./pages/SpinWheel";
import LuckySlots from "./pages/LuckySlots";
import TriviaQuiz from "./pages/TriviaQuiz";
import RaffleDraw from "./pages/RaffleDraw";
import Deposit from "./pages/Deposit";
import Referrals from "./pages/Referrals";
import Testimonials from "./pages/Testimonials";
import Privacy from "./pages/Privacy";
import TermsOfService from "./pages/TermsOfService";
import Settings from "./pages/Settings";
import TransactionHistory from "./pages/TransactionHistory";
import AdminDashboard from "./pages/AdminDashboard";
import Withdraw from "./pages/Withdraw";
const queryClient = new QueryClient();

const AppRoutes = () => {
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(true);
  const [isFirstLoad, setIsFirstLoad] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    const duration = isFirstLoad ? 2000 : 550;
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
        <Route path="/games" element={<Games />} />
        <Route path="/games/spin-wheel" element={<SpinWheel />} />
        <Route path="/games/slots" element={<LuckySlots />} />
        <Route path="/games/trivia" element={<TriviaQuiz />} />
        <Route path="/games/raffle" element={<RaffleDraw />} />
        <Route path="/deposit" element={<Deposit />} />
        <Route path="/referrals" element={<Referrals />} />
        <Route path="/testimonials" element={<Testimonials />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<TermsOfService />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/transactions" element={<TransactionHistory />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/withdraw" element={<Withdraw />} />
        <Route path="/points" element={<Points />} />
      </Routes>
    </>
  );
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen bg-background">
          <WinnerMarquee />
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
