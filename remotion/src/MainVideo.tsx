import React from "react";
import { AbsoluteFill, Audio, staticFile, Sequence } from "remotion";
import { TransitionSeries, springTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { loadFont as loadEmoji } from "@remotion/google-fonts/NotoColorEmoji";
import { Scene1Intro } from "./scenes/Scene1Intro";
import { Scene2Browse } from "./scenes/Scene2Browse";
import { Scene3Play } from "./scenes/Scene3Play";
import { Scene4Deposit } from "./scenes/Scene4Deposit";
import { Scene5Withdraw } from "./scenes/Scene5Withdraw";

loadEmoji();

// Scene durations (frames @ 30fps)
const S1 = 180; // 6.0s
const S2 = 270; // 9.0s
const S3 = 240; // 8.0s
const S4 = 225; // 7.5s
const S5 = 330; // 11.0s
const T = 18;   // transition overlap frames

// Voiceover start frames (account for transition overlaps subtracting T per transition)
// Scene starts in TransitionSeries: S1=0, S2=S1-T, S3=S2start+S2-T, ...
const VO1_START = 6;
const VO2_START = S1 - T + 6;
const VO3_START = (S1 - T) + (S2 - T) + 6;
const VO4_START = (S1 - T) + (S2 - T) + (S3 - T) + 6;
const VO5_START = (S1 - T) + (S2 - T) + (S3 - T) + (S4 - T) + 6;

export const MainVideo: React.FC = () => {
  return (
    <AbsoluteFill style={{ background: "#0A0A0A" }}>
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={S1}>
          <Scene1Intro />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={springTiming({ config: { damping: 200 }, durationInFrames: T })}
        />
        <TransitionSeries.Sequence durationInFrames={S2}>
          <Scene2Browse />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={springTiming({ config: { damping: 200 }, durationInFrames: T })}
        />
        <TransitionSeries.Sequence durationInFrames={S3}>
          <Scene3Play />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={springTiming({ config: { damping: 200 }, durationInFrames: T })}
        />
        <TransitionSeries.Sequence durationInFrames={S4}>
          <Scene4Deposit />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={springTiming({ config: { damping: 200 }, durationInFrames: T })}
        />
        <TransitionSeries.Sequence durationInFrames={S5}>
          <Scene5Withdraw />
        </TransitionSeries.Sequence>
      </TransitionSeries>

      {/* Voiceover narration */}
      <Sequence from={VO1_START}><Audio src={staticFile("audio/vo1.mp3")} volume={1} /></Sequence>
      <Sequence from={VO2_START}><Audio src={staticFile("audio/vo2.mp3")} volume={1} /></Sequence>
      <Sequence from={VO3_START}><Audio src={staticFile("audio/vo3.mp3")} volume={1} /></Sequence>
      <Sequence from={VO4_START}><Audio src={staticFile("audio/vo4.mp3")} volume={1} /></Sequence>
      <Sequence from={VO5_START}><Audio src={staticFile("audio/vo5.mp3")} volume={1} /></Sequence>
    </AbsoluteFill>
  );
};
