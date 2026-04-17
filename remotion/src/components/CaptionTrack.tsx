import React from "react";
import { useCurrentFrame } from "remotion";
import { COLORS } from "../theme";

export type CaptionCue = {
  /** seconds from scene start (VO begins at ~0.2s after scene start in MainVideo) */
  start: number;
  end: number;
  text: string;
};

/**
 * Burned-in subtitle track. Picks the active cue based on current frame.
 * Times are in seconds relative to the scene's local time.
 */
export const CaptionTrack: React.FC<{
  cues: CaptionCue[];
  fps?: number;
  position?: "bottom" | "top";
}> = ({ cues, fps = 30, position = "bottom" }) => {
  const frame = useCurrentFrame();
  const t = frame / fps;
  const active = cues.find((c) => t >= c.start && t < c.end);
  if (!active) return null;

  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        [position]: 40,
        display: "flex",
        justifyContent: "center",
        padding: "0 60px",
        zIndex: 100,
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          background: "rgba(0,0,0,0.82)",
          border: `1px solid ${COLORS.border}`,
          borderRadius: 12,
          padding: "12px 24px",
          maxWidth: 980,
          textAlign: "center",
          color: "#FFFFFF",
          fontSize: 26,
          fontWeight: 700,
          lineHeight: 1.25,
          letterSpacing: "-0.005em",
          textShadow: "0 2px 8px rgba(0,0,0,0.9)",
          boxShadow: `0 4px 20px rgba(0,0,0,0.6), 0 0 0 1px ${COLORS.primary}33`,
        }}
      >
        {active.text}
      </div>
    </div>
  );
};
