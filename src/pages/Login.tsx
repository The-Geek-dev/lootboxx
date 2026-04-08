import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Loader2, ArrowLeft } from "lucide-react";
import squanchLogo from "@/assets/squanch-logo.png";

const Login = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  
  const [requires2FA, setRequires2FA] = useState(false);
  const [pendingUserId, setPendingUserId] = useState<string>("");
  const [otpValue, setOtpValue] = useState("");
  const [isVerifying2FA, setIsVerifying2FA] = useState(false);
  const [isSendingOTP, setIsSendingOTP] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/dashboard");
      }
    });
  }, [navigate]);

  const sendOTPCode = async (userId: string, userEmail: string) => {
    setIsSendingOTP(true);
    try {
      const response = await supabase.functions.invoke("send-otp", {
        body: { email: userEmail, user_id: userId },
      });
      if (response.error) throw new Error(response.error.message);
      toast({ title: "Verification code sent", description: "Check your email for the 6-digit code" });
    } catch (error: any) {
      toast({ title: "Failed to send code", description: error.message, variant: "destructive" });
    } finally {
      setIsSendingOTP(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        toast({ title: "Login failed", description: error.message, variant: "destructive" });
        return;
      }
      if (data.user) {
        const { data: twoFaSettings } = await supabase.from("user_2fa_settings").select("is_enabled").eq("user_id", data.user.id).maybeSingle();
        if (twoFaSettings?.is_enabled) {
          await supabase.auth.signOut();
          setPendingUserId(data.user.id);
          setRequires2FA(true);
          await sendOTPCode(data.user.id, email);
        } else {
          toast({ title: "Login successful!", description: "Welcome back to LootBox." });
          navigate("/dashboard");
        }
      }
    } catch (error) {
      toast({ title: "Error", description: "An unexpected error occurred", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const verify2FA = async () => {
    if (otpValue.length !== 6) {
      toast({ title: "Invalid code", description: "Please enter the 6-digit code", variant: "destructive" });
      return;
    }
    setIsVerifying2FA(true);
    try {
      const response = await supabase.functions.invoke("verify-otp", { body: { user_id: pendingUserId, code: otpValue } });
      if (response.error || !response.data?.success) throw new Error(response.data?.error || "Verification failed");
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      toast({ title: "Login successful!", description: "Welcome back to LootBox." });
      navigate("/dashboard");
    } catch (error: any) {
      toast({ title: "Verification failed", description: error.message, variant: "destructive" });
    } finally {
      setIsVerifying2FA(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: `${window.location.origin}/dashboard` } });
      if (error) toast({ title: "Google login failed", description: error.message, variant: "destructive" });
    } catch (error) {
      toast({ title: "Error", description: "An unexpected error occurred", variant: "destructive" });
    } finally {
      setIsGoogleLoading(false);
    }
  };

  if (requires2FA) {
    return (
      <div className="min-h-screen bg-black text-foreground flex items-center justify-center px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="w-full max-w-md">
          <Link to="/" className="flex items-center justify-center gap-2 mb-8">
            <img src={squanchLogo} alt="LootBox" className="h-10 w-auto" />
            <span className="font-bold text-2xl">LOOTBOX</span>
          </Link>
          <div className="glass rounded-2xl p-8">
            <button onClick={() => { setRequires2FA(false); setOtpValue(""); setPendingUserId(""); }} className="flex items-center gap-2 text-gray-400 hover:text-white mb-4">
              <ArrowLeft className="w-4 h-4" /> Back to login
            </button>
            <h1 className="text-3xl font-bold mb-2 text-center">Two-Factor Authentication</h1>
            <p className="text-gray-400 text-center mb-8">Enter the 6-digit code sent to <span className="text-primary">{email}</span></p>
            <div className="space-y-6">
              <div className="flex justify-center">
                <InputOTP maxLength={6} value={otpValue} onChange={setOtpValue}>
                  <InputOTPGroup>
                    <InputOTPSlot index={0} /><InputOTPSlot index={1} /><InputOTPSlot index={2} />
                    <InputOTPSlot index={3} /><InputOTPSlot index={4} /><InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </div>
              <Button onClick={verify2FA} disabled={isVerifying2FA || otpValue.length !== 6} className="button-gradient w-full" size="lg">
                {isVerifying2FA ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" />Verifying...</>) : "Verify & Login"}
              </Button>
              <button onClick={() => sendOTPCode(pendingUserId, email)} disabled={isSendingOTP} className="text-sm text-primary hover:underline w-full text-center">
                {isSendingOTP ? "Sending..." : "Didn't receive the code? Send again"}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-foreground flex items-center justify-center px-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="w-full max-w-md">
        <Link to="/" className="flex items-center justify-center gap-2 mb-8">
          <img src={squanchLogo} alt="LootBox" className="h-10 w-auto" />
          <span className="font-bold text-2xl">LOOTBOX</span>
        </Link>
        <div className="glass rounded-2xl p-8">
          <h1 className="text-3xl font-bold mb-2 text-center">Welcome Back</h1>
          <p className="text-gray-400 text-center mb-8">Sign in to access your gaming dashboard</p>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-2">Email Address</label>
              <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required className="bg-background/50" />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-2">Password</label>
              <Input id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required className="bg-background/50" />
            </div>
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="rounded" />
                <span className="text-gray-400">Remember me</span>
              </label>
              <Link to="/forgot-password" className="text-primary hover:underline">Forgot password?</Link>
            </div>
            <Button type="submit" className="button-gradient w-full" size="lg" disabled={isLoading}>
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-700"></div></div>
            <div className="relative flex justify-center text-sm"><span className="px-2 bg-transparent text-gray-500">or continue with</span></div>
          </div>
          <Button type="button" variant="outline" className="w-full" size="lg" onClick={handleGoogleLogin} disabled={isGoogleLoading}>
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            {isGoogleLoading ? "Connecting..." : "Continue with Google"}
          </Button>
          <div className="mt-6 text-center text-sm text-gray-400">
            Don't have an account? <Link to="/signup" className="text-primary hover:underline">Sign up</Link>
          </div>
        </div>
        <p className="text-center text-sm text-gray-500 mt-6">Protected by industry-leading security measures</p>
      </motion.div>
    </div>
  );
};

export default Login;
