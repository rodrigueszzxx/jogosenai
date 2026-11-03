const { chromium } = require("playwright");
const assert = require("node:assert/strict");

// Exercise the published script and the real media clock, without injected state.
(async () => {
  const browser = await chromium.launch({
    ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
      ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH }
      : {}),
    args: ["--no-sandbox"],
  });
  try {
    for (const width of [1280, 390, 320]) {
      for (const reducedMotion of ["no-preference", "reduce"]) {
        const page = await browser.newPage({
          viewport: { width, height: 844 },
          reducedMotion,
        });
        try {
          const errors = [];
          page.on("pageerror", (e) => errors.push(e.message));
          await page.goto(
            process.env.ARCANE_TEST_URL || "http://127.0.0.1:8000",
          );
          await page.waitForFunction(
            () => !document.getElementById("btn-start-game").disabled,
          );
          await page.locator("#btn-splash-play").click();
          await page.locator("#btn-howto-ok").click();
          const selection = await page.evaluate(async () => {
            const samples = { mage: [], shadow: [] };
            for (let i = 0; i < 8; i++) {
              for (const [name, id] of [
                ["mage", "mage-preview"],
                ["shadow", "shadow-preview"],
              ]) {
                samples[name].push(
                  document.querySelector(`#${id} .sprite-art`).style
                    .backgroundPosition,
                );
              }
              await new Promise((resolve) => setTimeout(resolve, 85));
            }
            return {
              samples,
              heights: [
                ...document.querySelectorAll(
                  ".card-body > img,.character-preview",
                ),
              ]
                .filter((el) => el.getClientRects().length)
                .map((el) => el.getBoundingClientRect().height),
              names: [...document.querySelectorAll(".card-body strong")]
                .filter((el) => el.getClientRects().length)
                .map((el) => el.getBoundingClientRect().top),
            };
          });
          assert(
            new Set(selection.samples.mage).size >= 3,
            "Mago preview animates",
          );
          assert(
            new Set(selection.samples.shadow).size >= 4,
            "Shadow preview animates",
          );
          assert(
            Math.max(...selection.heights) - Math.min(...selection.heights) < 1,
            "equal preview sizes",
          );
          assert(
            Math.abs(selection.names[0] - selection.names[1]) < 1 &&
              Math.abs(selection.names[2] - selection.names[3]) < 1,
            "character names aligned",
          );
          await page.locator("#player-input").fill("Animação");
          await page.locator("#btn-start-game").click();
          await page.waitForFunction(
            () => document.getElementById("scene-video").currentTime > 0.05,
          );
          const sample = await page.evaluate(async () => {
            const video = document.getElementById("scene-video");
            const art = document.querySelector("#hero .sprite-art");
            const positions = [];
            const canvas = document.createElement("canvas");
            canvas.width = 160;
            canvas.height = 90;
            const ctx = canvas.getContext("2d", { willReadFrequently: true });
            const fingerprint = () => {
              ctx.drawImage(video, 0, 0, 160, 90);
              let hash = 2166136261;
              for (const value of ctx.getImageData(0, 0, 160, 90).data)
                hash = Math.imul(hash ^ value, 16777619);
              return hash >>> 0;
            };
            const before = {
              time: video.currentTime,
              frames: video.getVideoPlaybackQuality().totalVideoFrames,
              hash: fingerprint(),
            };
            for (let i = 0; i < 7; i++) {
              positions.push(art.style.backgroundPosition);
              await new Promise((r) => setTimeout(r, 105));
            }
            const rect = art.getBoundingClientRect();
            return {
              positions,
              before,
              after: {
                time: video.currentTime,
                frames: video.getVideoPlaybackQuality().totalVideoFrames,
                hash: fingerprint(),
              },
              cropped: rect.width < parseFloat(art.style.backgroundSize),
              source: art.style.backgroundImage,
            };
          });
          assert(
            new Set(sample.positions).size >= 3,
            "three running poses must be displayed",
          );
          assert(sample.cropped, "display a single cropped frame");
          assert(sample.source.includes("wizard-atlas.png"));
          assert(
            sample.after.time > sample.before.time + 0.3,
            "video time must advance",
          );
          assert(
            sample.after.frames > sample.before.frames,
            "video must decode new frames",
          );
          assert.notEqual(
            sample.before.hash,
            sample.after.hash,
            "rendered video image must change",
          );
          await page.locator("#world .gem").waitFor();
          const gem = await page
            .locator("#world .gem .sprite-art")
            .first()
            .evaluate((el) => ({
              source: el.style.backgroundImage,
              width: el.getBoundingClientRect().width,
              height: el.getBoundingClientRect().height,
            }));
          assert(
            gem.source.includes("purple-gem.png"),
            "use the supplied collectible",
          );
          assert(gem.height >= 40 && gem.height <= 56, "collectible size");
          await page.locator("#pause-button").click();
          const frozen = await page.evaluate(() => ({
            time: document.getElementById("scene-video").currentTime,
            pose: document.querySelector("#hero .sprite-art").style
              .backgroundPosition,
            paused: document.getElementById("scene-video").paused,
          }));
          assert(frozen.paused);
          await page.waitForTimeout(250);
          const still = await page.evaluate(() => ({
            time: document.getElementById("scene-video").currentTime,
            pose: document.querySelector("#hero .sprite-art").style
              .backgroundPosition,
          }));
          assert.equal(
            still.pose,
            frozen.pose,
            "pause freezes the running animation",
          );
          assert(
            Math.abs(still.time - frozen.time) < 0.05,
            "pause freezes the video",
          );
          await page.locator("#resume-button").click();
          await page.waitForFunction(
            (time) =>
              document.getElementById("scene-video").currentTime > time + 0.15,
            frozen.time,
          );
          if (width === 1280 && reducedMotion === "no-preference") {
            await page.locator("#scene-video").evaluate((video) => {
              video.currentTime = video.duration - 0.15;
            });
            await page.waitForFunction(
              () => document.getElementById("scene-video").currentTime < 2,
            );
            assert(
              await page.locator("#scene-video").evaluate((v) => !v.paused),
              "background must loop",
            );
          }
          assert.deepEqual(errors, []);
          console.log(
            JSON.stringify({
              width,
              reducedMotion,
              runFrames: new Set(sample.positions).size,
              videoFrames: sample.after.frames - sample.before.frames,
              gemHeight: gem.height,
              status: "PASS",
            }),
          );
        } finally {
          await page.close();
        }
      }
    }
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
