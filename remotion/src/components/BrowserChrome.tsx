import React from "react";
import { COLORS } from "../theme";

export const BrowserChrome: React.FC<{ url: string; children: React.ReactNode }> = ({ url, children }) => (
  <div
    style={{
      position: "absolute",
      inset: 0,
      background: "linear-gradient(135deg, #050505 0%, #0F0F1A 100%)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    }}
  >
    <div
      style={{
        width: 1140,
        height: 600,
        background: COLORS.bg,
        borderRadius: 16,
        overflow: "hidden",
        boxShadow: "0 30px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.06)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Browser bar */}
      <div
        style={{
          height: 44,
          background: "#1A1A1A",
          display: "flex",
          alignItems: "center",
          padding: "0 16px",
          gap: 8,
          borderBottom: `1px solid ${COLORS.border}`,
        }}
      >
        <div style={{ width: 12, height: 12, borderRadius: 6, background: "#FF5F57" }} />
        <div style={{ width: 12, height: 12, borderRadius: 6, background: "#FEBC2E" }} />
        <div style={{ width: 12, height: 12, borderRadius: 6, background: "#28C840" }} />
        <div
          style={{
            flex: 1,
            margin: "0 16px",
            height: 26,
            background: "#0F0F0F",
            borderRadius: 13,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: COLORS.textDim,
            fontSize: 12,
            fontFamily: "monospace",
          }}
        >
          🔒 {url}
        </div>
      </div>
      <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>{children}</div>
    </div>
  </div>
);
