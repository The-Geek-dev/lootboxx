import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { loadFont } from "@remotion/google-fonts/Inter";
import { COLORS } from "../theme";
import { CaptionTrack } from "../components/CaptionTrack";
import { BrowserChrome } from "../components/BrowserChrome";
import { Cursor } from "../components/Cursor";

const { fontFamily } = loadFont("normal", { weights: ["400", "600", "700", "800"], subsets: ["latin"] });

const TIERS = [
  { amount: "₦7,000", label: "Activation", desc: "One-time unlock" },
  { amount: "₦15,000", label: "Standard", desc: "Most popular", featured: true },
  { amount: "₦30,000", label: "Premium", desc: "Best value" },
];

export const Scene4Deposit: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Cursor: nav → Standard tier → Pay button
  const cursorPath = [
    { x: 1100, y: 80 },
    { x: 740, y: 88 },   // Deposit nav
    { x: 740, y: 88 },
    { x: 640, y: 360 },  // Standard tier
    { x: 640, y: 360 },
    { x: 640, y: 540 },  // Pay button
  ];

  const tierSpring = (i: number) => spring({ frame: frame - 30 - i * 5, fps, config: { damping: 18, stiffness: 180 } });

  const selectedTier = frame >= 80 ? 1 : -1;

  // Success overlay after pay
  const paid = frame >= 130;
  const paidSpring = spring({ frame: frame - 130, fps, config: { damping: 14, stiffness: 160 } });

  return (
    <AbsoluteFill style={{ fontFamily: `${fontFamily}, "Noto Color Emoji"`, background: COLORS.bg }}>
      <BrowserChrome url="lootboxx.live/deposit">
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
          {["Home", "Games", "Leaderboard", "Deposit", "Wallet"].map((n) => (
            <div
              key={n}
              style={{
                color: n === "Deposit" ? COLORS.primary : COLORS.textDim,
                fontWeight: n === "Deposit" ? 700 : 500,
                fontSize: 15,
                padding: "6px 12px",
                borderRadius: 8,
                background: n === "Deposit" ? `${COLORS.primary}1A` : "transparent",
              }}
            >
              {n}
            </div>
          ))}
        </div>

        <div style={{ padding: "30px 60px 10px" }}>
          <div style={{ color: COLORS.text, fontSize: 30, fontWeight: 800 }}>Top up your wallet</div>
          <div style={{ color: COLORS.textDim, fontSize: 14 }}>Pay securely via Flutterwave</div>
        </div>

        <div style={{ display: "flex", gap: 20, padding: "16px 60px", justifyContent: "center" }}>
          {TIERS.map((t, i) => {
            const s = tierSpring(i);
            const opacity = interpolate(s, [0, 1], [0, 1]);
            const y = interpolate(s, [0, 1], [40, 0]);
            const isSelected = selectedTier === i;
            return (
              <div
                key={t.label}
                style={{
                  flex: 1,
                  maxWidth: 280,
                  height: 200,
                  borderRadius: 16,
                  background: isSelected
                    ? `linear-gradient(135deg, ${COLORS.primary}30 0%, ${COLORS.purple}30 100%)`
                    : COLORS.card,
                  border: `2px solid ${isSelected ? COLORS.primary : (t.featured ? COLORS.accent : COLORS.border)}`,
                  padding: 22,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  opacity,
                  transform: `translateY(${y}px) scale(${isSelected ? 1.04 : 1})`,
                  boxShadow: isSelected ? `0 0 40px ${COLORS.primaryGlow}` : "none",
                  position: "relative",
                }}
              >
                {t.featured && (
                  <div
                    style={{
                      position: "absolute",
                      top: -12,
                      right: 16,
                      background: COLORS.accent,
                      color: "#000",
                      fontSize: 11,
                      fontWeight: 800,
                      padding: "4px 10px",
                      borderRadius: 999,
                    }}
                  >
                    POPULAR
                  </div>
                )}
                <div>
                  <div style={{ color: COLORS.textDim, fontSize: 13, fontWeight: 600 }}>{t.label}</div>
                  <div style={{ color: COLORS.text, fontSize: 36, fontWeight: 800, marginTop: 4 }}>{t.amount}</div>
                </div>
                <div style={{ color: COLORS.textDim, fontSize: 13 }}>{t.desc}</div>
              </div>
            );
          })}
        </div>

        {/* Pay button */}
        <div style={{ display: "flex", justifyContent: "center", marginTop: 20 }}>
          <div
            style={{
              width: 320,
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
            }}
          >
            🔒 Pay with Flutterwave
          </div>
        </div>

        {/* Success overlay */}
        {paid && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(0,0,0,0.85)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "column",
              gap: 20,
              opacity: interpolate(paidSpring, [0, 1], [0, 1]),
            }}
          >
            <div
              style={{
                width: 120,
                height: 120,
                borderRadius: 60,
                background: COLORS.success,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 70,
                transform: `scale(${interpolate(paidSpring, [0, 1], [0.3, 1])})`,
                boxShadow: `0 0 60px ${COLORS.success}88`,
              }}
            >
              ✓
            </div>
            <div style={{ color: COLORS.text, fontSize: 32, fontWeight: 800 }}>Deposit successful!</div>
            <div style={{ color: COLORS.textDim, fontSize: 18 }}>₦15,000 added to your wallet</div>
          </div>
        )}
      </BrowserChrome>

      <Cursor path={cursorPath} legDuration={20} clickFrame={120} />
      <CaptionTrack
        cues={[
          { start: 0.2, end: 2.6, text: "Head to Deposit to top up your wallet." },
          { start: 2.6, end: 5.0, text: "Pick a tier — start with seven thousand to activate." },
          { start: 5.0, end: 7.3, text: "Pay securely through Flutterwave." },
        ]}
      />
    </AbsoluteFill>
  );
};
