import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import Navigation from "@/components/Navigation";
import AppSidebar from "@/components/AppSidebar";
import Footer from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { DEFAULT_SLOTS, SlotConfig } from "@/hooks/useAdSettings";
import { ArrowDown, ArrowUp, Loader2, Plus, Save, Shield, Trash2 } from "lucide-react";

const KNOWN_ROUTES = [
  { path: "/", label: "Home" },
  { path: "/about", label: "About" },
  { path: "/faq", label: "FAQ" },
  { path: "/features", label: "Features" },
  { path: "/how-it-works", label: "How It Works" },
  { path: "/contact", label: "Contact" },
  { path: "/dashboard", label: "Dashboard" },
  { path: "/leaderboard", label: "Leaderboard" },
  { path: "/referrals", label: "Referrals" },
  { path: "/testimonials", label: "Testimonials" },
];

const AdminAds = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [adsterraEnabled, setAdsterraEnabled] = useState(true);
  const [routeOverrides, setRouteOverrides] = useState<Record<string, boolean>>({});
  const [slotOrder, setSlotOrder] = useState<SlotConfig[]>(DEFAULT_SLOTS);
  const [customRoute, setCustomRoute] = useState("");

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
      if (!roleData) { navigate("/dashboard"); return; }
      setIsAdmin(true);

      const { data } = await (supabase as any)
        .from("ad_settings")
        .select("*")
        .eq("id", 1)
        .maybeSingle();
      if (data) {
        setAdsterraEnabled(data.adsterra_enabled !== false);
        setRouteOverrides(data.route_overrides || {});
        // Merge stored slots with defaults
        const known = new Map(DEFAULT_SLOTS.map((s) => [s.id, s]));
        const stored: SlotConfig[] = Array.isArray(data.slot_order)
          ? data.slot_order.map((e: any) => {
              if (typeof e === "string") {
                const def = known.get(e);
                return def ? { ...def, enabled: true } : null;
              }
              const def = known.get(e.id);
              return def
                ? { ...def, enabled: e.enabled !== false }
                : { id: e.id, label: e.label || e.id, enabled: e.enabled !== false };
            }).filter(Boolean)
          : [];
        for (const def of DEFAULT_SLOTS) {
          if (!stored.find((s) => s.id === def.id)) stored.push(def);
        }
        setSlotOrder(stored);
      }
      setLoading(false);
    };
    init();
  }, [navigate]);

  const moveSlot = (idx: number, dir: -1 | 1) => {
    setSlotOrder((prev) => {
      const next = [...prev];
      const tgt = idx + dir;
      if (tgt < 0 || tgt >= next.length) return prev;
      [next[idx], next[tgt]] = [next[tgt], next[idx]];
      return next;
    });
  };

  const toggleSlot = (id: string) => {
    setSlotOrder((prev) => prev.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s)));
  };

  const setRoute = (path: string, enabled: boolean) => {
    setRouteOverrides((prev) => ({ ...prev, [path]: enabled }));
  };

  const removeRoute = (path: string) => {
    setRouteOverrides((prev) => {
      const next = { ...prev };
      delete next[path];
      return next;
    });
  };

  const addCustomRoute = () => {
    const r = customRoute.trim();
    if (!r.startsWith("/")) {
      toast({ title: "Route must start with /", variant: "destructive" });
      return;
    }
    if (r.startsWith("/games")) {
      toast({ title: "Game routes are always excluded", variant: "destructive" });
      return;
    }
    setRouteOverrides((prev) => ({ ...prev, [r]: false }));
    setCustomRoute("");
  };

  const save = async () => {
    setSaving(true);
    const { error } = await (supabase as any)
      .from("ad_settings")
      .update({
        adsterra_enabled: adsterraEnabled,
        route_overrides: routeOverrides,
        slot_order: slotOrder,
      })
      .eq("id", 1);
    setSaving(false);
    if (error) {
      toast({ title: "Save failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Ad settings saved" });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }
  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navigation />
      <AppSidebar />
      <div className="md:pl-16 container px-4 pt-32 pb-20">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold flex items-center gap-2">
                <Shield className="w-7 h-7 text-primary" /> Adsterra Settings
              </h1>
              <p className="text-muted-foreground mt-2">
                Toggle Adsterra ads globally, per route, and reorder placements. Game routes are always excluded.
              </p>
            </div>
            <Button onClick={save} disabled={saving} className="button-gradient">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4 mr-2" /> Save</>}
            </Button>
          </div>

          <Card className="p-6 glass">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Adsterra script (global)</h2>
                <p className="text-sm text-muted-foreground">Master switch for the social-bar / popunder script.</p>
              </div>
              <Switch checked={adsterraEnabled} onCheckedChange={setAdsterraEnabled} />
            </div>
          </Card>

          <Card className="p-6 glass space-y-4">
            <div>
              <h2 className="text-lg font-semibold">Per-route control</h2>
              <p className="text-sm text-muted-foreground">Disable ads on specific routes. Off = no ads on that route.</p>
            </div>
            <div className="space-y-2">
              {KNOWN_ROUTES.map((r) => {
                const enabled = routeOverrides[r.path] !== false;
                return (
                  <div key={r.path} className="flex items-center justify-between border border-border/40 rounded-lg px-4 py-2">
                    <div>
                      <div className="font-medium">{r.label}</div>
                      <code className="text-xs text-muted-foreground">{r.path}</code>
                    </div>
                    <Switch checked={enabled} onCheckedChange={(v) => setRoute(r.path, v)} />
                  </div>
                );
              })}
            </div>

            <div className="pt-4 border-t border-border/40">
              <h3 className="text-sm font-semibold mb-2">Custom route overrides</h3>
              <div className="flex gap-2 mb-3">
                <Input
                  placeholder="/some-route"
                  value={customRoute}
                  onChange={(e) => setCustomRoute(e.target.value)}
                />
                <Button variant="outline" onClick={addCustomRoute}>
                  <Plus className="w-4 h-4 mr-1" /> Disable
                </Button>
              </div>
              {Object.keys(routeOverrides)
                .filter((p) => !KNOWN_ROUTES.find((k) => k.path === p))
                .map((p) => (
                  <div key={p} className="flex items-center justify-between border border-border/40 rounded-lg px-4 py-2 mb-2">
                    <code className="text-sm">{p}</code>
                    <div className="flex items-center gap-3">
                      <Badge variant={routeOverrides[p] ? "default" : "secondary"}>
                        {routeOverrides[p] ? "On" : "Off"}
                      </Badge>
                      <Switch checked={routeOverrides[p] !== false} onCheckedChange={(v) => setRoute(p, v)} />
                      <Button size="icon" variant="ghost" onClick={() => removeRoute(p)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
            </div>
          </Card>

          <Card className="p-6 glass space-y-3">
            <div>
              <h2 className="text-lg font-semibold">Placement order</h2>
              <p className="text-sm text-muted-foreground">
                Reorder or disable individual ad slots. Order shown is render priority within each page.
              </p>
            </div>
            {slotOrder.map((slot, idx) => (
              <div key={slot.id} className="flex items-center justify-between border border-border/40 rounded-lg px-4 py-2">
                <div className="flex-1">
                  <div className="font-medium">{slot.label}</div>
                  <code className="text-xs text-muted-foreground">{slot.id}</code>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="icon" variant="ghost" disabled={idx === 0} onClick={() => moveSlot(idx, -1)}>
                    <ArrowUp className="w-4 h-4" />
                  </Button>
                  <Button size="icon" variant="ghost" disabled={idx === slotOrder.length - 1} onClick={() => moveSlot(idx, 1)}>
                    <ArrowDown className="w-4 h-4" />
                  </Button>
                  <Switch checked={slot.enabled} onCheckedChange={() => toggleSlot(slot.id)} />
                </div>
              </div>
            ))}
          </Card>
        </motion.div>
      </div>
      <Footer />
    </div>
  );
};

export default AdminAds;
