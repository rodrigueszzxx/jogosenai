const { chromium } = require("playwright");
const fs = require("fs");
const assert = require("node:assert/strict");
const source = fs.readFileSync(
  require("node:path").join(__dirname, "../js/script.js"),
  "utf8",
);
const hook = `window.__arcane={get state(){return state},get objects(){return objects},get dims(){return {width,heroSize,bossSize,heroX,bossX}},start,jump,pause,resume,makeSprite,heroBox,beginTransition,render,updateHud,projectileSpeed,tick(seconds){while(seconds>0&&state?.status==='playing'){const d=Math.min(.016,seconds);update(d);seconds-=d;}render();}};`;
(async () => {
  const browser = await chromium.launch({
    ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
      ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH }
      : {}),
    args: ["--no-sandbox"],
  });
  for (const width of [1280, 390, 320]) {
    const p = await browser.newPage({ viewport: { width, height: 950 } });
    await p.route("**/js/script.js*", (r) =>
      r.fulfill({
        contentType: "text/javascript",
        body: source.replace(/\}\)\(\);\s*$/, hook + "})();"),
      }),
    );
    await p.route("**/php/*.php", (r) =>
      r.fulfill({ json: { status: "success", ranking: [] } }),
    );
    await p.goto(process.env.ARCANE_TEST_URL || "http://127.0.0.1:8000");
    await p.waitForFunction(
      () => !document.getElementById("btn-start-game").disabled,
    );
    await p.clock.install();
    await p.clock.pauseAt(new Date());
    await p.locator("#btn-splash-play").click();
    await p.locator("#btn-howto-ok").click();
    await p.locator("#player-input").fill("Combat");
    await p.locator("#btn-start-game").click();
    const result = await p.evaluate(() => {
      const t = window.__arcane;
      const ok = (v, m) => {
        if (!v) throw Error(m);
      };
      const setup = () => {
        t.start();
        t.beginTransition("boss");
        t.tick(2.5);
        t.state.attackAt = 100;
      };
      const shot = (high) => {
        const d = t.dims;
        const b = t.heroBox();
        const o = t.makeSprite(
          "poison projectile",
          44,
          b.x - 1,
          high ? d.heroSize * 0.84 + 25 : 2,
        );
        o.high = high;
      };
      setup();
      shot(false);
      t.tick(0.016);
      ok(t.state.lives === 2, "low hits grounded hero");
      setup();
      t.jump();
      t.tick(0.25);
      shot(false);
      t.tick(0.016);
      ok(t.state.lives === 3, "jump dodges low");
      setup();
      shot(true);
      t.tick(0.016);
      ok(t.state.lives === 3, "ground dodges high");
      setup();
      t.jump();
      t.tick(0.25);
      shot(true);
      t.tick(0.016);
      ok(t.state.lives === 2, "high hits jumping hero");
      setup();
      t.state.attackAt = 1;
      for (let i = 0; i < 3; i++) {
        t.tick(3);
        t.state.hurtUntil = 999;
      }
      ok(t.state.attackCount >= 3, "attack sequence reached high");
      setup();
      const d = t.dims;
      t.state.attackAt = 1.7;
      while (t.state.mode === "boss" && t.state.status === "playing") {
        const b = t.heroBox();
        const threat = t.objects.find(
          (o) =>
            !o.high &&
            o.x > b.x + b.w &&
            (o.x - b.x - b.w) / t.projectileSpeed() < 0.12,
        );
        if (threat) t.jump();
        t.tick(0.016);
      }
      ok(
        t.state.mode === "transition" && t.state.bosses === 1,
        "survive by dodging only",
      );
      ok(t.state.lives === 3, "dodge timing protects all lives");
      setup();
      document.hiddenTest = true;
      Object.defineProperty(document, "hidden", {
        configurable: true,
        get: () => document.hiddenTest,
      });
      document.dispatchEvent(new Event("visibilitychange"));
      ok(t.state.status === "paused", "hidden pauses");
      const before = JSON.stringify(t.state);
      t.tick(10);
      ok(before === JSON.stringify(t.state), "hidden freezes timers");
      document.hiddenTest = false;
      document.dispatchEvent(new Event("visibilitychange"));
      ok(t.state.status === "paused", "no surprise resume");
      t.resume();
      ok(t.state.status === "playing", "explicit resume");
      setup();
      return "PASS";
    });
    await p.locator("#game-board").focus();
    await p.keyboard.press("Space");
    await p.evaluate(() => window.__arcane.tick(0.2));
    assert(
      await p.evaluate(() => window.__arcane.state.y > 0),
      "keyboard jump",
    );
    await p.keyboard.press("j");
    await p.keyboard.press("x");
    assert(
      await p.evaluate(
        () =>
          !("spellPending" in window.__arcane.state) &&
          window.__arcane.objects.every((o) => o.kind !== "spell projectile"),
      ),
      "no player shooting",
    );

    await p.clock.resume();
    await p.emulateMedia({ reducedMotion: "reduce" });
    await p.waitForFunction(
      () => !document.getElementById("scene-video").paused,
    );
    await p.emulateMedia({ reducedMotion: "no-preference" });
    await p.waitForFunction(
      () => !document.getElementById("scene-video").paused,
    );
    console.log(
      JSON.stringify({
        width,
        result,
        keyboard: "PASS",
        reducedMotion: "PASS",
      }),
    );
    await p.close();
  }
  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
