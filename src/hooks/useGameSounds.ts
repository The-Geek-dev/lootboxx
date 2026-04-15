import { useCallback, useRef } from "react";

const AudioCtx = typeof window !== "undefined" ? (window.AudioContext || (window as any).webkitAudioContext) : null;

type SoundType = "spin" | "win" | "bigwin" | "match2" | "tick" | "bonus" | "lose" | "cashout";

const SOUNDS: Record<SoundType, { freq: number; duration: number; type: OscillatorType; gain: number; ramp?: number }[]> = {
  spin: [
    { freq: 300, duration: 0.05, type: "square", gain: 0.08 },
    { freq: 400, duration: 0.05, type: "square", gain: 0.06 },
  ],
  tick: [{ freq: 600, duration: 0.03, type: "sine", gain: 0.05 }],
  match2: [
    { freq: 523, duration: 0.12, type: "sine", gain: 0.15 },
    { freq: 659, duration: 0.12, type: "sine", gain: 0.15 },
  ],
  win: [
    { freq: 523, duration: 0.15, type: "sine", gain: 0.2 },
    { freq: 659, duration: 0.15, type: "sine", gain: 0.2 },
    { freq: 784, duration: 0.2, type: "sine", gain: 0.2 },
  ],
  bigwin: [
    { freq: 523, duration: 0.15, type: "sine", gain: 0.25 },
    { freq: 659, duration: 0.15, type: "sine", gain: 0.25 },
    { freq: 784, duration: 0.15, type: "sine", gain: 0.25 },
    { freq: 1047, duration: 0.3, type: "sine", gain: 0.3 },
  ],
  bonus: [
    { freq: 440, duration: 0.1, type: "triangle", gain: 0.2 },
    { freq: 554, duration: 0.1, type: "triangle", gain: 0.2 },
    { freq: 659, duration: 0.1, type: "triangle", gain: 0.2 },
    { freq: 880, duration: 0.2, type: "triangle", gain: 0.25 },
  ],
  lose: [
    { freq: 300, duration: 0.15, type: "sawtooth", gain: 0.1 },
    { freq: 250, duration: 0.2, type: "sawtooth", gain: 0.08 },
  ],
  cashout: [
    { freq: 800, duration: 0.08, type: "sine", gain: 0.15 },
    { freq: 1000, duration: 0.08, type: "sine", gain: 0.15 },
    { freq: 1200, duration: 0.12, type: "sine", gain: 0.2 },
  ],
};

export function useGameSounds() {
  const ctxRef = useRef<AudioContext | null>(null);

  const getCtx = useCallback(() => {
    if (!AudioCtx) return null;
    if (!ctxRef.current || ctxRef.current.state === "closed") {
      ctxRef.current = new AudioCtx();
    }
    if (ctxRef.current.state === "suspended") {
      ctxRef.current.resume();
    }
    return ctxRef.current;
  }, []);

  const play = useCallback((sound: SoundType) => {
    const ctx = getCtx();
    if (!ctx) return;
    const notes = SOUNDS[sound];
    if (!notes) return;
    let offset = 0;
    for (const note of notes) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = note.type;
      osc.frequency.setValueAtTime(note.freq, ctx.currentTime + offset);
      gain.gain.setValueAtTime(note.gain, ctx.currentTime + offset);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + offset + note.duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + offset);
      osc.stop(ctx.currentTime + offset + note.duration + 0.01);
      offset += note.duration;
    }
  }, [getCtx]);

  return { play };
}
