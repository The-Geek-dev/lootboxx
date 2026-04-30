import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import { loadFont } from "@remotion/google-fonts/Inter";
import { COLORS } from "../theme";
import { CaptionTrack } from "../components/CaptionTrack";

const { fontFamily } = loadFont("normal", { weights: ["400", "600", "700", "800"], subsets: ["latin"] });

export const Scene1Intro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const logoIn = spring({ frame, fps, config: { damping: 12, stiffness: 120 } });
  const logoScale = interpolate(logoIn, [0, 1], [0.5, 1]);
  const logoOpacity = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });

  const titleIn = spring({ frame: frame - 18, fps, config: { damping: 18, stiffness: 150 } });
  const titleY = interpolate(titleIn, [0, 1], [30, 0]);

  // Glow pulse
  const pulse = Math.sin(frame * 0.1) * 0.15 + 0.85;

  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(circle at 50% 50%, #0F1F2A 0%, #050505 70%)`,
        fontFamily: `${fontFamily}, "Noto Color Emoji"`,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 24,
      }}
    >
      {/* Animated grid backdrop */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `linear-gradient(${COLORS.primary}22 1px, transparent 1px), linear-gradient(90deg, ${COLORS.primary}22 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
          opacity: 0.4,
          maskImage: "radial-gradient(circle at 50% 50%, black 30%, transparent 75%)",
        }}
      />

      {/* Treasure chest emoji as logo mark */}
      <div
        style={{
          width: 160,
          height: 160,
          borderRadius: 32,
          background: `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.purple} 100%)`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 90,
          opacity: logoOpacity,
          transform: `scale(${logoScale})`,
          boxShadow: `0 0 ${80 * pulse}px ${COLORS.primaryGlow}`,
        }}
      >
        💎
      </div>

      <div
        style={{
          color: COLORS.text,
          fontSize: 72,
          fontWeight: 800,
          letterSpacing: "-0.03em",
          transform: `translateY(${titleY}px)`,
          opacity: interpolate(frame, [18, 30], [0, 1], { extrapolateRight: "clamp" }),
          textAlign: "center",
        }}
      >
        Loot<span style={{ color: COLORS.primary }}>Boxx</span>
      </div>
      <div
        style={{
          color: COLORS.textDim,
          fontSize: 24,
          fontWeight: 500,
          opacity: interpolate(frame, [30, 45], [0, 1], { extrapolateRight: "clamp" }),
          letterSpacing: "0.05em",
        }}
      >
        Quick tutorial · 25 seconds
      </div>

      <CaptionTrack
        cues={[
          { start: 0.2, end: 3.5, text: "Welcome to LootBoxx — Nigeria's smartest play and win platform." },
          { start: 3.5, end: 6.8, text: "In 90 seconds, see everything from sign up to cash out." },
          { start: 6.8, end: 10.0, text: "Make we begin!" },
        ]}
      />
    </AbsoluteFill>
  );
};
