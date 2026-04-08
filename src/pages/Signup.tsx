import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import squanchLogo from "@/assets/squanch-logo.png";

const Signup = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "", password: "", confirmPassword: "" });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate("/dashboard");
    });
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      toast({ title: "Error", description: "Passwords don't match", variant: "destructive" });
      return;
    }
    if (formData.password.length < 6) {
      toast({ title: "Error", description: "Password must be at least 6 characters", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    try {
      const { data: authData, error: signupError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: { emailRedirectTo: `${window.location.origin}/`, data: { full_name: formData.name } },
      });
      if (signupError) { toast({ title: "Signup failed", description: signupError.message, variant: "destructive" }); return; }
      if (!authData.user) { toast({ title: "Signup failed", description: "Failed to create user account", variant: "destructive" }); return; }
      toast({ title: "Account created!", description: "Welcome to LootBox. Let's start playing!" });
      navigate("/dashboard");
    } catch (error) {
      toast({ title: "Error", description: "An unexpected error occurred", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleGoogleSignup = async () => {
    setIsGoogleLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: `${window.location.origin}/dashboard` } });
      if (error) toast({ title: "Google signup failed", description: error.message, variant: "destructive" });
    } catch (error) {
      toast({ title: "Error", description: "An unexpected error occurred", variant: "destructive" });
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-foreground flex items-center justify-center px-4 py-12">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="w-full max-w-md">
        <Link to="/" className="flex items-center justify-center gap-2 mb-8">
          <img src={squanchLogo} alt="LootBox" className="h-10 w-auto" />
          <span className="font-bold text-2xl">LOOTBOX</span>
        </Link>
        <div className="glass rounded-2xl p-8">
          <h1 className="text-3xl font-bold mb-2 text-center">Create Account</h1>
          <p className="text-gray-400 text-center mb-8">Start your gaming journey today</p>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-2">Full Name</label>
              <Input id="name" type="text" placeholder="John Doe" value={formData.name} onChange={handleChange} required className="bg-background/50" />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-2">Email Address</label>
              <Input id="email" type="email" placeholder="you@example.com" value={formData.email} onChange={handleChange} required className="bg-background/50" />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-2">Password</label>
              <Input id="password" type="password" placeholder="••••••••" value={formData.password} onChange={handleChange} required className="bg-background/50" />
            </div>
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium mb-2">Confirm Password</label>
              <Input id="confirmPassword" type="password" placeholder="••••••••" value={formData.confirmPassword} onChange={handleChange} required className="bg-background/50" />
            </div>
            <div className="text-sm text-gray-400">
              <label className="flex items-start gap-2 cursor-pointer">
                <input type="checkbox" required className="mt-1 rounded" />
                <span>I agree to the <Link to="/terms" className="text-primary hover:underline">Terms of Service</Link> and <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link></span>
              </label>
            </div>
            <Button type="submit" className="button-gradient w-full" size="lg" disabled={isLoading}>
              {isLoading ? "Creating account..." : "Create Account"}
            </Button>
          </form>
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-700"></div></div>
            <div className="relative flex justify-center text-sm"><span className="px-2 bg-transparent text-gray-500">or continue with</span></div>
          </div>
          <Button type="button" variant="outline" className="w-full" size="lg" onClick={handleGoogleSignup} disabled={isGoogleLoading}>
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            {isGoogleLoading ? "Connecting..." : "Continue with Google"}
          </Button>
          <div className="mt-6 text-center text-sm text-gray-400">
            Already have an account? <Link to="/login" className="text-primary hover:underline">Sign in</Link>
          </div>
        </div>
        <p className="text-center text-sm text-gray-500 mt-6">Your data is encrypted and secure</p>
      </motion.div>
    </div>
  );
};

export default Signup;
