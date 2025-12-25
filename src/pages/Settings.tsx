import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Settings as SettingsIcon, User, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Navigation from "@/components/Navigation";
import TwoFactorSetup from "@/components/TwoFactorSetup";
import ApiKeyManager from "@/components/ApiKeyManager";
import { supabase } from "@/integrations/supabase/client";

const Settings = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string>("");
  const [userEmail, setUserEmail] = useState<string>("");
  const [userName, setUserName] = useState<string>("");
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/login");
        return;
      }

      setUserId(session.user.id);
      setUserEmail(session.user.email || "");

      // Fetch profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (profile) {
        setUserName(profile.full_name);
      }

      // Fetch 2FA settings
      const { data: twoFaSettings } = await supabase
        .from("user_2fa_settings")
        .select("is_enabled")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (twoFaSettings) {
        setIs2FAEnabled(twoFaSettings.is_enabled);
      }

      setIsLoading(false);
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        navigate("/login");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-foreground">
      <Navigation />

      <div className="container px-4 pt-32 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center gap-4 mb-8">
            <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-4xl font-bold flex items-center gap-3">
                <SettingsIcon className="w-8 h-8 text-primary" />
                Settings
              </h1>
              <p className="text-gray-400 mt-1">Manage your account security and API access</p>
            </div>
          </div>

          {/* Profile Card */}
          <Card className="glass p-6 mb-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
                <User className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">{userName || "User"}</h2>
                <p className="text-gray-400">{userEmail}</p>
              </div>
            </div>
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* 2FA Section */}
            <TwoFactorSetup
              userId={userId}
              email={userEmail}
              isEnabled={is2FAEnabled}
              onStatusChange={setIs2FAEnabled}
            />

            {/* API Keys Section */}
            <ApiKeyManager userId={userId} />
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Settings;
