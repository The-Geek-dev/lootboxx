import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Settings as SettingsIcon, User, ArrowLeft, Volume2, VolumeX, Moon, Sun, Palette, Save, LogOut, Bell, BellOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import Navigation from "@/components/Navigation";
import AppSidebar from "@/components/AppSidebar";
import TwoFactorSetup from "@/components/TwoFactorSetup";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { NOTIFICATION_SOUND_KEY, isNotificationSoundEnabled, playNotificationSound } from "@/hooks/useNotifications";

const Settings = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [userName, setUserName] = useState("");
  const [editName, setEditName] = useState("");
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Preferences
  const [marqueMuted, setMarqueeMuted] = useState(() => {
    try { return localStorage.getItem("lootboxx_muted") === "true"; } catch { return false; }
  });
  const [darkMode, setDarkMode] = useState(() => {
    try { return localStorage.getItem("lootboxx_theme") !== "light"; } catch { return true; }
  });
  const [notifSound, setNotifSound] = useState(() => isNotificationSoundEnabled());

  const toggleNotifSound = (val: boolean) => {
    setNotifSound(val);
    try { localStorage.setItem(NOTIFICATION_SOUND_KEY, String(val)); } catch {}
    if (val) {
      // Preview the chime when turning on
      playNotificationSound();
    }
  };

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/login"); return; }

      setUserId(session.user.id);
      setUserEmail(session.user.email || "");

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (profile) {
        setUserName(profile.full_name);
        setEditName(profile.full_name);
      }

      const { data: twoFaSettings } = await supabase
        .from("user_2fa_settings")
        .select("is_enabled")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (twoFaSettings) setIs2FAEnabled(twoFaSettings.is_enabled);
      setIsLoading(false);
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) navigate("/login");
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  const saveProfile = async () => {
    if (!editName.trim()) return;
    setIsSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: editName.trim() })
      .eq("user_id", userId);

    if (error) {
      toast({ title: "Failed to update profile", description: error.message, variant: "destructive" });
    } else {
      setUserName(editName.trim());
      toast({ title: "Profile updated!" });
    }
    setIsSaving(false);
  };

  const toggleMarquee = (val: boolean) => {
    setMarqueeMuted(val);
    try { localStorage.setItem("lootboxx_muted", String(val)); } catch {}
  };

  const toggleTheme = (isDark: boolean) => {
    setDarkMode(isDark);
    try {
      localStorage.setItem("lootboxx_theme", isDark ? "dark" : "light");
    } catch {}
    if (isDark) {
      document.documentElement.classList.remove("light");
    } else {
      document.documentElement.classList.add("light");
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navigation />
      <AppSidebar />

      <div className="md:pl-16 container px-4 pt-32 pb-20">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div className="flex items-center gap-4 mb-8">
            <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-4xl font-bold flex items-center gap-3">
                <SettingsIcon className="w-8 h-8 text-primary" />
                Settings
              </h1>
              <p className="text-muted-foreground mt-1">Manage your profile, preferences, and security</p>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Profile Settings */}
            <Card className="p-6 bg-card">
              <div className="flex items-center gap-3 mb-5">
                <User className="w-6 h-6 text-primary" />
                <h3 className="text-xl font-semibold">Profile</h3>
              </div>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="email" className="text-muted-foreground text-sm">Email</Label>
                  <Input id="email" value={userEmail} disabled className="mt-1 bg-muted/30" />
                </div>
                <div>
                  <Label htmlFor="fullName" className="text-muted-foreground text-sm">Full Name</Label>
                  <Input
                    id="fullName"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="Enter your name"
                    className="mt-1"
                  />
                </div>
                <Button onClick={saveProfile} disabled={isSaving || editName.trim() === userName} className="button-gradient">
                  <Save className="w-4 h-4 mr-2" />
                  {isSaving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </Card>

            {/* Preferences */}
            <Card className="p-6 bg-card">
              <div className="flex items-center gap-3 mb-5">
                <Palette className="w-6 h-6 text-primary" />
                <h3 className="text-xl font-semibold">Preferences</h3>
              </div>
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {marqueMuted ? <VolumeX className="w-5 h-5 text-muted-foreground" /> : <Volume2 className="w-5 h-5 text-primary" />}
                    <div>
                      <p className="font-medium text-sm">Mute Marquee Sounds</p>
                      <p className="text-xs text-muted-foreground">Silence the winner ticker sound effects</p>
                    </div>
                  </div>
                  <Switch checked={marqueMuted} onCheckedChange={toggleMarquee} />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {darkMode ? <Moon className="w-5 h-5 text-primary" /> : <Sun className="w-5 h-5 text-yellow-500" />}
                    <div>
                      <p className="font-medium text-sm">Dark Mode</p>
                      <p className="text-xs text-muted-foreground">Toggle between dark and light themes</p>
                    </div>
                  </div>
                  <Switch checked={darkMode} onCheckedChange={toggleTheme} />
                </div>
              </div>
            </Card>

            {/* 2FA Section */}
            <TwoFactorSetup
              userId={userId}
              email={userEmail}
              isEnabled={is2FAEnabled}
              onStatusChange={setIs2FAEnabled}
            />

            {/* Account Actions */}
            <Card className="p-6 bg-card">
              <h3 className="text-xl font-semibold mb-4">Account</h3>
              <div className="space-y-3">
                <Button variant="destructive" className="w-full" onClick={handleLogout}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            </Card>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Settings;
