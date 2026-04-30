import React from "react";
import { AbsoluteFill, Audio, staticFile, Sequence } from "remotion";
import { TransitionSeries, springTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { loadFont as loadEmoji } from "@remotion/google-fonts/NotoColorEmoji";
import { Scene1Intro } from "./scenes/Scene1Intro";
import { Scene2Signup } from "./scenes/Scene2Signup";
import { Scene4Deposit } from "./scenes/Scene4Deposit";
import { Scene2Browse } from "./scenes/Scene2Browse";
import { Scene3Play } from "./scenes/Scene3Play";
import { Scene6Wallet } from "./scenes/Scene6Wallet";
import { Scene5Withdraw } from "./scenes/Scene5Withdraw";

loadEmoji();

// Scene durations (frames @ 30fps) — sized to voiceover lengths + ~1.5s tail
const S1 = 340; // Intro       (vo1 9.85s)
const S2 = 290; // Signup      (vo2 8.17s)
const S3 = 392; // Activation  (vo3 11.56s)
const S4 = 355; // Browse      (vo4 10.36s)
const S5 = 302; // Play        (vo5 8.59s)
const S6 = 350; // Wallet      (vo6 10.17s)
const S7 = 575; // Withdraw + outro (vo7 17.41s)
const T = 18;   // transition overlap frames

// VO start frames inside the TransitionSeries timeline.
// Each transition shifts subsequent scene start by -T.
const VO_OFFSET = 6; // small lead-in
const VO1_START = VO_OFFSET;
const VO2_START = (S1 - T) + VO_OFFSET;
const VO3_START = (S1 - T) + (S2 - T) + VO_OFFSET;
const VO4_START = (S1 - T) + (S2 - T) + (S3 - T) + VO_OFFSET;
const VO5_START = (S1 - T) + (S2 - T) + (S3 - T) + (S4 - T) + VO_OFFSET;
const VO6_START = (S1 - T) + (S2 - T) + (S3 - T) + (S4 - T) + (S5 - T) + VO_OFFSET;
const VO7_START = (S1 - T) + (S2 - T) + (S3 - T) + (S4 - T) + (S5 - T) + (S6 - T) + VO_OFFSET;

export const MainVideo: React.FC = () => {
  return (
    <AbsoluteFill style={{ background: "#0A0A0A" }}>
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={S1}><Scene1Intro /></TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={springTiming({ config: { damping: 200 }, durationInFrames: T })} />
        <TransitionSeries.Sequence durationInFrames={S2}><Scene2Signup /></TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={springTiming({ config: { damping: 200 }, durationInFrames: T })} />
        <TransitionSeries.Sequence durationInFrames={S3}><Scene4Deposit /></TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={springTiming({ config: { damping: 200 }, durationInFrames: T })} />
        <TransitionSeries.Sequence durationInFrames={S4}><Scene2Browse /></TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={springTiming({ config: { damping: 200 }, durationInFrames: T })} />
        <TransitionSeries.Sequence durationInFrames={S5}><Scene3Play /></TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={springTiming({ config: { damping: 200 }, durationInFrames: T })} />
        <TransitionSeries.Sequence durationInFrames={S6}><Scene6Wallet /></TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={springTiming({ config: { damping: 200 }, durationInFrames: T })} />
        <TransitionSeries.Sequence durationInFrames={S7}><Scene5Withdraw /></TransitionSeries.Sequence>
      </TransitionSeries>

      <Sequence from={VO1_START}><Audio src={staticFile("audio/vo1.mp3")} volume={1} /></Sequence>
      <Sequence from={VO2_START}><Audio src={staticFile("audio/vo2.mp3")} volume={1} /></Sequence>
      <Sequence from={VO3_START}><Audio src={staticFile("audio/vo3.mp3")} volume={1} /></Sequence>
      <Sequence from={VO4_START}><Audio src={staticFile("audio/vo4.mp3")} volume={1} /></Sequence>
      <Sequence from={VO5_START}><Audio src={staticFile("audio/vo5.mp3")} volume={1} /></Sequence>
      <Sequence from={VO6_START}><Audio src={staticFile("audio/vo6.mp3")} volume={1} /></Sequence>
      <Sequence from={VO7_START}><Audio src={staticFile("audio/vo7.mp3")} volume={1} /></Sequence>
    </AbsoluteFill>
  );
};

// Total raw = S1+S2+S3+S4+S5+S6+S7 = 340+290+392+355+302+350+575 = 2604
// Minus 6 transition overlaps × 18 = 108
// Final composition durationInFrames = 2496 (≈ 83.2s @ 30fps)
export const TOTAL_FRAMES = S1 + S2 + S3 + S4 + S5 + S6 + S7 - 6 * T;
