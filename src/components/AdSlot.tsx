import { useLocation } from "react-router-dom";
import { useAdSettings, isRouteEnabled, isSlotEnabled } from "@/hooks/useAdSettings";

interface AdSlotProps {
  /** Identifier for analytics/debugging */
  id?: string;
  /** Slot height variant */
  size?: "small" | "medium" | "large";
  /** Optional label shown when no ad is loaded */
  label?: string;
  className?: string;
}

/**
 * Lightweight reserved container for ad networks (e.g. Adsterra).
 * Reserves vertical space so the layout stays stable whether or not
 * an ad fills it. Hidden on /games/* routes to protect gameplay UX.
 */
const AdSlot = ({ id, size = "medium", label = "Advertisement", className = "" }: AdSlotProps) => {
  const location = useLocation();
  const { settings } = useAdSettings();
  if (!isRouteEnabled(settings, location.pathname)) return null;
  if (!isSlotEnabled(settings, id)) return null;

  const heights: Record<string, string> = {
    small: "min-h-[90px]",
    medium: "min-h-[120px] md:min-h-[150px]",
    large: "min-h-[180px] md:min-h-[250px]",
  };

  return (
    <div className={`w-full container px-4 my-8 ${className}`}>
      <div
        id={id}
        aria-label={label}
        className={`ad-slot mx-auto max-w-5xl flex items-center justify-center rounded-lg border border-border/40 bg-muted/20 backdrop-blur-sm text-xs uppercase tracking-widest text-muted-foreground/60 ${heights[size]}`}
      >
        {label}
      </div>
    </div>
  );
};

export default AdSlot;
