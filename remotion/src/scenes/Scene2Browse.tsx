import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { loadFont } from "@remotion/google-fonts/Inter";
import { COLORS } from "../theme";
import { CaptionTrack } from "../components/CaptionTrack";
import { BrowserChrome } from "../components/BrowserChrome";
import { Cursor } from "../components/Cursor";

const { fontFamily } = loadFont("normal", { weights: ["400", "600", "700", "800"], subsets: ["latin"] });

const NAV_ITEMS = ["Home", "Games", "Leaderboard", "Deposit", "Wallet"];
const GAMES = [
  { emoji: "🎰", name: "Lucky Slots", color: COLORS.primary },
  { emoji: "🎲", name: "Dice Roll", color: COLORS.accent },
  { emoji: "🪙", name: "Coin Flip", color: COLORS.pink },
  { emoji: "🚀", name: "Crash", color: COLORS.purple },
  { emoji: "💎", name: "Mines", color: COLORS.success },
  { emoji: "🎡", name: "Wheel", color: COLORS.accentSoft },
];

export const Scene2Browse: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Cursor: starts top-right, moves to "Games" nav, then to a game card
  const cursorPath = [
    { x: 1100, y: 80 },
    { x: 540, y: 88 },   // Games nav
    { x: 540, y: 88 },
    { x: 320, y: 380 },  // Lucky Slots card
  ];

  // Game cards stagger in
  const cardSpring = (i: number) => spring({ frame: frame - 10 - i * 4, fps, config: { damping: 18, stiffness: 180 } });

  // Highlight Games nav after cursor arrives
  const navHighlight = interpolate(frame, [25, 35], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ fontFamily: `${fontFamily}, "Noto Color Emoji"`, background: COLORS.bg }}>
      <BrowserChrome url="lootboxx.live/games">
        {/* Top nav */}
        <div
          style={{
            height: 64,
            background: COLORS.bgSoft,
            display: "flex",
            alignItems: "center",
            padding: "0 32px",
            gap: 32,
            borderBottom: `1px solid ${COLORS.border}`,
          }}
        >
          <div style={{ color: COLORS.text, fontWeight: 800, fontSize: 22, letterSpacing: "-0.02em" }}>
            💎 Loot<span style={{ color: COLORS.primary }}>Boxx</span>
          </div>
          <div style={{ display: "flex", gap: 28, marginLeft: 20 }}>
            {NAV_ITEMS.map((item, i) => {
              const isGames = item === "Games";
              return (
                <div
                  key={item}
                  style={{
                    color: isGames ? COLORS.primary : COLORS.textDim,
                    fontWeight: isGames ? 700 : 500,
                    fontSize: 15,
                    padding: "6px 12px",
                    borderRadius: 8,
                    background: isGames ? `${COLORS.primary}1A` : "transparent",
                    transform: isGames ? `scale(${1 + navHighlight * 0.08})` : "none",
                    transition: "none",
                  }}
                >
                  {item}
                </div>
              );
            })}
          </div>
          <div style={{ flex: 1 }} />
          <div style={{ color: COLORS.text, fontSize: 14, fontWeight: 600 }}>
            ₦12,500 · ⚡ 8
          </div>
        </div>

        {/* Page heading */}
        <div style={{ padding: "24px 40px 8px" }}>
          <div style={{ color: COLORS.text, fontSize: 32, fontWeight: 800 }}>Game Library</div>
          <div style={{ color: COLORS.textDim, fontSize: 14 }}>16 games · pick one to play</div>
        </div>

        {/* Game grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 20,
            padding: "16px 40px",
          }}
        >
          {GAMES.map((g, i) => {
            const s = cardSpring(i);
            const opacity = interpolate(s, [0, 1], [0, 1]);
            const y = interpolate(s, [0, 1], [40, 0]);
            const isTarget = i === 0;
            const targetGlow = isTarget ? interpolate(frame, [55, 70], [0, 1], { extrapolateRight: "clamp" }) : 0;
            return (
              <div
                key={g.name}
                style={{
                  height: 140,
                  borderRadius: 16,
                  background: `linear-gradient(135deg, ${g.color}25 0%, ${COLORS.card} 100%)`,
                  border: `1px solid ${isTarget ? g.color : COLORS.border}`,
                  padding: 20,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  opacity,
                  transform: `translateY(${y}px)`,
                  boxShadow: targetGlow ? `0 0 40px ${g.color}66` : "none",
                }}
              >
                <div style={{ fontSize: 44 }}>{g.emoji}</div>
                <div>
                  <div style={{ color: COLORS.text, fontSize: 18, fontWeight: 700 }}>{g.name}</div>
                  <div style={{ color: g.color, fontSize: 12, fontWeight: 600, marginTop: 2 }}>20 pts to play</div>
                </div>
              </div>
            );
          })}
        </div>
      </BrowserChrome>

      <Cursor path={cursorPath} legDuration={25} clickFrame={75} />
      <CaptionTrack
        cues={[
          { start: 0.2, end: 3.0, text: "Open the Games tab to browse the library." },
          { start: 3.0, end: 6.0, text: "Pick from slots, dice, crash, mines and more." },
          { start: 6.0, end: 8.8, text: "Each game costs just 20 points to play." },
        ]}
      />
    </AbsoluteFill>
  );
};
