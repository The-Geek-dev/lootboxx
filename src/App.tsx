import { useState, useEffect, lazy, Suspense } from "react";
import { loadPayoutOverrides } from "@/config/payouts";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import LoadingScreen from "@/components/LoadingScreen";
import WinnerMarquee from "@/components/WinnerMarquee";
import LaunchCountdown from "@/components/LaunchCountdown";
import AgeVerification from "@/components/AgeVerification";
import Index from "./pages/Index";
import CouponRenewalBanner from "@/components/CouponRenewalBanner";
import PushAutoPrompt from "@/components/PushAutoPrompt";
import AdsterraLoader from "@/components/AdsterraLoader";
import PromoBanner from "@/components/PromoBanner";
import PromoPopup from "@/components/PromoPopup";

// Lazy-loaded routes — split bundle so each page only loads when visited.
// Big perf win on low-end devices: initial JS shrinks dramatically.
const Points = lazy(() => import("./pages/Points"));
const About = lazy(() => import("./pages/About"));
const Features = lazy(() => import("./pages/Features"));
const HowItWorks = lazy(() => import("./pages/HowItWorks"));
const Contact = lazy(() => import("./pages/Contact"));
const FAQ = lazy(() => import("./pages/FAQ"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Login = lazy(() => import("./pages/Login"));
const Signup = lazy(() => import("./pages/Signup"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Games = lazy(() => import("./pages/Games"));
const SpinWheel = lazy(() => import("./pages/SpinWheel"));
const LuckySlots = lazy(() => import("./pages/LuckySlots"));
const TriviaQuiz = lazy(() => import("./pages/TriviaQuiz"));
const RaffleDraw = lazy(() => import("./pages/RaffleDraw"));
const Deposit = lazy(() => import("./pages/Deposit"));
const PaymentStatus = lazy(() => import("./pages/PaymentStatus"));
const Referrals = lazy(() => import("./pages/Referrals"));
const Testimonials = lazy(() => import("./pages/Testimonials"));
const Privacy = lazy(() => import("./pages/Privacy"));
const TermsOfService = lazy(() => import("./pages/TermsOfService"));
const Settings = lazy(() => import("./pages/Settings"));
const TransactionHistory = lazy(() => import("./pages/TransactionHistory"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const AdminPayouts = lazy(() => import("./pages/AdminPayouts"));
const AdminAds = lazy(() => import("./pages/AdminAds"));
const Withdraw = lazy(() => import("./pages/Withdraw"));
const Leaderboard = lazy(() => import("./pages/Leaderboard"));
const DynamicGame = lazy(() => import("./pages/DynamicGame"));
const WithdrawalSuccess = lazy(() => import("./pages/WithdrawalSuccess"));
const WithdrawalProcessing = lazy(() => import("./pages/WithdrawalProcessing"));
const Unsubscribe = lazy(() => import("./pages/Unsubscribe"));
const AdRewards = lazy(() => import("./pages/AdRewards"));
const Predictions = lazy(() => import("./pages/Predictions"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

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

  const isGameRoute = location.pathname.startsWith("/games");

  return (
    <>
      <LoadingScreen isLoading={isLoading} />
      <PromoBanner />
      {!isGameRoute && <WinnerMarquee />}
      <CouponRenewalBanner />
      <PushAutoPrompt />
      <AdsterraLoader />
      <PromoPopup />
      <Suspense fallback={null}>
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
          <Route path="/games/play/:gameId" element={<DynamicGame />} />
          <Route path="/deposit" element={<Deposit />} />
          <Route path="/payments" element={<PaymentStatus />} />
          <Route path="/referrals" element={<Referrals />} />
          <Route path="/testimonials" element={<Testimonials />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<TermsOfService />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/transactions" element={<TransactionHistory />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/payouts" element={<AdminPayouts />} />
          <Route path="/admin/ads" element={<AdminAds />} />
          <Route path="/withdraw" element={<Withdraw />} />
          <Route path="/withdraw/processing" element={<WithdrawalProcessing />} />
          <Route path="/withdraw/success" element={<WithdrawalSuccess />} />
          <Route path="/unsubscribe" element={<Unsubscribe />} />
          <Route path="/points" element={<Points />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/ad-rewards" element={<AdRewards />} />
          <Route path="/predictions" element={<Predictions />} />
        </Routes>
      </Suspense>
    </>
  );
};

const App = () => {
  useEffect(() => { loadPayoutOverrides(); }, []);
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen bg-background">
          <AgeVerification />
          <LaunchCountdown />
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
