/** Arcane Run: one animation clock controls movement, battles, score and pauses. */
(() => {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const sprites = JSON.parse($("sprite-data").textContent);
  const audio = window.ArcaneAudio;
  const board = $("game-board");
  const world = $("world");
  const hero = $("hero");
  const boss = $("boss");
  const video = $("scene-video");
  const motion = matchMedia("(prefers-reduced-motion: reduce)");
  const RUN_DURATION = 24;
  const TRANSITION_DURATION = 2.4;
  const BOSS_DURATION = 20;
  const GROUND = 43;
  const LEVELS = [
    { name: "Fácil", start: 0, speed: 1 },
    { name: "Médio", start: 20, speed: 1.15 },
    { name: "Difícil", start: 45, speed: 1.3 },
  ];
  let width = board.clientWidth;
  let heroSize, bossSize, heroX, bossX;
  let ready = false;
  let previous = performance.now();
  let requestVersion = 0;
  let state = null;
  let objects = [];
  let noticeUntil = 0;

  const readStorage = (key) => {
    try {
      return localStorage.getItem(key) || "";
    } catch (_) {
      return "";
    }
  };
  const saveStorage = (key, value) => {
    try {
      localStorage.setItem(key, value);
    } catch (_) {
      /* Optional preference. */
    }
  };
  $("player-name").value = readStorage("mario_final_player");

  function paintSprite(node, kind, size, frame = 0) {
    const sheet = kind === "hero" ? sprites.hero : sprites.world;
    const f = kind === "hero" ? sheet.frames[frame] : sheet.frames[kind];
    const scale = size / sheet.cell;
    const art = node.querySelector(".sprite-art");
    const anchor = f.anchorX ?? f.x + f.w / 2;
    node.style.width = `${size}px`;
    node.style.height = `${size}px`;
    art.style.backgroundImage = `url('${sheet.image}')`;
    art.style.left = `${size / 2 - (anchor - f.x) * scale}px`;
    art.style.width = `${f.w * scale}px`;
    art.style.height = `${f.h * scale}px`;
    art.style.backgroundSize = `${sheet.width * scale}px ${sheet.height * scale}px`;
    art.style.backgroundPosition = `${-f.x * scale}px ${-f.y * scale}px`;
  }

  function position(node, x, y) {
    node.style.transform = `translate3d(${x}px,${-(GROUND + y)}px,0)`;
  }

  function resize() {
    const oldWidth = width;
    width = board.clientWidth;
    heroSize = Math.max(
      88,
      Math.min(170, Math.max(112, width * 0.18), board.clientHeight * 0.4),
    );
    bossSize = Math.max(
      130,
      Math.min(235, width * 0.25, board.clientHeight * 0.65),
    );
    heroX = width * 0.045;
    bossX = width - bossSize - width * 0.025;
    objects.forEach((o) => {
      o.x *= width / oldWidth;
    });
    paintSprite(hero, "hero", heroSize);
    paintSprite(boss, "boss", bossSize);
    render();
  }

  function makeSprite(kind, size, x, y) {
    const el = document.createElement("div");
    el.className = `actor ${kind}`;
    const art = document.createElement("span");
    art.className = "sprite-art";
    el.append(art);
    world.append(el);
    paintSprite(el, kind.split(" ")[0], size);
    position(el, x, y);
    const object = { kind, el, x, y, size, dead: false };
    objects.push(object);
    return object;
  }

  function clearObjects() {
    objects.forEach((o) => o.el.remove());
    objects = [];
  }

  function showNotice(text, duration = 2.4) {
    $("notice").textContent = text;
    $("notice").hidden = false;
    noticeUntil = (state?.time || 0) + duration;
  }

  function scenePlayback() {
    if (state?.status === "playing" && !motion.matches && !document.hidden) {
      video.play().catch(() => {});
    } else video.pause();
  }

  function start() {
    if (!ready) return;
    const name = $("player-name").value.trim();
    if (!name) {
      $("player-name").focus();
      return;
    }
    requestVersion++;
    saveStorage("mario_final_player", name);
    clearObjects();
    audio?.pararEfeitos();
    state = {
      status: "playing",
      mode: "run",
      name,
      score: 0,
      time: 0,
      elapsed: 0,
      phaseTime: 0,
      round: 1,
      lives: 3,
      bosses: 0,
      crystals: 0,
      y: 0,
      vy: 0,
      hurtUntil: 0,
      spawn: 1.4,
      crystalAt: 1,
      attackAt: 1.8,
      attackCount: 0,
      pendingAttack: null,
      transitionTo: null,
    };
    $("hud-player").textContent = name;
    $("menu-screen").hidden = true;
    world.hidden = false;
    $("over-screen").hidden = true;
    $("pause-screen").hidden = true;
    $("lane-warning").hidden = true;
    boss.hidden = true;
    hero.classList.remove("hurt");
    $("pause-button").disabled = false;
    previous = performance.now();
    $("notice").hidden = true;
    board.focus({ preventScroll: true });
    scenePlayback();
    updateHud();
    render();
  }

  function jump() {
    if (
      state?.status !== "playing" ||
      state.mode === "transition" ||
      state.y > 0.1
    )
      return;
    state.vy = 455;
  }

  function beginTransition(target) {
    state.mode = "transition";
    state.phaseTime = 0;
    state.transitionTo = target;
    state.pendingAttack = null;
    state.y = 0;
    state.vy = 0;
    clearObjects();
    boss.classList.remove("charging");
    $("lane-warning").hidden = true;
    boss.hidden = true;
    if (target === "boss") showNotice("REI DO LODO", TRANSITION_DURATION);
    else showNotice(`TRAVESSIA · SALA ${state.round}`, TRANSITION_DURATION);
  }

  function finishTransition() {
    state.mode = state.transitionTo;
    state.phaseTime = 0;
    state.spawn = 1.4;
    state.crystalAt = 1;
    if (state.mode === "boss") {
      state.attackAt = 1.7;
      state.attackCount = 0;
      boss.hidden = false;
    }
  }

  function hurt(object) {
    object.dead = true;
    if (state.time < state.hurtUntil) return;
    state.lives--;
    state.hurtUntil = state.time + 1.4;
    if (state.lives <= 0) endGame();
  }

  function intersects(a, b) {
    return (
      a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y
    );
  }
  function heroBox() {
    return {
      x: heroX + heroSize * 0.28,
      y: state.y + 4,
      w: heroSize * 0.4,
      h: heroSize * 0.67,
    };
  }

  function updateRun(dt) {
    const speed = LEVELS[levelIndex()].speed;
    // At least three seconds without new rocks before the encounter.
    if (state.phaseTime < RUN_DURATION - 3) {
      state.spawn -= dt;
      if (state.spawn <= 0) {
        const size = Math.max(60, Math.min(96, width * 0.105));
        makeSprite("rock", size, width + size, 0);
        state.spawn = 1.65 / speed + Math.random() * 0.45;
      }
      state.crystalAt -= dt;
      if (state.crystalAt <= 0) {
        const el = document.createElement("span");
        el.className = "crystal";
        world.append(el);
        objects.push({
          kind: "crystal",
          el,
          x: width + 25,
          y: heroSize * 0.9 + 20,
          size: 23,
          dead: false,
        });
        state.crystalAt = 2.3 + Math.random() * 0.8;
      }
    }
    if (
      state.phaseTime >= RUN_DURATION - 3 &&
      state.phaseTime - dt < RUN_DURATION - 3
    ) {
      showNotice("O BOSS SE APROXIMA", 3);
    }
    if (state.phaseTime >= RUN_DURATION) {
      beginTransition("boss");
      return;
    }
    for (const o of objects) {
      o.x -= Math.max(145, width * 0.31) * speed * dt;
      if (o.kind === "rock") {
        const box = {
          x: o.x + o.size * 0.15,
          y: 0,
          w: o.size * 0.7,
          h: o.size * 0.46,
        };
        if (intersects(heroBox(), box)) hurt(o);
      } else if (
        o.kind === "crystal" &&
        intersects(heroBox(), { x: o.x, y: o.y, w: 19, h: 25 })
      ) {
        state.score += 30;
        state.crystals++;
        o.dead = true;
        audio?.tocar("coleta");
      }
      if (o.x < -o.size) o.dead = true;
      if (state.status !== "playing") break;
    }
  }

  function updateBoss(dt) {
    if (!state.pendingAttack && state.phaseTime >= state.attackAt) {
      state.pendingAttack = {
        release: state.phaseTime + 0.85,
        high: state.attackCount % 3 === 2,
      };
      boss.classList.add("charging");
    }
    if (state.pendingAttack && state.phaseTime >= state.pendingAttack.release) {
      const high = state.pendingAttack.high;
      const size = Math.max(44, Math.min(66, width * 0.07));
      const shot = makeSprite(
        "poison projectile",
        size,
        bossX + bossSize * 0.2,
        high ? heroSize * 0.84 : 2,
      );
      shot.high = high;
      state.pendingAttack = null;
      state.attackCount++;
      state.attackAt =
        state.phaseTime + Math.max(1.3, 2.05 - state.round * 0.08);
      boss.classList.remove("charging");
    }
    for (const o of objects) {
      o.x -= Math.max(145, width * 0.3) * dt;
      const hit = {
        x: o.x + o.size * 0.12,
        y: o.y + o.size * 0.05,
        w: o.size * 0.46,
        h: o.size * 0.34,
      };
      if (intersects(heroBox(), hit)) hurt(o);
      if (o.x < -o.size) o.dead = true;
      if (state.status !== "playing") return;
    }
    if (state.phaseTime >= BOSS_DURATION) {
      state.score += 300;
      state.bosses++;
      state.round++;
      audio?.tocar("coleta");
      beginTransition("run");
      return;
    }
    const threat = objects
      .filter((o) => !o.dead && o.x + o.size > heroBox().x)
      .sort((a, b) => a.x - b.x)[0];
    const attack = threat || state.pendingAttack;
    $("lane-warning").hidden = !attack;
    if (attack)
      $("lane-warning").style.bottom =
        `${GROUND + (attack.high ? heroSize * 0.84 : 0)}px`;
  }

  function levelIndex() {
    return state.elapsed >= 45 ? 2 : state.elapsed >= 20 ? 1 : 0;
  }

  function update(dt) {
    state.time += dt;
    if (state.mode !== "transition") {
      state.elapsed += dt;
      state.score += dt * 10;
    }
    state.phaseTime += dt;
    if (state.y > 0 || state.vy > 0) {
      state.vy -= 1100 * dt;
      state.y = Math.max(0, state.y + state.vy * dt);
      if (!state.y) state.vy = 0;
    }
    if (state.mode === "run") updateRun(dt);
    else if (state.mode === "boss") updateBoss(dt);
    else if (state.phaseTime >= TRANSITION_DURATION) finishTransition();
    objects = objects.filter((o) => {
      if (o.dead) o.el.remove();
      return !o.dead;
    });
    if (state.time >= noticeUntil) $("notice").hidden = true;
    updateHud();
  }

  function updateHud() {
    const index = levelIndex();
    $("hud-level").textContent = `${index + 1} · ${LEVELS[index].name}`;
    $("hud-score").textContent = Math.floor(state.score)
      .toString()
      .padStart(5, "0");
    $("hud-lives").textContent =
      "◆ ".repeat(Math.max(0, state.lives)) +
      "◇ ".repeat(3 - Math.max(0, state.lives));
    $("hud-lives").setAttribute("aria-label", `${state.lives} vidas`);
  }

  function render() {
    const time = state?.time || 0;
    const frame = motion.matches
      ? 0
      : Math.floor(time / 0.13) % sprites.hero.frames.length;
    paintSprite(hero, "hero", heroSize, frame);
    position(hero, heroX, state?.y || 0);
    hero.classList.toggle(
      "hurt",
      !!state && time < state.hurtUntil && Math.floor(time * 8) % 2 === 0,
    );
    position(boss, bossX, motion.matches ? 0 : Math.sin(time * 3) * 3 + 3);
    objects.forEach((o) => {
      if (o.kind === "crystal") {
        o.el.style.left = `${o.x}px`;
        o.el.style.bottom = `${GROUND + o.y}px`;
      } else position(o.el, o.x, o.y);
    });
  }

  function pause() {
    if (state?.status !== "playing") return;
    state.status = "paused";
    $("pause-screen").hidden = false;
    audio?.pararEfeitos();
    scenePlayback();
    $("resume-button").focus();
  }
  function resume() {
    if (state?.status !== "paused" || document.hidden) return;
    state.status = "playing";
    previous = performance.now();
    $("pause-screen").hidden = true;
    updateHud();
    scenePlayback();
  }

  async function endGame() {
    state.status = "over";
    audio?.pararEfeitos();
    audio?.tocar("gameover");
    scenePlayback();
    $("over-screen").hidden = false;
    $("pause-button").disabled = true;
    $("final-score").textContent = Math.floor(state.score);
    $("final-detail").textContent =
      `${state.crystals} cristais · ${state.bosses} confrontos superados · Sala ${state.round}`;
    $("save-status").textContent = "Registrando pontuação…";
    const version = ++requestVersion;
    try {
      const res = await fetch("php/salvar-ranking.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: state.name,
          pontos: Math.floor(state.score),
        }),
      });
      const data = await res.json();
      if (version !== requestVersion) return;
      if (!res.ok || data.status !== "success") throw Error("save");
      $("save-status").textContent = "Pontuação registrada!";
      renderRanking(data.ranking || []);
    } catch (_) {
      if (version === requestVersion)
        $("save-status").textContent =
          "Não foi possível salvar. Confira a conexão com o banco.";
    }
  }

  function renderRanking(items) {
    $("ranking-list").replaceChildren();
    $("ranking-status").textContent = items.length
      ? "As melhores jornadas da masmorra."
      : "Seja o primeiro a registrar uma jornada.";
    items.forEach((item) => {
      const li = document.createElement("li");
      const name = document.createElement("span");
      name.textContent = item.nome;
      const points = document.createElement("b");
      points.textContent = `${Number(item.pontos)} pts`;
      li.append(name, points);
      $("ranking-list").append(li);
    });
  }
  async function loadRanking() {
    $("ranking-status").textContent = "Consultando ranking…";
    try {
      const res = await fetch("php/obter-ranking.php");
      const data = await res.json();
      if (!res.ok || data.status !== "success") throw Error("ranking");
      renderRanking(data.ranking || []);
    } catch (_) {
      $("ranking-status").textContent =
        "Ranking indisponível. Você pode jogar normalmente.";
    }
  }

  $("start-form").addEventListener("submit", (e) => {
    e.preventDefault();
    start();
  });
  $("restart-button").addEventListener("click", start);
  $("menu-button").addEventListener("click", () => {
    requestVersion++;
    clearObjects();
    state = null;
    boss.hidden = true;
    $("notice").hidden = true;
    $("lane-warning").hidden = true;
    $("over-screen").hidden = true;
    $("menu-screen").hidden = false;
    world.hidden = true;
    audio?.pararEfeitos();
    render();
  });
  $("pause-button").addEventListener("click", pause);
  $("resume-button").addEventListener("click", resume);
  $("ranking-details").addEventListener("toggle", () => {
    if ($("ranking-details").open) loadRanking();
  });
  board.addEventListener("pointerdown", (e) => {
    if (!e.target.closest("button,input,a,form,.screen")) jump();
  });
  document.addEventListener("keydown", (e) => {
    if (
      e.target.closest("input,textarea,select,button,a") ||
      e.ctrlKey ||
      e.altKey ||
      e.metaKey
    )
      return;
    if (e.code === "Escape" || e.code === "KeyP") {
      if (state?.status === "paused") resume();
      else pause();
    } else if (
      ["Space", "ArrowUp"].includes(e.code) &&
      state?.status === "playing"
    ) {
      e.preventDefault();
      if (e.repeat) return;
      jump();
    }
  });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) pause();
    scenePlayback();
  });
  window.addEventListener("pagehide", pause);
  motion.addEventListener("change", scenePlayback);
  new ResizeObserver(resize).observe(board);
  resize();
  Promise.all(
    [sprites.hero.image, sprites.world.image].map(
      (src) =>
        new Promise((resolve, reject) => {
          const image = new Image();
          image.onload = resolve;
          image.onerror = reject;
          image.src = src;
        }),
    ),
  )
    .then(() => {
      ready = true;
      $("start-button").disabled = false;
      $("start-button").textContent = "Entrar →";
    })
    .catch(() => {
      $("asset-status").textContent =
        "Não foi possível carregar os sprites. Atualize a página para tentar novamente.";
    });
  function loop(now) {
    const dt = Math.min(0.032, Math.max(0, (now - previous) / 1000));
    previous = now;
    if (state?.status === "playing") {
      update(dt);
      render();
    }
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
