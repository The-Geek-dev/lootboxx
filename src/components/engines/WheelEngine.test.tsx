import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act, cleanup, fireEvent } from "@testing-library/react";



// ---- Mocks ----
const recordGameResult = vi.fn().mockResolvedValue({ success: true });
const updateBalance = vi.fn().mockResolvedValue(true);
const spendPoints = vi.fn().mockResolvedValue(true);
const consumeLife = vi.fn().mockResolvedValue(true);
const recordFullWin = vi.fn();

let canFullyWinValue = true;
let adjustWinAmountImpl: (n: number) => number = (n) => n;

vi.mock("@/hooks/useWallet", () => ({
  useWallet: () => ({ updateBalance, recordGameResult }),
}));
vi.mock("@/hooks/usePoints", () => ({
  usePoints: () => ({ points: 9999, spendPoints }),
}));
vi.mock("@/hooks/useXpLives", () => ({
  useXpLives: () => ({ xpLives: 10, consumeLife }),
}));
vi.mock("@/hooks/useWinRestrictions", () => ({
  useWinRestrictions: () => ({
    adjustWinAmount: (n: number) => adjustWinAmountImpl(n),
    recordFullWin,
    canFullyWin: () => canFullyWinValue,
  }),
}));
vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: vi.fn() }),
}));
vi.mock("@/hooks/useGameSounds", () => ({
  useGameSounds: () => ({ play: vi.fn() }),
}));
vi.mock("framer-motion", async () => {
  const React = await import("react");
  const passthrough = (tag: string) =>
    React.forwardRef(({ children, ...props }: any, ref: any) =>
      React.createElement(tag, { ref, ...props }, children),
    );
  return {
    motion: new Proxy({}, { get: (_t, k: string) => passthrough(k) }),
    AnimatePresence: ({ children }: any) => children,
  };
});
vi.mock("@/components/engines/GameBackground", () => ({
  default: ({ children }: any) => <div>{children}</div>,
}));
vi.mock("@/components/engines/BetControls", () => ({
  default: ({ onPlay, playLabel }: any) => (
    <button onClick={onPlay}>{playLabel}</button>
  ),
}));

import WheelEngine from "@/components/engines/WheelEngine";
import { WHEEL } from "@/config/payouts";

const SEGMENTS = [
  { label: "₦5,000", value: 5000, emoji: "💎" },
  { label: "₦100", value: 100, emoji: "🌟" },
  { label: "₦1,000", value: 1000, emoji: "🔥" },
  { label: "₦50", value: 50, emoji: "⭐" },
  { label: "₦2,000", value: 2000, emoji: "👑" },
  { label: "₦0", value: 0, emoji: "💨" },
  { label: "₦200", value: 200, emoji: "💰" },
  { label: "₦500", value: 500, emoji: "✨" },
];

async function spinAndCapture() {
  render(
    <WheelEngine
      gameId="wheel_test"
      name="Test Wheel"
      emoji="🎡"
      pointCost={20}
      segments={SEGMENTS}
    />,
  );
  await act(async () => {
    fireEvent.click(screen.getByRole("button"));
  });
  await act(async () => {
    await vi.advanceTimersByTimeAsync(4500);
  });

  expect(recordGameResult).toHaveBeenCalledTimes(1);
  const [, , recordedPrize, meta] = recordGameResult.mock.calls[0];
  return {
    recordedPrize: recordedPrize as number,
    segmentLabel: (meta as any).segment as string,
    segmentIndex: (meta as any).index as number,
  };
}

describe("WheelEngine — displayed prize matches recorded prize", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    recordGameResult.mockClear();
    updateBalance.mockClear();
    recordFullWin.mockClear();
  });
  afterEach(() => {
    vi.useRealTimers();
    cleanup();
  });

  it("full win window: shows prize == base * WHEEL.prizeMultiplier", async () => {
    canFullyWinValue = true;
    adjustWinAmountImpl = (n) => n; // no reduction
    // Force segment selection deterministically
    const rngSpy = vi.spyOn(Math, "random").mockReturnValue(0); // index 0 → ₦5,000
    const { recordedPrize, segmentIndex } = await spinAndCapture();

    expect(segmentIndex).toBe(0);
    const expected = Math.floor(5000 * WHEEL.prizeMultiplier);
    expect(recordedPrize).toBe(expected);

    const banner = await screen.findByText(/Won ₦/);
    expect(banner.textContent).toContain(`₦${expected.toLocaleString()}`);
    // Banner must NOT contain the raw segment label (regression guard)
    expect(banner.textContent).not.toContain("₦5,000!");
    rngSpy.mockRestore();
  });

  it("outside win window: shows the reduced prize, not the segment value", async () => {
    canFullyWinValue = false;
    // Simulate the "10–30% reduction" branch deterministically: keep 25%
    adjustWinAmountImpl = (n) => Math.floor(n * 0.25);
    const rngSpy = vi.spyOn(Math, "random").mockReturnValue(0); // ₦5,000 segment
    const { recordedPrize } = await spinAndCapture();

    const base = Math.floor(5000 * WHEEL.prizeMultiplier);
    expect(recordedPrize).toBe(Math.floor(base * 0.25));

    const banner = await screen.findByText(/Won ₦/);
    expect(banner.textContent).toContain(`₦${recordedPrize.toLocaleString()}`);
    rngSpy.mockRestore();
  });

  it("admin payout modifier 0.5: displayed amount == recorded amount", async () => {
    canFullyWinValue = true;
    adjustWinAmountImpl = (n) => Math.round(n * 0.5);
    // index 6 → ₦200
    const seq = [6 / SEGMENTS.length + 0.001, 0.5];
    let i = 0;
    const rngSpy = vi
      .spyOn(Math, "random")
      .mockImplementation(() => (i < seq.length ? seq[i++] : 0.5));
    const { recordedPrize, segmentIndex } = await spinAndCapture();

    expect(segmentIndex).toBe(6);
    const expected = Math.round(Math.floor(200 * WHEEL.prizeMultiplier) * 0.5);
    expect(recordedPrize).toBe(expected);

    const banner = await screen.findByText(/Won ₦/);
    expect(banner.textContent).toContain(`₦${expected.toLocaleString()}`);
    // Old bug: would have shown "₦200" alongside the actual prize
    expect(banner.textContent).not.toMatch(/₦200!.*Won/);
    rngSpy.mockRestore();
  });

  it("zero-value segment: shows lose message, no prize text", async () => {
    canFullyWinValue = true;
    adjustWinAmountImpl = (n) => n;
    // index 5 → ₦0
    const rngSpy = vi
      .spyOn(Math, "random")
      .mockReturnValue(5 / SEGMENTS.length + 0.001);
    const { recordedPrize, segmentIndex } = await spinAndCapture();

    expect(segmentIndex).toBe(5);
    expect(recordedPrize).toBe(0);
    expect(updateBalance).not.toHaveBeenCalled();
    expect(await screen.findByText(/Better luck next time/)).toBeInTheDocument();
    rngSpy.mockRestore();
  });
});
