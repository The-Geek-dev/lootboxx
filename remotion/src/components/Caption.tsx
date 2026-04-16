import React from "react";
import { useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { COLORS } from "../theme";

export const Caption: React.FC<{ text: string; subtitle?: string }> = ({ text, subtitle }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const inSpring = spring({ frame, fps, config: { damping: 18, stiffness: 180 } });
  const y = interpolate(inSpring, [0, 1], [40, 0]);
  const opacity = interpolate(frame, [0, 10], [0, 1], { extrapolateRight: "clamp" });

  return (
    <div
      style={{
        position: "absolute",
        bottom: 60,
        left: 0,
        right: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 8,
        opacity,
        transform: `translateY(${y}px)`,
        zIndex: 50,
      }}
    >
      <div
        style={{
          background: "rgba(10,10,10,0.85)",
          backdropFilter: "blur(10px)",
          border: `1px solid ${COLORS.border}`,
          borderRadius: 999,
          padding: "14px 32px",
          fontSize: 28,
          fontWeight: 700,
          color: COLORS.text,
          letterSpacing: "-0.01em",
          boxShadow: `0 0 30px ${COLORS.primaryGlow}`,
        }}
      >
        {text}
      </div>
      {subtitle && (
        <div style={{ color: COLORS.textDim, fontSize: 18, fontWeight: 500 }}>{subtitle}</div>
      )}
    </div>
  );
};
