const { chromium } = require("playwright");
const fs = require("node:fs");
const path = require("node:path");
const assert = require("node:assert/strict");
const source = fs.readFileSync(path.join(__dirname, "../js/script.js"), "utf8");
const hook = `window.__arcane={get state(){return state},get objects(){return objects},get dims(){return {width,heroSize,bossSize,heroX,bossX}},start,jump,pause,resume,makeSprite,makeCollectible,heroBox,beginTransition,render,updateHud,openSelection,openHome,tick(seconds){while(seconds>0&&['playing','evolving'].includes(state?.status)){const d=Math.min(.016,seconds);if(state.status==='evolving')updateEvolution(d);else update(d);seconds-=d;render();}}};`;
(async () => {
  const browser = await chromium.launch({
    ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
      ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH }
      : {}),
    args: ["--no-sandbox"],
  });
  try {
    for (const [width, reducedMotion] of [
      [1280, "no-preference"],
      [390, "no-preference"],
      [320, "no-preference"],
      [390, "reduce"],
    ]) {
      const page = await browser.newPage({
        viewport: { width, height: 844 },
        reducedMotion,
      });
      try {
        const errors = [];
        page.on("pageerror", (e) => errors.push(e.message));
        let posts = 0;
        await page.route("**/js/script.js*", (r) =>
          r.fulfill({
            contentType: "text/javascript",
            body: source.replace(/\}\)\(\);\s*$/, hook + "})();"),
          }),
        );
        await page.route("**/php/*.php", (r) => {
          if (r.request().method() === "POST") posts++;
          return r.fulfill({
            json: {
              status: "success",
              ranking: [{ nome: "Recordista", pontos: 9000 }],
            },
          });
        });
        await page.goto(process.env.ARCANE_TEST_URL || "http://127.0.0.1:8000");
        await page.waitForFunction(
          () => !document.getElementById("btn-start-game").disabled,
        );
        assert(await page.locator("#splash-screen").isVisible());
        assert(
          (await page.locator("#splash-record-text").textContent()).includes(
            "9000",
          ),
        );
        if (width === 1280) await page.keyboard.press("Space");
        else await page.locator("#btn-splash-play").click();
        assert(await page.locator("#howto-modal").isVisible());
        await page.locator("#btn-howto-ok").click();
        assert(await page.locator("#start-modal").isVisible());
        await page.locator("#btn-view-ranking").click();
        assert(
          (await page.locator("#gameover-title").textContent()) === "RANKING",
        );
        assert(await page.locator("#btn-restart").isHidden());
        assert.equal(posts, 0);
        await page.locator("#btn-change-player").click();
        await page.locator("#player-input").fill("Evolução");
        await page.locator("input[value=pikachu]").check();
        await page.clock.install();
        await page.clock.pauseAt(new Date());
        await page.locator("#btn-start-game").click();
        await page.keyboard.press("p");
        assert(await page.locator("#pause-screen").isVisible());
        await page.keyboard.press("Escape");
        assert(await page.locator("#pause-screen").isHidden());
        const result = await page.evaluate(() => {
          const t = window.__arcane;
          const ok = (v, m) => {
            if (!v) throw Error(m);
          };
          ok(
            t.state.character === "pikachu" && !t.state.evolved,
            "Pikachu selected",
          );
          t.tick(1.1);
          ok(
            t.objects.some((o) => o.kind === "candy"),
            "themed candy",
          );
          t.state.score = 1499;
          document.getElementById("hud-score").textContent = "999999";
          t.tick(0.016);
          ok(
            !t.objects.some((o) => o.kind === "stone"),
            "threshold uses real score",
          );
          t.state.score = 1500;
          t.tick(0.016);
          let stone = t.objects.find((o) => o.kind === "stone");
          ok(stone, "stone at 1500");
          stone.x = -stone.size - 1;
          t.tick(0.016);
          t.tick(0.85);
          stone = t.objects.find((o) => o.kind === "stone");
          ok(stone && !t.state.evolved, "missed stone respawns");
          t.beginTransition("boss");
          t.tick(2.5);
          t.state.hurtUntil = 999;
          t.tick(0.1);
          stone = t.objects.find((o) => o.kind === "stone");
          ok(stone, "stone also available during boss");
          const poison = t.makeSprite(
            "poison projectile",
            44,
            t.dims.width - 60,
            2,
          );
          t.jump();
          t.tick(0.2);
          stone.x = t.heroBox().x;
          stone.y = t.heroBox().y + 4;
          const score = t.state.score;
          t.tick(0.016);
          ok(
            t.state.status === "evolving",
            "collecting stone starts evolution",
          );
          ok(
            t.state.score - score >= 30 && t.state.score - score < 31,
            "stone adds 30",
          );
          ok(
            !document.getElementById("collect-display"),
            "item counter removed",
          );
          const snapshot = {
            time: t.state.time,
            elapsed: t.state.elapsed,
            phase: t.state.phaseTime,
            score: t.state.score,
            y: t.state.y,
            vy: t.state.vy,
            x: poison.x,
          };
          t.tick(0.45);
          ok(!t.state.evolved, "swap not early");
          ok(
            t.state.time === snapshot.time &&
              t.state.elapsed === snapshot.elapsed &&
              t.state.phaseTime === snapshot.phase &&
              t.state.score === snapshot.score &&
              t.state.y === snapshot.y &&
              t.state.vy === snapshot.vy &&
              poison.x === snapshot.x,
            "all gameplay frozen",
          );
          const rays = document.getElementById("raios-evolucao");
          ok(!rays.hidden, "rays visible");
          const box = rays.getBoundingClientRect();
          ok(
            box.x === 0 &&
              box.y === 0 &&
              Math.abs(box.width - innerWidth) < 1 &&
              Math.abs(box.height - innerHeight) < 1,
            "rays cover screen",
          );
          ok(
            document.getElementById("scene-video").paused,
            "video paused during evolution",
          );
          t.tick(0.2);
          ok(t.state.evolved, "swap after .6s");
          ok(
            document.getElementById("hero-image").alt === "Raichu",
            "Raichu sprite",
          );
          t.pause();
          const paused = JSON.stringify(t.state);
          t.tick(10);
          ok(
            paused === JSON.stringify(t.state),
            "pause also freezes evolution",
          );
          ok(rays.hidden, "rays hidden behind pause");
          t.resume();
          ok(t.state.status === "evolving" && !rays.hidden, "resume evolution");
          t.tick(0.56);
          ok(
            t.state.status === "playing" && t.state.evolved,
            "evolution complete",
          );
          ok(rays.hidden, "rays cleaned");
          ok(
            Math.abs(t.state.phaseTime - snapshot.phase) < 0.035,
            "boss timer excludes evolution",
          );
          const raichu = [];
          for (let i = 0; i < 4; i++) {
            t.tick(0.101);
            raichu.push(
              document.getElementById("hero-image").getAttribute("src"),
            );
          }
          ok(new Set(raichu).size === 3, "Raichu running animation");
          t.tick(0.9);
          ok(t.state.y === 0, "jump continues and lands");
          t.start();
          ok(
            t.state.character === "pikachu" &&
              !t.state.evolved &&
              t.state.score === 0 &&
              rays.hidden,
            "restart restores Pikachu",
          );
          document.querySelector("input[value=wizard]").checked = true;
          t.start();
          t.state.score = 2000;
          t.tick(1.1);
          ok(
            t.state.character === "wizard" &&
              !t.state.evolved &&
              !t.objects.some((o) => o.kind === "stone"),
            "wizard never evolves",
          );
          return {
            status: "PASS",
            reduced: matchMedia("(prefers-reduced-motion: reduce)").matches,
            width: innerWidth,
            body: document.documentElement.scrollWidth,
            scoreThreshold: 1500,
          };
        });
        assert.equal(result.body, width);
        assert.equal(result.reduced, reducedMotion === "reduce");
        assert.deepEqual(errors, []);
        console.log(JSON.stringify(result));
        // Actual result modal, saving, home and character-change actions.
        await page.evaluate(() => {
          const t = window.__arcane;
          t.state.lives = 1;
          t.state.hurtUntil = 0;
          t.makeSprite("rock", 60, t.heroBox().x - 10, 0);
          t.tick(0.016);
        });
        await page.waitForFunction(
          () =>
            document.getElementById("save-status-msg").textContent ===
            "Pontuação registrada!",
        );
        assert.equal(posts, 1);
        assert(await page.locator("#gameover-modal").isVisible());
        await page.locator("#btn-home").click();
        assert(await page.locator("#splash-screen").isVisible());
        assert(await page.evaluate(() => window.__arcane.state === null));
        for (const mode of ["run", "boss", "evolving"]) {
          await page.evaluate((mode) => {
            const t = window.__arcane;
            document.querySelector(
              `input[value=${mode === "evolving" ? "pikachu" : "wizard"}]`,
            ).checked = true;
            t.start();
            if (mode === "boss") {
              t.beginTransition("boss");
              t.tick(2.5);
            }
            if (mode === "evolving") {
              t.state.score = 1500;
              t.tick(0.016);
              const stone = t.objects.find((o) => o.kind === "stone"),
                box = t.heroBox();
              stone.x = box.x + 4;
              stone.y = box.y + 4;
              t.tick(0.016);
            }
          }, mode);
          await page.locator("#pause-button").click();
          assert(await page.locator("#pause-screen").isVisible());
          await page.locator("#btn-pause-home").click();
          assert(await page.locator("#splash-screen").isVisible());
          assert(await page.locator("#pause-screen").isHidden());
          assert(await page.locator("#raios-evolucao").isHidden());
          assert(
            await page.evaluate(
              () =>
                window.__arcane.state === null &&
                window.__arcane.objects.length === 0 &&
                document.getElementById("scene-video").paused,
            ),
          );
          assert.equal(
            posts,
            1,
            "returning home must not submit an abandoned round",
          );
        }
      } finally {
        await page.close();
      }
    }
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
