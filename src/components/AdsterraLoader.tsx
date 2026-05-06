import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const ADSTERRA_SRC =
  "https://pl29358616.profitablecpmratenetwork.com/61/b8/72/61b872ff8dc3a8cba392302b8e4f6d06.js";
const SCRIPT_ID = "adsterra-social-bar";

/**
 * Loads the Adsterra script on every route EXCEPT game pages,
 * so gameplay isn't disrupted by popunders/social-bar ads.
 */
const AdsterraLoader = () => {
  const { pathname } = useLocation();
  const isGamePage = pathname.startsWith("/games/");

  useEffect(() => {
    const existing = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;

    if (isGamePage) {
      if (existing) existing.remove();
      return;
    }

    if (existing) return;

    const s = document.createElement("script");
    s.id = SCRIPT_ID;
    s.src = ADSTERRA_SRC;
    s.async = true;
    document.body.appendChild(s);
  }, [isGamePage]);

  return null;
};

export default AdsterraLoader;
