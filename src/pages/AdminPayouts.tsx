import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import Navigation from "@/components/Navigation";
import AppSidebar from "@/components/AppSidebar";
import Footer from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  PAYOUT_DEFAULTS,
  getPayoutKeys,
  loadPayoutOverrides,
} from "@/config/payouts";
import { Loader2, RotateCcw, Save, Shield } from "lucide-react";

interface Override {
  key: string;
  value: any;
  updated_at: string;
}

const AdminPayouts = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [overrides, setOverrides] = useState<Record<string, Override>>({});
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [savingKey, setSavingKey] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/login"); return; }
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .eq("role", "admin")
        .maybeSingle();
      if (!roleData) {
        toast({ title: "Access denied", description: "Admin only.", variant: "destructive" });
        navigate("/dashboard");
        return;
      }
      setIsAdmin(true);
      await refresh();
      setLoading(false);
    };
    init();
  }, []);

  const refresh = async () => {
    const { data, error } = await supabase
      .from("payout_overrides")
      .select("key, value, updated_at");
    if (error) {
      toast({ title: "Failed to load", description: error.message, variant: "destructive" });
      return;
    }
    const map: Record<string, Override> = {};
    const newDrafts: Record<string, string> = {};
    for (const k of getPayoutKeys()) {
      const row = data?.find((d) => d.key === k);
      const value = row ? row.value : PAYOUT_DEFAULTS[k];
      if (row) map[k] = row as Override;
      newDrafts[k] = JSON.stringify(value, null, 2);
    }
    setOverrides(map);
    setDrafts(newDrafts);
  };

  const saveKey = async (key: string) => {
    setSavingKey(key);
    let parsed: any;
    try { parsed = JSON.parse(drafts[key]); }
    catch { toast({ title: "Invalid JSON", description: "Fix syntax before saving.", variant: "destructive" }); setSavingKey(null); return; }

    const { data: { session } } = await supabase.auth.getSession();
    const { error } = await supabase
      .from("payout_overrides")
      .upsert({ key, value: parsed, updated_by: session?.user.id }, { onConflict: "key" });

    if (error) {
      toast({ title: "Save failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Saved", description: `${key} updated. Reloading runtime config…` });
      await loadPayoutOverrides(true);
      await refresh();
    }
    setSavingKey(null);
  };

  const resetKey = async (key: string) => {
    setSavingKey(key);
    const { error } = await supabase.from("payout_overrides").delete().eq("key", key);
    if (error) {
      toast({ title: "Reset failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Reset", description: `${key} restored to default.` });
      await loadPayoutOverrides(true);
      await refresh();
    }
    setSavingKey(null);
  };

  if (loading || !isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <AppSidebar />
      <main className="md:ml-16 pt-20 pb-16 px-3 sm:px-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-5xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="w-7 h-7 text-primary" />
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Payout Tuner</h1>
          </div>
          <p className="text-sm text-muted-foreground mb-6">
            Live-edit payout values. Saves are picked up by all engines on next play (no deploy needed).
          </p>

          <div className="space-y-4">
            {getPayoutKeys().map((key) => {
              const isOverridden = !!overrides[key];
              const isSaving = savingKey === key;
              const defaultJson = JSON.stringify(PAYOUT_DEFAULTS[key], null, 2);
              const isDirty = drafts[key] !== JSON.stringify(overrides[key]?.value ?? PAYOUT_DEFAULTS[key], null, 2);
              const isDefaultEdited = drafts[key] !== defaultJson;
              return (
                <Card key={key} className="p-4 bg-card/60 backdrop-blur border-border/50">
                  <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-foreground">{key}</h3>
                      {isOverridden ? (
                        <Badge variant="default">overridden</Badge>
                      ) : (
                        <Badge variant="outline">default</Badge>
                      )}
                      {isDirty && <Badge variant="secondary">unsaved</Badge>}
                    </div>
                    <div className="flex gap-2">
                      {isOverridden && (
                        <Button size="sm" variant="outline" disabled={isSaving} onClick={() => resetKey(key)}>
                          <RotateCcw className="w-3.5 h-3.5 mr-1" /> Reset
                        </Button>
                      )}
                      <Button size="sm" disabled={isSaving || !isDefaultEdited} onClick={() => saveKey(key)}>
                        {isSaving ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Save className="w-3.5 h-3.5 mr-1" />}
                        Save
                      </Button>
                    </div>
                  </div>
                  <Textarea
                    value={drafts[key] ?? ""}
                    onChange={(e) => setDrafts({ ...drafts, [key]: e.target.value })}
                    rows={Math.min(15, (drafts[key]?.split("\n").length ?? 3) + 1)}
                    className="font-mono text-xs"
                    spellCheck={false}
                  />
                  {overrides[key] && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Last updated: {new Date(overrides[key].updated_at).toLocaleString()}
                    </p>
                  )}
                </Card>
              );
            })}
          </div>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
};

export default AdminPayouts;
