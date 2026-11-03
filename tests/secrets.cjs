const { chromium } = require("playwright");
const fs = require("node:fs");
const path = require("node:path");
const assert = require("node:assert/strict");
const source = fs.readFileSync(path.join(__dirname, "../js/script.js"), "utf8");
const hook = `window.__secret={get state(){return state},get objects(){return objects},get heroSize(){return heroSize},start,jump,pause,resume,openSelection,openHome,heroBox,render,worldSpeed,tick(seconds){while(seconds>0&&state?.status==='playing'){const dt=Math.min(.008,seconds);update(dt);seconds-=dt;}render();}};`;

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
      await page.locator("#btn-splash-play").click();
      await page.locator("#btn-howto-ok").click();
      assert.equal(
        await page.locator("[data-secret-character]:visible").count(),
        0,
      );
      for (const name of ["Pedro", "SENAIx", "SENA"]) {
        await page.locator("#player-input").fill(name);
        assert.equal(
          await page.locator("[data-secret-character]:visible").count(),
          0,
        );
      }
      for (const name of ["SENAI", " senai "]) {
        await page.locator("#player-input").fill(name);
        assert.equal(
          await page.locator("[data-secret-character]:visible").count(),
          4,
        );
        assert(await page.locator("#secret-unlock-status").isVisible());
      }
      assert.deepEqual(
        await page.locator("[data-secret-character] strong").allTextContents(),
        ["THAMIRES", "PEDRO", "GUEDES", "AMANDA"],
      );
      const previews = await page.evaluate(async () => {
        const poses = Object.fromEntries(
          ["thamires", "pedro", "guedes", "amanda"].map((id) => [id, []]),
        );
        for (let i = 0; i < 9; i++) {
          for (const id in poses)
            poses[id].push(
              document.querySelector(`#${id}-preview .sprite-art`).style
                .backgroundPosition,
            );
          await new Promise((resolve) => setTimeout(resolve, 85));
        }
        return poses;
      });
      for (const [id, poses] of Object.entries(previews))
        assert(new Set(poses).size >= 5, `${id} preview animates`);
      if (process.env.CAPTURE_CHARACTERS)
        await page.screenshot({ path: `/tmp/senai-selection-${width}.png` });
      await page.clock.install();
      await page.clock.pauseAt(new Date());
      for (const id of ["thamires", "pedro", "guedes", "amanda"]) {
        await page.evaluate(() => window.__secret.openSelection());
        await page.locator("#player-input").fill("SENAI");
        await page.locator(`input[value="${id}"]`).check();
        await page.locator("#btn-start-game").click();
        const result = await page.evaluate((id) => {
          const t = window.__secret;
          const ok = (v, m) => {
            if (!v) throw Error(`${id}: ${m}`);
          };
          const $ = (id) => document.getElementById(id);
          ok(t.state.character === id, "secret selected");
          ok(
            $("game-board").dataset.theme === "dungeon" &&
              !$("scene-video").hidden &&
              $("scene-panorama").hidden,
            "wizard scenery",
          );
          t.tick(1.5);
          const rock = t.objects.find((o) => o.kind === "rock");
          const ring = t.objects.find((o) => o.kind === "ring");
          ok(rock && ring, "rock and ring spawned");
          ok(
            rock.el
              .querySelector(".sprite-art")
              .style.backgroundImage.includes("world-atlas.png"),
            "wizard obstacle",
          );
          ok(
            ring.el
              .querySelector(".sprite-art")
              .style.backgroundImage.includes("ring.png"),
            "Sonic collectible",
          );
          const poses = new Set();
          t.state.spawn = t.state.crystalAt = 100;
          for (let i = 0; i < 6; i++) {
            t.tick(0.09);
            poses.add(
              $("hero").querySelector(".sprite-art").style.backgroundPosition,
            );
          }
          ok(poses.size === 6, "six run frames");
          const art = $("hero")
            .querySelector(".sprite-art")
            .getBoundingClientRect();
          ok(
            art.height > t.heroSize * 0.8 && art.height <= t.heroSize,
            "proportional hero size",
          );
          ok(
            ring.size < art.height * 0.6 && ring.size >= 40,
            "readable smaller collectible",
          );
          rock.dead = true;
          const box = t.heroBox();
          ring.x = box.x + 8;
          ring.y = box.y + 10;
          const score = t.state.score;
          t.tick(0.008);
          ok(
            Math.floor(t.state.score - score) === 30 && !ring.el.isConnected,
            "ring collected for 30",
          );
          t.pause();
          const snapshot = JSON.stringify(t.state);
          t.tick(1);
          ok(JSON.stringify(t.state) === snapshot, "pause freezes secret");
          t.resume();
          const top =
            $("hero").querySelector(".sprite-art").style.backgroundPosition;
          t.tick(0.1);
          ok(
            $("hero").querySelector(".sprite-art").style.backgroundPosition !==
              top,
            "resume animates secret",
          );
          t.start();
          t.state.spawn = t.state.crystalAt = 100;
          t.tick(1.5);
          ok(
            t.state.lives === 3 && t.state.character === id,
            "restart preserves selection",
          );
          t.state.score = 1600;
          t.tick(0.008);
          ok(
            !t.objects.some((o) => o.kind === "stone") && !t.state.evolved,
            "no Pikachu evolution",
          );
          const doc = document.documentElement;
          ok(
            doc.scrollWidth === innerWidth && doc.scrollHeight <= innerHeight,
            "fits viewport",
          );
          return { id, heroHeight: art.height, ringSize: ring.size };
        }, id);
        if (process.env.CAPTURE_CHARACTERS)
          await page.screenshot({ path: `/tmp/senai-${id}-${width}.png` });
        console.log(
          JSON.stringify({ width, height, ...result, status: "PASS" }),
        );
      }
      await page.evaluate(() => window.__secret.openSelection());
      await page.locator("#player-input").fill("Outro jogador");
      assert.equal(
        await page.locator("[data-secret-character]:visible").count(),
        0,
      );
      assert.equal(
        await page.locator("[data-secret-character] input:disabled").count(),
        4,
      );
      assert(await page.locator('input[value="wizard"]').isChecked());
      // A stored secret cannot bypass the name gate after a reload.
      await page.evaluate(() => {
        localStorage.setItem("mario_final_character", "amanda");
        localStorage.setItem("mario_final_player", "Outro jogador");
      });
      await page.reload();
      await page.waitForFunction(
        () => !document.getElementById("btn-start-game").disabled,
      );
      assert(await page.locator('input[value="wizard"]').isChecked());
      await page.evaluate(() => {
        localStorage.setItem("mario_final_character", "amanda");
        localStorage.setItem("mario_final_player", "SENAI");
      });
      await page.reload();
      await page.waitForFunction(
        () => !document.getElementById("btn-start-game").disabled,
      );
      assert(await page.locator('input[value="amanda"]').isChecked());
      assert.equal(
        await page.locator("[data-secret-character] input:enabled").count(),
        4,
      );
      assert.deepEqual(errors, []);
      await page.close();
    }
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
