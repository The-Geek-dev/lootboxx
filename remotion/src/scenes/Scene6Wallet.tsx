import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { loadFont } from "@remotion/google-fonts/Inter";
import { COLORS } from "../theme";
import { CaptionTrack } from "../components/CaptionTrack";
import { BrowserChrome } from "../components/BrowserChrome";

const { fontFamily } = loadFont("normal", { weights: ["400", "600", "700", "800"], subsets: ["latin"] });

export const Scene6Wallet: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const sCash = spring({ frame, fps, config: { damping: 18, stiffness: 160 } });
  const sPts = spring({ frame: frame - 12, fps, config: { damping: 18, stiffness: 160 } });

  const cashY = interpolate(sCash, [0, 1], [40, 0]);
  const ptsY = interpolate(sPts, [0, 1], [40, 0]);

  // Animated counters
  const cashVal = Math.floor(interpolate(frame, [10, 70], [0, 35500], { extrapolateRight: "clamp" }));
  const ptsVal = Math.floor(interpolate(frame, [22, 82], [0, 480], { extrapolateRight: "clamp" }));

  // Convert action: pulse arrow at frame 130
  const convertFrame = 140;
  const convertActive = frame >= convertFrame && frame < convertFrame + 40;

  // Recent activity
  const ACTIVITY = [
    { icon: "🎰", text: "Lucky Slots win", amt: "+₦3,000", color: COLORS.success },
    { icon: "🎲", text: "Dice Roll", amt: "−20 pts", color: COLORS.textDim },
    { icon: "🚀", text: "Crash win", amt: "+₦1,500", color: COLORS.success },
    { icon: "💎", text: "Mines", amt: "−20 pts", color: COLORS.textDim },
  ];

  return (
    <AbsoluteFill style={{ fontFamily: `${fontFamily}, "Noto Color Emoji"`, background: COLORS.bg }}>
      <BrowserChrome url="lootboxx.live/wallet">
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
                color: n === "Wallet" ? COLORS.primary : COLORS.textDim,
                fontWeight: n === "Wallet" ? 700 : 500,
                fontSize: 15,
                padding: "6px 12px",
                borderRadius: 8,
                background: n === "Wallet" ? `${COLORS.primary}1A` : "transparent",
              }}
            >
              {n}
            </div>
          ))}
        </div>

        <div style={{ padding: "26px 60px 4px" }}>
          <div style={{ color: COLORS.text, fontSize: 28, fontWeight: 800 }}>My Wallet</div>
          <div style={{ color: COLORS.textDim, fontSize: 13 }}>Track your earnings and game points</div>
        </div>

        {/* Two balance cards */}
        <div style={{ display: "flex", gap: 20, padding: "16px 60px", justifyContent: "center" }}>
          <div
            style={{
              flex: 1,
              maxWidth: 380,
              height: 150,
              borderRadius: 16,
              background: `linear-gradient(135deg, ${COLORS.success}30 0%, ${COLORS.card} 100%)`,
              border: `1px solid ${COLORS.success}66`,
              padding: 22,
              opacity: interpolate(sCash, [0, 1], [0, 1]),
              transform: `translateY(${cashY}px)`,
              boxShadow: `0 0 30px ${COLORS.success}22`,
            }}
          >
            <div style={{ color: COLORS.textDim, fontSize: 13, fontWeight: 600 }}>💰 CASH BALANCE</div>
            <div style={{ color: COLORS.text, fontSize: 44, fontWeight: 800, marginTop: 8, letterSpacing: "-0.02em" }}>
              ₦{cashVal.toLocaleString()}
            </div>
            <div style={{ color: COLORS.success, fontSize: 13, fontWeight: 600, marginTop: 4 }}>From your wins</div>
          </div>

          <div
            style={{
              flex: 1,
              maxWidth: 380,
              height: 150,
              borderRadius: 16,
              background: `linear-gradient(135deg, ${COLORS.primary}30 0%, ${COLORS.card} 100%)`,
              border: `1px solid ${convertActive ? COLORS.primary : COLORS.primary + "66"}`,
              padding: 22,
              opacity: interpolate(sPts, [0, 1], [0, 1]),
              transform: `translateY(${ptsY}px) scale(${convertActive ? 1.03 : 1})`,
              boxShadow: convertActive ? `0 0 50px ${COLORS.primaryGlow}` : `0 0 30px ${COLORS.primary}22`,
            }}
          >
            <div style={{ color: COLORS.textDim, fontSize: 13, fontWeight: 600 }}>⚡ GAME POINTS</div>
            <div style={{ color: COLORS.text, fontSize: 44, fontWeight: 800, marginTop: 8, letterSpacing: "-0.02em" }}>
              {ptsVal.toLocaleString()} <span style={{ fontSize: 18, color: COLORS.textDim, fontWeight: 600 }}>pts</span>
            </div>
            <div style={{ color: COLORS.primary, fontSize: 13, fontWeight: 600, marginTop: 4 }}>20 pts per game</div>
          </div>
        </div>

        {/* Convert button */}
        <div style={{ display: "flex", justifyContent: "center", padding: "8px 60px" }}>
          <div
            style={{
              padding: "12px 28px",
              borderRadius: 12,
              background: convertActive
                ? `linear-gradient(135deg, ${COLORS.accent} 0%, ${COLORS.accentSoft} 100%)`
                : COLORS.card,
              border: `1px solid ${convertActive ? COLORS.accent : COLORS.border}`,
              color: convertActive ? "#000" : COLORS.text,
              fontWeight: 700,
              fontSize: 15,
              display: "flex",
              alignItems: "center",
              gap: 10,
              transform: `scale(${convertActive ? 1.05 : 1})`,
              boxShadow: convertActive ? `0 0 40px ${COLORS.accent}66` : "none",
            }}
          >
            🔄 Convert points ↔ cash
          </div>
        </div>

        {/* Recent activity */}
        <div style={{ padding: "12px 60px" }}>
          <div style={{ color: COLORS.textDim, fontSize: 12, fontWeight: 700, letterSpacing: "0.05em", marginBottom: 10 }}>RECENT ACTIVITY</div>
          {ACTIVITY.map((a, i) => {
            const s = spring({ frame: frame - 60 - i * 8, fps, config: { damping: 20, stiffness: 180 } });
            return (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "10px 14px",
                  background: COLORS.card,
                  borderRadius: 10,
                  marginBottom: 6,
                  border: `1px solid ${COLORS.border}`,
                  opacity: interpolate(s, [0, 1], [0, 1]),
                  transform: `translateX(${interpolate(s, [0, 1], [-20, 0])}px)`,
                }}
              >
                <div style={{ fontSize: 22, marginRight: 12 }}>{a.icon}</div>
                <div style={{ flex: 1, color: COLORS.text, fontSize: 14, fontWeight: 600 }}>{a.text}</div>
                <div style={{ color: a.color, fontSize: 14, fontWeight: 700 }}>{a.amt}</div>
              </div>
            );
          })}
        </div>
      </BrowserChrome>

      <CaptionTrack
        cues={[
          { start: 0.2, end: 4.0, text: "Your wallet shows points for play and cash from wins." },
          { start: 4.0, end: 7.5, text: "Convert points to cash anytime." },
          { start: 7.5, end: 10.5, text: "Or top up your points with a quick renewal." },
        ]}
      />
    </AbsoluteFill>
  );
};
