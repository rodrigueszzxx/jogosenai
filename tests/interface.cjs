const { chromium } = require("playwright");
const fs = require("node:fs");
const path = require("node:path");
const assert = require("node:assert/strict");
const source = fs.readFileSync(path.join(__dirname, "../js/script.js"), "utf8");
const hook = `window.__interface={get state(){return state},endGame};`;

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
      let posts = 0,
        mode = "filled";
      const ranking = Array.from({ length: 10 }, (_, i) => ({
        nome:
          i === 0
            ? "Recordista com um nome bastante longo"
            : `Jogador ${i + 1}`,
        pontos: 9500 - i * 600,
      }));
      page.on("pageerror", (e) => errors.push(e.message));
      page.on("response", (r) => {
        if (r.status() >= 400 && !r.url().includes("/php/"))
          errors.push(`${r.status()} ${r.url()}`);
      });
      await page.route("**/js/script.js*", (r) =>
        r.fulfill({
          contentType: "text/javascript",
          body: source.replace(/\}\)\(\);\s*$/, hook + "})();"),
        }),
      );
      await page.route("**/php/*.php", (r) => {
        if (r.request().method() === "POST") {
          posts++;
          const result = r.request().postDataJSON();
          return r.fulfill({
            json: {
              status: "success",
              ranking: [
                { nome: result.nome, pontos: result.pontos },
                ...ranking.slice(0, 9),
              ],
            },
          });
        }
        if (mode === "error")
          return r.fulfill({ status: 503, json: { status: "error" } });
        return r.fulfill({
          json: { status: "success", ranking: mode === "empty" ? [] : ranking },
        });
      });
      await page.goto(process.env.ARCANE_TEST_URL || "http://127.0.0.1:8000");
      await page.waitForFunction(
        () => !document.getElementById("btn-start-game").disabled,
      );
      assert(
        (await page.locator("#splash-record-text").textContent()).includes(
          "9500",
        ),
      );
      const fit = async () => {
        const overflow = await page.evaluate(() => ({
          page: document.documentElement.scrollWidth > innerWidth,
          cards: [...document.querySelectorAll(".modal-card")]
            .filter((el) => el.getClientRects().length)
            .some((el) => el.scrollWidth > el.clientWidth + 1),
        }));
        assert.deepEqual(overflow, { page: false, cards: false });
      };
      await fit();
      assert(
        await page.locator(".about-link").evaluate((el) => {
          const r = el.getBoundingClientRect();
          return r.top >= 0 && r.bottom <= innerHeight;
        }),
      );
      await page.locator("#btn-splash-ranking").click();
      await page.locator("#ranking-leader").waitFor();
      assert.equal(await page.locator("#ranking-body tr").count(), 10);
      assert.equal(
        await page.locator("#ranking-leader-name").textContent(),
        ranking[0].nome,
      );
      assert(
        await page
          .locator("#btn-change-player")
          .evaluate((el) => el.classList.contains("primary")),
      );
      assert(await page.locator("#btn-restart").isHidden());
      assert.equal(posts, 0);
      await fit();
      await page.locator("#btn-home").click();
      await page.locator("#btn-splash-play").click();
      assert.equal(await page.locator(".howto-list li").count(), 6);
      assert(await page.locator(".control-strip kbd").first().isVisible());
      await fit();
      await page.locator("#btn-howto-ok").click();
      await page.locator("#player-input").fill("Novo recordista");
      await page.locator("#btn-start-game").click();
      await page.evaluate(() => {
        window.__interface.state.score = 9999;
        return window.__interface.endGame();
      });
      assert.equal(
        await page.locator("#gameover-title").textContent(),
        "GAME OVER",
      );
      assert.equal(
        await page.locator("#final-score-value").textContent(),
        "9999",
      );
      assert.equal(
        await page.locator("#ranking-body .highlight-current").count(),
        1,
      );
      assert(await page.locator("#btn-restart").isVisible());
      assert.equal(posts, 1);
      await fit();
      await page.locator("#btn-home").click();
      mode = "empty";
      await page.locator("#btn-splash-ranking").click();
      await page.waitForFunction(() =>
        document
          .getElementById("splash-record-text")
          .textContent.includes("Seja o primeiro"),
      );
      assert(await page.locator("#ranking-leader").isHidden());
      assert.equal(
        await page.locator("#ranking-body .loading-cell").count(),
        1,
      );
      await page.locator("#btn-home").click();
      mode = "error";
      await page.locator("#btn-splash-ranking").click();
      await page.waitForFunction(() =>
        document
          .getElementById("ranking-status")
          .textContent.includes("indisponível"),
      );
      assert.equal(posts, 1);
      await page.goto(
        new URL(
          "pages/sobre-nos.php",
          process.env.ARCANE_TEST_URL || "http://127.0.0.1:8000/",
        ).href,
      );
      assert.equal(await page.locator(".story-chapter").count(), 3);
      assert.equal(
        await page.locator("table,audio,video,script[src]").count(),
        0,
      );
      assert(
        (await page.locator("#nossa-historia").innerText()).includes(
          "A Beyond The Limits nasceu da paixão por tecnologia",
        ),
      );
      assert(
        (await page.locator(".story-mission").innerText()).includes(
          "não existem limites para a criatividade!",
        ),
      );
      await page.locator('.story-nav a[href="#nossa-historia"]').click();
      assert(new URL(page.url()).hash === "#nossa-historia");
      await fit();
      assert.deepEqual(errors, []);
      console.log(
        JSON.stringify({
          width,
          height,
          record: true,
          ranking: true,
          empty: true,
          error: true,
          gameover: true,
          about: true,
          status: "PASS",
        }),
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
