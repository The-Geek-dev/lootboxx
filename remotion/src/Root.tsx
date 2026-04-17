import { Composition } from "remotion";
import { MainVideo } from "./MainVideo";

// Total: S1(180)+S2(270)+S3(240)+S4(225)+S5(330) - 4*18 transition overlaps = 1173 frames
export const RemotionRoot = () => (
  <Composition
    id="main"
    component={MainVideo}
    durationInFrames={1173}
    fps={30}
    width={1280}
    height={720}
  />
);
