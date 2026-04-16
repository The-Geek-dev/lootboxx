import React from "react";
import { useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";

interface Point { x: number; y: number; }
interface Props {
  /** Path waypoints in pixels (composition coords). Cursor moves through them in order. */
  path: Point[];
  /** Frames per leg between waypoints */
  legDuration?: number;
  /** Frame to trigger a click animation (relative to scene) */
  clickFrame?: number;
}

export const Cursor: React.FC<Props> = ({ path, legDuration = 25, clickFrame }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Determine current leg
  const totalLegs = Math.max(1, path.length - 1);
  const t = Math.min(frame / legDuration, totalLegs);
  const legIndex = Math.min(Math.floor(t), totalLegs - 1);
  const localT = t - legIndex;
  const eased = 1 - Math.pow(1 - localT, 3); // easeOut cubic

  const a = path[legIndex];
  const b = path[Math.min(legIndex + 1, path.length - 1)];
  const x = a.x + (b.x - a.x) * eased;
  const y = a.y + (b.y - a.y) * eased;

  // Click ripple
  let clickScale = 0;
  let clickOpacity = 0;
  if (clickFrame !== undefined && frame >= clickFrame) {
    const cf = frame - clickFrame;
    clickScale = interpolate(cf, [0, 25], [0, 2.2], { extrapolateRight: "clamp" });
    clickOpacity = interpolate(cf, [0, 6, 25], [0.7, 0.5, 0], { extrapolateRight: "clamp" });
  }

  // Cursor press squish
  const pressScale = clickFrame !== undefined && frame >= clickFrame && frame < clickFrame + 8
    ? interpolate(frame - clickFrame, [0, 4, 8], [1, 0.85, 1])
    : 1;

  return (
    <>
      {/* Click ripple */}
      {clickOpacity > 0 && (
        <div
          style={{
            position: "absolute",
            left: x - 30,
            top: y - 30,
            width: 60,
            height: 60,
            borderRadius: 60,
            border: "3px solid #5EE7DF",
            transform: `scale(${clickScale})`,
            opacity: clickOpacity,
            pointerEvents: "none",
          }}
        />
      )}
      {/* Cursor */}
      <svg
        width="32" height="32" viewBox="0 0 24 24"
        style={{
          position: "absolute",
          left: x,
          top: y,
          transform: `scale(${pressScale})`,
          transformOrigin: "top left",
          filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.6))",
          pointerEvents: "none",
          zIndex: 100,
        }}
      >
        <path
          d="M2 2 L2 18 L7 14 L10 21 L13 19 L10 13 L17 13 Z"
          fill="white"
          stroke="black"
          strokeWidth="1.2"
          strokeLinejoin="round"
        />
      </svg>
    </>
  );
};
