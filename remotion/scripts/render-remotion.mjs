import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition, openBrowser } from "@remotion/renderer";
import path from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";
import fs from "fs";
import os from "os";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

console.log("Bundling...");
const bundled = await bundle({
  entryPoint: path.resolve(__dirname, "../src/index.ts"),
  webpackOverride: (config) => config,
});

console.log("Opening browser...");
const browser = await openBrowser("chrome", {
  browserExecutable: process.env.PUPPETEER_EXECUTABLE_PATH ?? "/bin/chromium",
  chromiumOptions: {
    args: ["--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage"],
  },
  chromeMode: "chrome-for-testing",
});

console.log("Selecting composition...");
const composition = await selectComposition({
  serveUrl: bundled,
  id: "main",
  puppeteerInstance: browser,
});

const finalOut = process.argv[2] || "/mnt/documents/lootboxx-tutorial.mp4";
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "remotion-out-"));
const videoOnly = path.join(tmpDir, "video.mp4");
const audioOnly = path.join(tmpDir, "audio.wav");

console.log(`Rendering muted video to ${videoOnly}...`);
await renderMedia({
  composition,
  serveUrl: bundled,
  codec: "h264",
  outputLocation: videoOnly,
  puppeteerInstance: browser,
  muted: true,
  concurrency: 1,
});

console.log(`Rendering audio-only to ${audioOnly}...`);
await renderMedia({
  composition,
  serveUrl: bundled,
  codec: "wav",
  outputLocation: audioOnly,
  puppeteerInstance: browser,
  concurrency: 1,
});

await browser.close({ silent: false });

console.log(`Muxing video + audio (native AAC) -> ${finalOut}...`);
fs.mkdirSync(path.dirname(finalOut), { recursive: true });
execSync(
  `ffmpeg -y -i "${videoOnly}" -i "${audioOnly}" -c:v copy -c:a aac -b:a 192k -shortest "${finalOut}"`,
  { stdio: "inherit" }
);

console.log("Done!");
