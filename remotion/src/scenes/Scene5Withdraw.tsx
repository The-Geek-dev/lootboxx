import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { loadFont } from "@remotion/google-fonts/Inter";
import { COLORS } from "../theme";
import { CaptionTrack } from "../components/CaptionTrack";
import { BrowserChrome } from "../components/BrowserChrome";
import { Cursor } from "../components/Cursor";

const { fontFamily } = loadFont("normal", { weights: ["400", "600", "700", "800"], subsets: ["latin"] });

export const Scene5Withdraw: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Cursor: amount field → withdraw button
  const cursorPath = [
    { x: 800, y: 300 },
    { x: 800, y: 300 },
    { x: 640, y: 540 }, // request button
  ];

  // Typing animation for amount (slower, starts later)
  const amountStr = "20,000";
  const typeStart = 30;
  const charsToShow = Math.max(0, Math.min(amountStr.length, Math.floor((frame - typeStart) / 6)));
  const typed = amountStr.slice(0, charsToShow);

  const cardSpring = spring({ frame, fps, config: { damping: 18, stiffness: 160 } });
  const cardY = interpolate(cardSpring, [0, 1], [30, 0]);

  const submitFrame = 320;
  const submitted = frame >= submitFrame;
  const submitSpring = spring({ frame: frame - submitFrame, fps, config: { damping: 14, stiffness: 160 } });

  // Outro after withdraw success
  const outro = frame >= 420;

  return (
    <AbsoluteFill style={{ fontFamily: `${fontFamily}, "Noto Color Emoji"`, background: COLORS.bg }}>
      {!outro ? (
        <BrowserChrome url="lootboxx.live/withdraw">
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

          <div style={{ padding: "40px 60px 10px" }}>
            <div style={{ color: COLORS.text, fontSize: 30, fontWeight: 800 }}>Withdraw winnings</div>
            <div style={{ color: COLORS.textDim, fontSize: 14, marginTop: 4 }}>
              Available balance: <span style={{ color: COLORS.success, fontWeight: 700 }}>₦35,500</span>
            </div>
          </div>

          {/* Withdraw form card */}
          <div style={{ display: "flex", justifyContent: "center", padding: "20px" }}>
            <div
              style={{
                width: 600,
                background: COLORS.card,
                borderRadius: 16,
                border: `1px solid ${COLORS.border}`,
                padding: 28,
                transform: `translateY(${cardY}px)`,
                opacity: interpolate(cardSpring, [0, 1], [0, 1]),
              }}
            >
              <div style={{ color: COLORS.textDim, fontSize: 13, fontWeight: 600, marginBottom: 8 }}>AMOUNT (₦)</div>
              <div
                style={{
                  height: 64,
                  background: "#000",
                  borderRadius: 12,
                  border: `2px solid ${frame >= typeStart && frame < typeStart + 80 ? COLORS.primary : COLORS.border}`,
                  display: "flex",
                  alignItems: "center",
                  padding: "0 20px",
                  fontSize: 32,
                  fontWeight: 700,
                  color: COLORS.text,
                }}
              >
                {typed}
                {frame >= typeStart && frame < typeStart + 80 && Math.floor(frame / 8) % 2 === 0 && (
                  <span style={{ color: COLORS.primary, marginLeft: 2 }}>|</span>
                )}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginTop: 18 }}>
                <div>
                  <div style={{ color: COLORS.textDim, fontSize: 12, fontWeight: 600, marginBottom: 6 }}>BANK</div>
                  <div style={{ height: 44, background: "#000", borderRadius: 10, border: `1px solid ${COLORS.border}`, padding: "0 14px", display: "flex", alignItems: "center", color: COLORS.text, fontSize: 15 }}>
                    GTBank
                  </div>
                </div>
                <div>
                  <div style={{ color: COLORS.textDim, fontSize: 12, fontWeight: 600, marginBottom: 6 }}>ACCOUNT</div>
                  <div style={{ height: 44, background: "#000", borderRadius: 10, border: `1px solid ${COLORS.border}`, padding: "0 14px", display: "flex", alignItems: "center", color: COLORS.text, fontSize: 15 }}>
                    012•••••89
                  </div>
                </div>
              </div>

              <div
                style={{
                  marginTop: 22,
                  height: 56,
                  borderRadius: 12,
                  background: `linear-gradient(135deg, ${COLORS.success} 0%, ${COLORS.primary} 100%)`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#000",
                  fontWeight: 800,
                  fontSize: 18,
                  boxShadow: `0 0 30px ${COLORS.success}55`,
                }}
              >
                Request withdrawal
              </div>
              <div style={{ marginTop: 10, color: COLORS.textDim, fontSize: 11, textAlign: "center" }}>
                Withdrawals processed weekends 5–7 PM WAT
              </div>
            </div>
          </div>

          {/* Success toast */}
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
                <div style={{ color: COLORS.text, fontSize: 14, fontWeight: 700 }}>Request submitted</div>
                <div style={{ color: COLORS.textDim, fontSize: 12 }}>Funds arriving soon</div>
              </div>
            </div>
          )}
        </BrowserChrome>
      ) : (
        // Outro card
        <AbsoluteFill
          style={{
            background: `radial-gradient(circle at 50% 50%, #0F1F2A 0%, #050505 70%)`,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 16,
          }}
        >
          <div
            style={{
              fontSize: 100,
              transform: `scale(${interpolate(spring({ frame: frame - 135, fps, config: { damping: 12, stiffness: 150 } }), [0, 1], [0.4, 1])})`,
              filter: `drop-shadow(0 0 40px ${COLORS.primaryGlow})`,
            }}
          >
            💎
          </div>
          <div style={{ color: COLORS.text, fontSize: 56, fontWeight: 800, letterSpacing: "-0.02em" }}>
            Ready to play?
          </div>
          <div style={{ color: COLORS.textDim, fontSize: 22, fontWeight: 500 }}>
            Sign up · Deposit · Win 💸
          </div>
        </AbsoluteFill>
      )}

      {!outro && <Cursor path={cursorPath} legDuration={40} clickFrame={88} />}
      <CaptionTrack
        cues={[
          { start: 0.2, end: 4.0, text: "Open Withdraw on a weekend, between 6 and 7 PM." },
          { start: 4.0, end: 8.0, text: "Enter the amount and your bank details." },
          { start: 8.0, end: 12.0, text: "Submit — admin processes it quickly." },
          { start: 12.0, end: 17.5, text: "That's LootBoxx — sign up, activate, play, and win!" },
        ]}
      />
    </AbsoluteFill>
  );
};
