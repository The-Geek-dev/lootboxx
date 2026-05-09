import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useAdSettings, isRouteEnabled } from "@/hooks/useAdSettings";

const ADSTERRA_SCRIPTS: { id: string; src: string }[] = [
  {
    id: "adsterra-popunder",
    src: "https://pl29358616.profitablecpmratenetwork.com/61/b8/72/61b872ff8dc3a8cba392302b8e4f6d06.js",
  },
  {
    // SocialBar — also serves video creatives
    id: "adsterra-social-bar",
    src: "https://pl29386836.profitablecpmratenetwork.com/a1/e3/4f/a1e34f4c5a7b8011c18d0e08ec0162e6.js",
  },
];

/**
 * Loads the Adsterra script on every route EXCEPT game pages
 * (and any route disabled via the admin Ads page).
 */
const AdsterraLoader = () => {
  const { pathname } = useLocation();
  const { settings, loading } = useAdSettings();

  useEffect(() => {
    if (loading) return;
    const existing = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
    const allowed = isRouteEnabled(settings, pathname);

    if (!allowed) {
      if (existing) existing.remove();
      return;
    }
    if (existing) return;

    let injected = false;
    const inject = () => {
      if (injected) return;
      injected = true;
      cleanup();
      const s = document.createElement("script");
      s.id = SCRIPT_ID;
      s.src = ADSTERRA_SRC;
      s.async = true;
      document.body.appendChild(s);
    };

    // Defer until first user interaction so popunder/social-bar scripts
    // can't hijack the initial paint (which on mobile shows as a blank white tab).
    const events: (keyof WindowEventMap)[] = ["pointerdown", "touchstart", "keydown", "scroll"];
    const cleanup = () => {
      events.forEach((e) => window.removeEventListener(e, inject));
      clearTimeout(fallback);
    };
    events.forEach((e) => window.addEventListener(e, inject, { once: true, passive: true } as any));
    // Fallback: load after 8s of inactivity so ads still appear for idle users
    const fallback = window.setTimeout(inject, 8000);

    return cleanup;
  }, [pathname, settings, loading]);

  return null;
};

export default AdsterraLoader;
