import React from "react";
import { AbsoluteFill } from "remotion";
import { TransitionSeries, springTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { Scene1Intro } from "./scenes/Scene1Intro";
import { Scene2Browse } from "./scenes/Scene2Browse";
import { Scene3Play } from "./scenes/Scene3Play";
import { Scene4Deposit } from "./scenes/Scene4Deposit";
import { Scene5Withdraw } from "./scenes/Scene5Withdraw";

// 5 scenes × 150 frames = 750 frames; transitions overlap 15 frames each (×4 = -60)
// Total = 690 frames @ 30fps ≈ 23 seconds. We use 750 in Composition for safety.
export const MainVideo: React.FC = () => {
  return (
    <AbsoluteFill style={{ background: "#0A0A0A" }}>
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={120}>
          <Scene1Intro />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={springTiming({ config: { damping: 200 }, durationInFrames: 18 })}
        />
        <TransitionSeries.Sequence durationInFrames={150}>
          <Scene2Browse />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={springTiming({ config: { damping: 200 }, durationInFrames: 18 })}
        />
        <TransitionSeries.Sequence durationInFrames={150}>
          <Scene3Play />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={springTiming({ config: { damping: 200 }, durationInFrames: 18 })}
        />
        <TransitionSeries.Sequence durationInFrames={170}>
          <Scene4Deposit />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={springTiming({ config: { damping: 200 }, durationInFrames: 18 })}
        />
        <TransitionSeries.Sequence durationInFrames={200}>
          <Scene5Withdraw />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};
