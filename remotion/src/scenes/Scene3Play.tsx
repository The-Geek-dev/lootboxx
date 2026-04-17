import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { loadFont } from "@remotion/google-fonts/Inter";
import { COLORS } from "../theme";
import { CaptionTrack } from "../components/CaptionTrack";
import { BrowserChrome } from "../components/BrowserChrome";
import { Cursor } from "../components/Cursor";

const { fontFamily } = loadFont("normal", { weights: ["400", "600", "700", "800"], subsets: ["latin"] });

const SYMBOLS = ["🍒", "🍋", "🔔", "⭐", "💎", "7️⃣"];

export const Scene3Play: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Reels spin frames 20-90, then settle on 7-7-7
  const reelStop = [60, 75, 90];
  const reels = reelStop.map((stop, i) => {
    if (frame < 20) return SYMBOLS[i];
    if (frame >= stop) return "7️⃣";
    const idx = Math.floor((frame - 20) * 0.8 + i * 1.5) % SYMBOLS.length;
    return SYMBOLS[idx];
  });

  // Cursor click on SPIN at frame ~15
  const cursorPath = [
    { x: 200, y: 600 },
    { x: 640, y: 480 },
  ];

  // WIN burst after all reels stop
  const allStopped = frame >= 90;
  const burstSpring = spring({ frame: frame - 90, fps, config: { damping: 12, stiffness: 180 } });
  const burstScale = allStopped ? interpolate(burstSpring, [0, 1], [0, 1]) : 0;

  // Confetti dots
  const confetti = Array.from({ length: 30 }).map((_, i) => {
    const seed = i * 37;
    const angle = (seed % 360) * (Math.PI / 180);
    const dist = allStopped ? interpolate(frame - 90, [0, 40], [0, 280 + (seed % 100)]) : 0;
    const fall = allStopped ? Math.pow(Math.max(0, frame - 90) / 30, 2) * 100 : 0;
    const opacity = allStopped ? interpolate(frame - 90, [0, 25, 60], [1, 1, 0], { extrapolateRight: "clamp" }) : 0;
    const colors = [COLORS.primary, COLORS.accent, COLORS.pink, COLORS.purple, COLORS.success];
    return {
      x: 640 + Math.cos(angle) * dist,
      y: 320 + Math.sin(angle) * dist + fall,
      color: colors[i % colors.length],
      opacity,
      rot: frame * 8 + seed,
    };
  });

  return (
    <AbsoluteFill style={{ fontFamily: `${fontFamily}, "Noto Color Emoji"`, background: COLORS.bg }}>
      <BrowserChrome url="lootboxx.live/games/lucky-slots">
        {/* Top bar */}
        <div
          style={{
            height: 56,
            background: COLORS.bgSoft,
            display: "flex",
            alignItems: "center",
            padding: "0 32px",
            gap: 16,
            borderBottom: `1px solid ${COLORS.border}`,
          }}
        >
          <div style={{ color: COLORS.textDim, fontSize: 14 }}>← Games</div>
          <div style={{ color: COLORS.text, fontSize: 18, fontWeight: 700 }}>🎰 Lucky Slots</div>
          <div style={{ flex: 1 }} />
          <div style={{ color: COLORS.text, fontSize: 14, fontWeight: 600 }}>
            ₦12,500 · ⚡ 8
          </div>
        </div>

        {/* Slot machine frame */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: 30,
            gap: 24,
          }}
        >
          <div
            style={{
              padding: 28,
              background: `linear-gradient(180deg, ${COLORS.card} 0%, #0A0A0A 100%)`,
              borderRadius: 24,
              border: `2px solid ${allStopped ? COLORS.primary : COLORS.border}`,
              boxShadow: allStopped
                ? `0 0 60px ${COLORS.primaryGlow}, inset 0 0 40px ${COLORS.primary}33`
                : "inset 0 4px 20px rgba(0,0,0,0.6)",
              display: "flex",
              gap: 16,
            }}
          >
            {reels.map((s, i) => (
              <div
                key={i}
                style={{
                  width: 130,
                  height: 160,
                  background: "#000",
                  borderRadius: 16,
                  border: `1px solid ${COLORS.border}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 90,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    transform: frame < reelStop[i] && frame > 20 ? `translateY(${(frame * 30) % 60 - 30}px)` : "translateY(0)",
                  }}
                >
                  {s}
                </div>
              </div>
            ))}
          </div>

          {/* Win banner */}
          {allStopped && (
            <div
              style={{
                background: `linear-gradient(90deg, ${COLORS.accent} 0%, ${COLORS.accentSoft} 100%)`,
                padding: "14px 40px",
                borderRadius: 999,
                color: "#000",
                fontWeight: 800,
                fontSize: 28,
                transform: `scale(${burstScale})`,
                boxShadow: `0 0 40px ${COLORS.accent}66`,
              }}
            >
              🎉 YOU WIN ₦3,000!
            </div>
          )}

          {/* Spin button */}
          <div
            style={{
              width: 280,
              height: 64,
              borderRadius: 16,
              background: frame >= 15 && frame < 30
                ? `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.purple} 100%)`
                : `linear-gradient(135deg, ${COLORS.primary}DD 0%, ${COLORS.purple}DD 100%)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#000",
              fontWeight: 800,
              fontSize: 22,
              letterSpacing: "0.05em",
              boxShadow: `0 0 30px ${COLORS.primaryGlow}`,
            }}
          >
            SPIN · 20 PTS
          </div>
        </div>

        {/* Confetti */}
        {confetti.map((c, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              left: c.x,
              top: c.y,
              width: 10,
              height: 10,
              background: c.color,
              opacity: c.opacity,
              transform: `rotate(${c.rot}deg)`,
              borderRadius: 2,
              pointerEvents: "none",
            }}
          />
        ))}
      </BrowserChrome>

      <Cursor path={cursorPath} legDuration={15} clickFrame={15} />
      <CaptionTrack
        cues={[
          { start: 0.2, end: 2.8, text: "Tap spin and watch the reels roll." },
          { start: 2.8, end: 5.4, text: "Match three symbols to win real cash." },
          { start: 5.4, end: 7.8, text: "Winnings land straight in your wallet." },
        ]}
      />
    </AbsoluteFill>
  );
};
