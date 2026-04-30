import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { loadFont } from "@remotion/google-fonts/Inter";
import { COLORS } from "../theme";
import { CaptionTrack } from "../components/CaptionTrack";
import { BrowserChrome } from "../components/BrowserChrome";
import { Cursor } from "../components/Cursor";

const { fontFamily } = loadFont("normal", { weights: ["400", "600", "700", "800"], subsets: ["latin"] });

const FIELDS = [
  { label: "FULL NAME", value: "Chinedu Okafor", typeStart: 10 },
  { label: "EMAIL", value: "chinedu@lootboxx.live", typeStart: 70 },
  { label: "PASSWORD", value: "••••••••••", typeStart: 140 },
];

export const Scene2Signup: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const cardSpring = spring({ frame, fps, config: { damping: 18, stiffness: 160 } });
  const cardY = interpolate(cardSpring, [0, 1], [40, 0]);
  const cardOp = interpolate(cardSpring, [0, 1], [0, 1]);

  // Cursor: hovers over Sign Up button at end
  const cursorPath = [
    { x: 1000, y: 500 },
    { x: 640, y: 540 },
  ];

  const submitFrame = 220;
  const submitted = frame >= submitFrame;
  const submitSpring = spring({ frame: frame - submitFrame, fps, config: { damping: 14, stiffness: 160 } });

  return (
    <AbsoluteFill style={{ fontFamily: `${fontFamily}, "Noto Color Emoji"`, background: COLORS.bg }}>
      <BrowserChrome url="lootboxx.live/signup">
        <div
          style={{
            height: 64,
            background: COLORS.bgSoft,
            display: "flex",
            alignItems: "center",
            padding: "0 32px",
            gap: 28,
            borderBottom: `1px solid ${COLORS.border}`,
          }}
        >
          <div style={{ color: COLORS.text, fontWeight: 800, fontSize: 22 }}>
            💎 Loot<span style={{ color: COLORS.primary }}>Boxx</span>
          </div>
          <div style={{ flex: 1 }} />
          <div style={{ color: COLORS.textDim, fontSize: 14 }}>Already have account? <span style={{ color: COLORS.primary, fontWeight: 600 }}>Login</span></div>
        </div>

        <div style={{ padding: "30px 60px 8px" }}>
          <div style={{ color: COLORS.text, fontSize: 30, fontWeight: 800 }}>Create your account</div>
          <div style={{ color: COLORS.textDim, fontSize: 14 }}>Takes less than a minute</div>
        </div>

        <div style={{ display: "flex", justifyContent: "center", padding: "20px" }}>
          <div
            style={{
              width: 520,
              background: COLORS.card,
              borderRadius: 16,
              border: `1px solid ${COLORS.border}`,
              padding: 28,
              transform: `translateY(${cardY}px)`,
              opacity: cardOp,
            }}
          >
            {FIELDS.map((f, i) => {
              const charsToShow = Math.max(0, Math.min(f.value.length, Math.floor((frame - f.typeStart) / 2.5)));
              const typed = f.value.slice(0, charsToShow);
              const focused = frame >= f.typeStart && frame < f.typeStart + f.value.length * 2.5 + 5;
              return (
                <div key={f.label} style={{ marginBottom: 16 }}>
                  <div style={{ color: COLORS.textDim, fontSize: 12, fontWeight: 600, marginBottom: 6 }}>{f.label}</div>
                  <div
                    style={{
                      height: 50,
                      background: "#000",
                      borderRadius: 10,
                      border: `2px solid ${focused ? COLORS.primary : COLORS.border}`,
                      padding: "0 16px",
                      display: "flex",
                      alignItems: "center",
                      color: COLORS.text,
                      fontSize: 16,
                      fontWeight: 500,
                    }}
                  >
                    {typed}
                    {focused && Math.floor(frame / 8) % 2 === 0 && (
                      <span style={{ color: COLORS.primary, marginLeft: 2 }}>|</span>
                    )}
                  </div>
                </div>
              );
            })}

            <div
              style={{
                marginTop: 22,
                height: 56,
                borderRadius: 12,
                background: `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.purple} 100%)`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#000",
                fontWeight: 800,
                fontSize: 18,
                boxShadow: `0 0 30px ${COLORS.primaryGlow}`,
                transform: frame >= submitFrame - 5 && frame < submitFrame + 8 ? "scale(0.97)" : "scale(1)",
              }}
            >
              Create account →
            </div>
          </div>
        </div>

        {submitted && (
          <div
            style={{
              position: "absolute",
              top: 100,
              right: 40,
              background: COLORS.card,
              border: `1px solid ${COLORS.success}`,
              borderRadius: 12,
              padding: "14px 20px",
              display: "flex",
              alignItems: "center",
              gap: 12,
              boxShadow: `0 0 30px ${COLORS.success}44`,
              transform: `translateX(${interpolate(submitSpring, [0, 1], [400, 0])}px)`,
              opacity: interpolate(submitSpring, [0, 1], [0, 1]),
            }}
          >
            <div style={{ width: 32, height: 32, borderRadius: 16, background: COLORS.success, display: "flex", alignItems: "center", justifyContent: "center", color: "#000", fontSize: 18, fontWeight: 800 }}>✓</div>
            <div>
              <div style={{ color: COLORS.text, fontSize: 14, fontWeight: 700 }}>Account created!</div>
              <div style={{ color: COLORS.textDim, fontSize: 12 }}>Welcome to LootBoxx</div>
            </div>
          </div>
        )}
      </BrowserChrome>

      <Cursor path={cursorPath} legDuration={210} clickFrame={submitFrame} />
      <CaptionTrack
        cues={[
          { start: 0.2, end: 3.2, text: "Click sign up and create your account in seconds." },
          { start: 3.2, end: 8.5, text: "Just your name, email, and a password — that's all." },
        ]}
      />
    </AbsoluteFill>
  );
};
