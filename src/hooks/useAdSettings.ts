import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface SlotConfig {
  id: string;
  label: string;
  enabled: boolean;
}

export interface AdSettings {
  adsterra_enabled: boolean;
  route_overrides: Record<string, boolean>;
  slot_order: SlotConfig[];
}

export const DEFAULT_SLOTS: SlotConfig[] = [
  { id: "ad-home-top", label: "Home — after hero", enabled: true },
  { id: "ad-home-mid", label: "Home — between features and testimonials", enabled: true },
  { id: "ad-home-bottom", label: "Home — before footer", enabled: true },
  { id: "ad-about-mid", label: "About — middle", enabled: true },
  { id: "ad-about-bottom", label: "About — before footer", enabled: true },
  { id: "ad-faq-bottom", label: "FAQ — before footer", enabled: true },
];

const DEFAULT_SETTINGS: AdSettings = {
  adsterra_enabled: true,
  route_overrides: {},
  slot_order: DEFAULT_SLOTS,
};

const normalize = (raw: any): AdSettings => {
  if (!raw) return DEFAULT_SETTINGS;
  let slot_order: SlotConfig[] = DEFAULT_SLOTS;
  if (Array.isArray(raw.slot_order)) {
    // Support both legacy string[] and new SlotConfig[]
    const known = new Map(DEFAULT_SLOTS.map((s) => [s.id, s]));
    const merged: SlotConfig[] = raw.slot_order
      .map((entry: any) => {
        if (typeof entry === "string") {
          const def = known.get(entry);
          return def ? { ...def, enabled: true } : null;
        }
        if (entry && typeof entry.id === "string") {
          const def = known.get(entry.id);
          return def
            ? { ...def, enabled: entry.enabled !== false }
            : { id: entry.id, label: entry.label || entry.id, enabled: entry.enabled !== false };
        }
        return null;
      })
      .filter(Boolean) as SlotConfig[];
    // Append any missing default slots
    for (const def of DEFAULT_SLOTS) {
      if (!merged.find((s) => s.id === def.id)) merged.push(def);
    }
    slot_order = merged;
  }
  return {
    adsterra_enabled: raw.adsterra_enabled !== false,
    route_overrides: raw.route_overrides || {},
    slot_order,
  };
};

export const useAdSettings = () => {
  const [settings, setSettings] = useState<AdSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const { data } = await (supabase as any)
        .from("ad_settings")
        .select("adsterra_enabled, route_overrides, slot_order")
        .eq("id", 1)
        .maybeSingle();
      if (!cancelled) {
        setSettings(normalize(data));
        setLoading(false);
      }
    };
    load();

    const channel = (supabase as any)
      .channel("ad_settings_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "ad_settings" },
        (payload: any) => setSettings(normalize(payload.new)),
      )
      .subscribe();

    return () => {
      cancelled = true;
      (supabase as any).removeChannel(channel);
    };
  }, []);

  return { settings, loading };
};

export const isRouteEnabled = (settings: AdSettings, pathname: string) => {
  if (!settings.adsterra_enabled) return false;
  if (pathname.startsWith("/games")) return false;
  // Match longest prefix in overrides
  const keys = Object.keys(settings.route_overrides).sort((a, b) => b.length - a.length);
  for (const k of keys) {
    if (pathname === k || pathname.startsWith(k === "/" ? "/" : k + "/") || pathname.startsWith(k)) {
      if (k === "/" && pathname !== "/") continue;
      return settings.route_overrides[k] !== false;
    }
  }
  return true;
};

export const isSlotEnabled = (settings: AdSettings, slotId?: string) => {
  if (!slotId) return true;
  const s = settings.slot_order.find((x) => x.id === slotId);
  return s ? s.enabled : true;
};
