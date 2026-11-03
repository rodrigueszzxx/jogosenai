const { chromium } = require("playwright");
const fs = require("node:fs");
const path = require("node:path");
const assert = require("node:assert/strict");
const source = fs.readFileSync(path.join(__dirname, "../js/script.js"), "utf8");
const hook = `window.__characters={get state(){return state},get objects(){return objects},get heroSize(){return heroSize},start,jump,pause,resume,openSelection,makeCollectible,makeSprite,heroBox,render,speedMultiplier,worldSpeed,tick(seconds){while(seconds>0&&state?.status==='playing'){const dt=Math.min(.008,seconds);update(dt);seconds-=dt;}render();}};`;

(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
    args: ["--no-sandbox"],
  });
  try {
    for (const [width, height] of [
      [1280, 900],
      [390, 844],
      [320, 568],
      [844, 390],
    ]) {
      const page = await browser.newPage({ viewport: { width, height } });
      const errors = [];
      page.on("pageerror", (e) => errors.push(e.message));
      page.on("response", (r) => {
        if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`);
      });
      await page.route("**/js/script.js*", (r) =>
        r.fulfill({
          contentType: "text/javascript",
          body: source.replace(/\}\)\(\);\s*$/, hook + "})();"),
        }),
      );
      await page.route("**/php/*.php", (r) =>
        r.fulfill({ json: { status: "success", ranking: [] } }),
      );
      await page.goto(process.env.ARCANE_TEST_URL || "http://127.0.0.1:8000");
      await page.waitForFunction(
        () => !document.getElementById("btn-start-game").disabled,
      );
      await page.clock.install();
      await page.clock.pauseAt(new Date());
      await page.locator("#btn-splash-play").click();
      await page.locator("#btn-howto-ok").click();
      assert.equal(await page.locator('input[name="character"]').count(), 4);
      assert.equal(await page.locator(".card-body small").count(), 0);
      await page.locator("#player-input").fill("Personagens");
      for (const character of ["wizard", "pikachu", "sonic", "shadow"]) {
        await page.evaluate((character) => {
          const t = window.__characters;
          t.openSelection();
          document.querySelector(`input[value="${character}"]`).checked = true;
          t.start();
        }, character);
        const result = await page.evaluate((character) => {
          const t = window.__characters;
          const $ = (id) => document.getElementById(id);
          const ok = (v, m) => {
            if (!v) throw Error(`${character}: ${m}`);
          };
          const theme =
            character === "wizard"
              ? "dungeon"
              : character === "pikachu"
                ? "pokemon"
                : "forest";
          ok($("game-board").dataset.theme === theme, "correct theme");
          ok(
            $("scene-video").hidden === (character !== "wizard"),
            "video exclusive to wizard",
          );
          ok(
            $("scene-panorama").hidden === (character === "wizard"),
            "panorama visibility",
          );
          if (character !== "wizard") {
            ok(
              $("scene-panorama")
                .style.getPropertyValue("--scene-image")
                .includes(`${theme}.jpg`),
              "correct backdrop",
            );
            ok($("scene-video").paused, "unused video is paused");
          }
          t.tick(1.5);
          const obstacle = t.objects.find((o) => o.kind === "rock");
          const item = t.objects.find((o) =>
            ["gem", "candy", "ring"].includes(o.kind),
          );
          ok(obstacle && item, "natural obstacle and item spawn");
          const obstacleImage =
            obstacle.el.querySelector(".sprite-art").style.backgroundImage;
          ok(
            obstacleImage.includes(
              character === "wizard"
                ? "world-atlas"
                : character === "pikachu"
                  ? "pokeball"
                  : "spike-ball",
            ),
            "correct obstacle image",
          );
          ok(
            item.kind ===
              (character === "wizard"
                ? "gem"
                : character === "pikachu"
                  ? "candy"
                  : "ring"),
            "themed collectible",
          );
          ok(
            item.size < obstacle.size && obstacle.size < t.heroSize,
            "proportional sizes",
          );
          if (item.kind === "ring")
            ok(
              item.el
                .querySelector(".sprite-art")
                .style.backgroundImage.includes("ring.png"),
              "new ring asset",
            );
          // Test real collection and score, independently of survival points.
          t.state.spawn = t.state.crystalAt = 100;
          obstacle.dead = true;
          const box = t.heroBox();
          item.x = box.x + 4;
          item.y = box.y + 10;
          const score = t.state.score;
          t.tick(0.008);
          ok(Math.floor(t.state.score - score) === 30, "collect gives 30");
          ok(
            !t.objects.includes(item) && !item.el.isConnected,
            "collected item disappears",
          );
          if (character === "shadow") {
            const poses = new Set();
            for (let i = 0; i < 6; i++) {
              t.tick(0.07);
              poses.add(
                $("hero").querySelector(".sprite-art").style.backgroundPosition,
              );
            }
            ok(poses.size === 6, "six animated Shadow frames");
          }
          if (character === "sonic")
            ok(
              $("hero-image").src.endsWith("sonic.gif") &&
                !$("hero-image").hidden,
              "Sonic running GIF",
            );
          const background =
            $("scene-panorama").style.getPropertyValue("--scene-offset");
          t.tick(0.1);
          ok(
            $("scene-panorama").style.getPropertyValue("--scene-offset") !==
              background,
            "scroll advances",
          );
          t.pause();
          const snapshot = JSON.stringify(t.state);
          const frozenBackground =
            $("scene-panorama").style.getPropertyValue("--scene-offset");
          t.tick(1);
          ok(JSON.stringify(t.state) === snapshot, "pause freezes clocks");
          ok(
            $("scene-panorama").style.getPropertyValue("--scene-offset") ===
              frozenBackground,
            "pause freezes scene",
          );
          t.resume();
          // A jump must clear each character's obstacle at every difficulty.
          for (const [time, speed] of [
            [0, 0.8],
            [20, 1.15],
            [45, 1.6],
            [90, 2],
          ]) {
            t.start();
            t.state.spawn = t.state.crystalAt = 100;
            t.state.elapsed = time;
            ok(
              Math.abs(t.speedMultiplier() - speed) < 0.000001,
              "reference speed",
            );
            const hb = t.heroBox();
            const size =
              character === "wizard"
                ? 60
                : Math.max(44, Math.min(70, t.heroSize * 0.48));
            t.makeSprite("rock", size, hb.x + hb.w + t.worldSpeed() * 0.2, 0);
            t.jump();
            t.tick(0.65);
            ok(t.state.lives === 3, "obstacle can be cleared by jumping");
          }
          t.start();
          t.state.spawn = t.state.crystalAt = 100;
          t.makeSprite("rock", 60, t.heroBox().x - 5, 0);
          t.tick(0.008);
          ok(
            t.state.lives === 2 && $("hud-lives").children.length === 2,
            "damage removes a heart",
          );
          t.state.score = 1500;
          t.tick(0.008);
          ok(
            t.objects.some((o) => o.kind === "stone") ===
              (character === "pikachu"),
            "evolution remains exclusive to Pikachu",
          );
          t.start();
          t.state.hurtUntil = 999;
          t.tick(1.5);
          const doc = document.documentElement;
          ok(
            doc.scrollWidth === innerWidth && doc.scrollHeight <= innerHeight,
            "game fits viewport",
          );
          return { character, theme, obstacleImage, hero: t.heroSize };
        }, character);
        if (process.env.CAPTURE_CHARACTERS)
          await page.screenshot({
            path: `/tmp/characters-${character}-${width}.png`,
          });
        console.log(
          JSON.stringify({ width, height, ...result, status: "PASS" }),
        );
      }
      assert.deepEqual(errors, []);
      await page.reload();
      await page.waitForFunction(
        () => !document.getElementById("btn-start-game").disabled,
      );
      assert(
        await page.locator('input[value="shadow"]').isChecked(),
        "saved character survives reload",
      );
      await page.close();
    }
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
