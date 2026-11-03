const { chromium } = require("playwright");
const fs = require("fs");
const assert = require("node:assert/strict");
const root = require("node:path").resolve(__dirname, "..");
const original = fs.readFileSync(root + "/js/script.js", "utf8");
const hook = `window.__arcane={get state(){return state},get objects(){return objects},get dims(){return {width,heroSize,bossSize,heroX,bossX}},start,jump,pause,resume,makeSprite,heroBox,beginTransition,render,updateHud,tick(seconds){while(seconds>0&&state?.status==='playing'){const d=Math.min(.016,seconds);update(d);seconds-=d;}render();}};`;
(async () => {
  const browser = await chromium.launch({
    ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
      ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH }
      : {}),
    args: ["--no-sandbox"],
  });
  for (const viewport of [
    { width: 1280, height: 1000 },
    { width: 390, height: 1000 },
    { width: 320, height: 1000 },
  ]) {
    const page = await browser.newPage({ viewport });
    const errors = [];
    const failed = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("response", (r) => {
      if (r.status() >= 400) failed.push([r.url(), r.status()]);
    });
    await page.route("**/js/script.js*", (route) =>
      route.fulfill({
        contentType: "text/javascript",
        body: original.replace(/\}\)\(\);\s*$/, hook + "})();"),
      }),
    );
    await page.route("**/php/*.php", (route) =>
      route.fulfill({
        json: { status: "success", ranking: [{ nome: "Teste", pontos: 123 }] },
      }),
    );
    await page.goto(process.env.ARCANE_TEST_URL || "http://127.0.0.1:8000");
    await page.waitForFunction(
      () => !document.getElementById("start-button").disabled,
    );
    await page.clock.install();
    await page.clock.pauseAt(new Date());

    await page.locator("#player-name").fill("Teste");
    await page.locator("#start-button").click();
    const result = await page.evaluate(() => {
      const t = window.__arcane;
      const ok = (x, msg) => {
        if (!x) throw Error(msg);
      };
      t.tick(1.6);
      ok(
        t.objects.some((o) => o.kind === "rock"),
        "rock spawned",
      );
      t.state.hurtUntil = 999;
      t.tick(19.5);
      ok(t.state.mode === "run", "still run");
      ok(
        document
          .getElementById("notice")
          .textContent.includes("BOSS SE APROXIMA"),
        "approach warning",
      );
      t.tick(3);
      ok(t.state.mode === "transition", "run to transition");
      t.tick(2.5);
      ok(t.state.mode === "boss", "boss started");
      ok(!document.getElementById("boss").hidden, "boss visible");
      t.tick(1.6);
      ok(t.state.pendingAttack, "telegraphed attack");
      t.tick(1);
      ok(
        t.objects.some((o) => o.kind.startsWith("poison")),
        "poison released",
      );
      ok(
        t.objects.every((o) => o.kind === "poison projectile"),
        "only boss can shoot",
      );
      t.tick(20 - t.state.phaseTime - 0.02);
      ok(t.state.mode === "boss", "survival not complete early");
      const beforeVictory = t.state.score;
      t.tick(0.04);
      ok(t.state.score - beforeVictory >= 300, "survival bonus");
      ok(
        t.state.mode === "transition" && t.state.bosses === 1,
        "boss survived",
      );
      ok(t.state.round === 2, "next room");
      t.tick(2.5);
      ok(t.state.mode === "run", "back to run");
      t.pause();
      const snapshot = JSON.stringify(t.state);
      t.tick(5);
      ok(JSON.stringify(t.state) === snapshot, "pause freezes state");
      t.resume();
      t.start();
      t.state.spawn = 100;
      t.state.crystalAt = 100;
      const hb = t.heroBox();
      const el = document.createElement("span");
      document.getElementById("world").append(el);
      t.objects.push({
        kind: "crystal",
        el,
        x: hb.x + 5,
        y: hb.y + 8,
        size: 23,
        dead: false,
      });
      const before = t.state.score;
      t.tick(0.016);
      ok(Math.floor(t.state.score - before) === 30, "collect +30");
      t.makeSprite("rock", 60, t.heroBox().x - 10, 0);
      t.tick(0.016);
      ok(t.state.lives === 2, "rock collision");
      t.state.hurtUntil = 0;
      t.makeSprite("rock", 60, t.heroBox().x - 10, 0);
      t.tick(0.016);
      t.state.hurtUntil = 0;
      t.makeSprite("rock", 60, t.heroBox().x - 10, 0);
      t.tick(0.016);
      ok(t.state.status === "over", "gameover");
      t.start();
      ok(
        t.state.lives === 3 && t.state.mode === "run" && t.state.score === 0,
        "restart resets",
      );
      t.jump();
      t.tick(0.2);
      ok(t.state.y > 0, "jump");
      t.tick(1);
      ok(t.state.y === 0, "landing");
      t.beginTransition("boss");
      t.tick(2.5);
      t.state.hurtUntil = 999;
      t.tick(1);
      return {
        height: innerHeight,
        scrollHeight: document.documentElement.scrollHeight,
        boardBottom: document
          .getElementById("game-board")
          .getBoundingClientRect().bottom,
        removed: !document.querySelector(
          ".below-game,.game-heading,.game-toolbar,#hud-phase,#attack-cue,#spell-button,#boss-hud,footer",
        ),
        width: innerWidth,
        scroll: document.documentElement.scrollWidth,
        video: document.getElementById("scene-video").readyState,
        frames: document.getElementById("scene-video").videoWidth,
      };
    });

    assert.equal(result.scroll, viewport.width, "horizontal overflow");
    assert(result.scrollHeight <= result.height, "vertical overflow");
    assert(result.boardBottom <= result.height, "game fits viewport");
    assert(result.removed, "removed UI not in document");
    assert.deepEqual(errors, []);
    assert.deepEqual(failed, []);
    console.log(JSON.stringify({ viewport, result, status: "PASS" }));
    await page.close();
  }
  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
