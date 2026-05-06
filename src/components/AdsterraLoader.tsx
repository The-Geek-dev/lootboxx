import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useAdSettings, isRouteEnabled } from "@/hooks/useAdSettings";

const ADSTERRA_SRC =
  "https://pl29358616.profitablecpmratenetwork.com/61/b8/72/61b872ff8dc3a8cba392302b8e4f6d06.js";
const SCRIPT_ID = "adsterra-social-bar";

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

    const s = document.createElement("script");
    s.id = SCRIPT_ID;
    s.src = ADSTERRA_SRC;
    s.async = true;
    document.body.appendChild(s);
  }, [pathname, settings, loading]);

  return null;
};

export default AdsterraLoader;
