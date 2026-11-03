/** Arcane Run: one animation clock controls movement, battles, score and pauses. */
(() => {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const atlas = JSON.parse($("sprite-data").textContent);
  const audio = window.ArcaneAudio;
  const board = $("game-board");
  const world = $("world");
  const hero = $("hero");
  const boss = $("boss");
  const video = $("scene-video");
  const motion = matchMedia("(prefers-reduced-motion: reduce)");
  const RUN_DURATION = 24;
  const TRANSITION_DURATION = 2.4;
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

  function paintSprite(node, index, size) {
    const f = atlas.frames[index];
    const scale = size / atlas.cell;
    const art = node.querySelector(".sprite-art");
    node.style.width = `${size}px`;
    node.style.height = `${size}px`;
    art.style.width = `${f.w * scale}px`;
    art.style.height = `${f.h * scale}px`;
    art.style.backgroundSize = `${atlas.width * scale}px ${atlas.height * scale}px`;
    art.style.backgroundPosition = `${-f.x * scale}px ${-f.y * scale}px`;
  }

  function position(node, x, y) {
    node.style.transform = `translate3d(${x}px,${-(GROUND + y)}px,0)`;
  }

  function resize() {
    const oldWidth = width;
    width = board.clientWidth;
    heroSize = Math.max(112, Math.min(170, width * 0.18));
    bossSize = Math.max(130, Math.min(235, width * 0.25));
    heroX = width * 0.045;
    bossX = width - bossSize - width * 0.025;
    objects.forEach((o) => {
      o.x *= width / oldWidth;
    });
    paintSprite(hero, 0, heroSize);
    paintSprite(boss, 9, bossSize);
    render();
  }

  function makeSprite(kind, index, size, x, y) {
    const el = document.createElement("div");
    el.className = `actor ${kind}`;
    const art = document.createElement("span");
    art.className = "sprite-art";
    el.append(art);
    world.append(el);
    paintSprite(el, index, size);
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
      castUntil: 0,
      castReady: 0,
      spellPending: false,
      castRelease: 0,
      bossHP: 12,
      bossMax: 12,
      attackAt: 1.8,
      attackCount: 0,
      pendingAttack: null,
      bossHitUntil: 0,
      transitionTo: null,
    };
    $("hud-player").textContent = name;
    $("menu-screen").hidden = true;
    world.hidden = false;
    $("over-screen").hidden = true;
    $("pause-screen").hidden = true;
    $("boss-hud").hidden = true;
    $("attack-cue").hidden = true;
    $("lane-warning").hidden = true;
    boss.hidden = true;
    hero.classList.remove("hurt");
    $("pause-button").disabled = false;
    $("jump-button").disabled = false;
    previous = performance.now();
    showNotice("Sala 1 · A travessia começa", 2.4);
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

  function cast() {
    if (
      state?.status !== "playing" ||
      state.mode !== "boss" ||
      state.time < state.castReady
    )
      return;
    state.castReady = state.time + 0.8;
    state.castUntil = state.time + 0.4;
    state.castRelease = state.time + 0.12;
    state.spellPending = true;
  }

  function beginTransition(target) {
    state.mode = "transition";
    state.phaseTime = 0;
    state.transitionTo = target;
    state.pendingAttack = null;
    state.spellPending = false;
    state.y = 0;
    state.vy = 0;
    clearObjects();
    boss.classList.remove("charging");
    $("attack-cue").hidden = true;
    $("lane-warning").hidden = true;
    $("boss-hud").hidden = true;
    boss.hidden = true;
    if (target === "boss")
      showNotice("BOSS À FRENTE · Prepare seus feitiços!", TRANSITION_DURATION);
    else
      showNotice(
        `BOSS DERROTADO! +300 · Sala ${state.round} a seguir`,
        TRANSITION_DURATION,
      );
  }

  function finishTransition() {
    state.mode = state.transitionTo;
    state.phaseTime = 0;
    state.spawn = 1.4;
    state.crystalAt = 1;
    if (state.mode === "boss") {
      state.bossMax = Math.min(20, 12 + (state.round - 1) * 2);
      state.bossHP = state.bossMax;
      state.attackAt = 1.7;
      state.attackCount = 0;
      state.castReady = state.time;
      boss.hidden = false;
      $("boss-hud").hidden = false;
      showNotice("REI DO LODO · J ou X para atacar", 2.5);
    } else showNotice(`Sala ${state.round} · De volta aos obstáculos`, 2.5);
  }

  function hurt(object) {
    object.dead = true;
    if (state.time < state.hurtUntil) return;
    state.lives--;
    state.hurtUntil = state.time + 1.4;
    if (state.lives <= 0) endGame();
    else showNotice("Você foi atingido · Proteção por um instante", 1.3);
  }

  function intersects(a, b) {
    return (
      a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y
    );
  }
  function heroBox() {
    return {
      x: heroX + heroSize * 0.24,
      y: state.y + 4,
      w: heroSize * 0.39,
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
        makeSprite("rock", 8, size, width + size, 0);
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
      showNotice("O boss se aproxima · Troca em 3 segundos", 3);
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
      const high = state.attackCount % 3 === 2;
      state.pendingAttack = { release: state.phaseTime + 0.85, high };
      boss.classList.add("charging");
      $("attack-cue").textContent = high
        ? "ATAQUE ALTO · Fique no chão!"
        : "ATAQUE BAIXO · Prepare-se para pular!";
      $("attack-cue").hidden = false;
      $("lane-warning").hidden = false;
      $("lane-warning").style.bottom =
        `${GROUND + (high ? heroSize * 0.84 : 0)}px`;
    }
    if (state.pendingAttack && state.phaseTime >= state.pendingAttack.release) {
      const high = state.pendingAttack.high;
      const size = Math.max(44, Math.min(66, width * 0.07));
      const shot = makeSprite(
        "poison projectile",
        10,
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
    if (state.spellPending && state.time >= state.castRelease) {
      makeSprite(
        "spell projectile",
        11,
        Math.max(49, heroSize * 0.48),
        heroX + heroSize * 0.72,
        state.y + heroSize * 0.34,
      );
      state.spellPending = false;
    }
    const body = {
      x: bossX + bossSize * 0.2,
      y: 0,
      w: bossSize * 0.64,
      h: bossSize * 0.72,
    };
    for (const o of objects) {
      if (o.kind.startsWith("poison")) {
        o.x -= Math.max(105, width * 0.3) * dt;
        const hit = {
          x: o.x + o.size * 0.12,
          y: o.y + o.size * 0.05,
          w: o.size * 0.46,
          h: o.size * 0.34,
        };
        if (intersects(heroBox(), hit)) hurt(o);
      } else {
        o.x += Math.max(270, width * 0.75) * dt;
        if (
          intersects(body, {
            x: o.x,
            y: o.y,
            w: o.size * 0.72,
            h: o.size * 0.63,
          })
        ) {
          o.dead = true;
          state.bossHP--;
          state.bossHitUntil = state.time + 0.15;
          if (state.bossHP <= 0) {
            state.score += 300;
            state.bosses++;
            state.round++;
            audio?.tocar("coleta");
            beginTransition("run");
            return;
          }
        }
      }
      if (o.x < -o.size || o.x > width + o.size) o.dead = true;
      if (state.status !== "playing") break;
    }
    const threat = objects
      .filter(
        (o) =>
          o.kind.startsWith("poison") && !o.dead && o.x + o.size > heroBox().x,
      )
      .sort((a, b) => a.x - b.x)[0];
    const attack = threat || state.pendingAttack;
    $("attack-cue").hidden = !attack;
    $("lane-warning").hidden = !attack;
    if (attack) {
      const near =
        threat &&
        (threat.x - (heroBox().x + heroBox().w)) / Math.max(105, width * 0.3) <
          0.48;
      $("attack-cue").textContent = attack.high
        ? "ATAQUE ALTO · Fique no chão!"
        : near
          ? "ATAQUE BAIXO · Pule agora!"
          : "ATAQUE BAIXO · Prepare-se para pular!";
      $("lane-warning").style.bottom =
        `${GROUND + (attack.high ? heroSize * 0.84 : 0)}px`;
    }
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
    $("hud-phase").textContent =
      state.mode === "boss"
        ? "Boss"
        : state.mode === "transition"
          ? "Transição"
          : "Travessia";
    $("hud-level").textContent = `${index + 1} · ${LEVELS[index].name}`;
    $("hud-score").textContent = Math.floor(state.score)
      .toString()
      .padStart(5, "0");
    $("hud-lives").textContent =
      "◆ ".repeat(Math.max(0, state.lives)) +
      "◇ ".repeat(3 - Math.max(0, state.lives));
    $("hud-lives").setAttribute("aria-label", `${state.lives} vidas`);
    $("boss-health").max = state.bossMax;
    $("boss-health").value = state.bossHP;
    $("boss-health-text").textContent =
      `${Math.max(0, state.bossHP)}/${state.bossMax}`;
    $("spell-button").disabled =
      state.status !== "playing" ||
      state.mode !== "boss" ||
      state.time < state.castReady;
    $("jump-button").disabled =
      state.status !== "playing" || state.mode === "transition";
    $("phase-tip").textContent =
      state.mode === "boss"
        ? "Pule o veneno baixo. Fique no chão contra o alto. Use J / X para atacar."
        : state.mode === "transition"
          ? "Prepare-se: a próxima etapa começa em instantes."
          : "Desvie das pedras e colete cristais. Cada cristal vale 30 pontos.";
  }

  function render() {
    const time = state?.time || 0;
    let frame = motion.matches ? 0 : Math.floor(time / 0.13) % 6;
    if (state && time < state.castUntil)
      frame = time < state.castRelease ? 6 : 7;
    paintSprite(hero, frame, heroSize);
    position(hero, heroX, state?.y || 0);
    hero.classList.toggle(
      "hurt",
      !!state && time < state.hurtUntil && Math.floor(time * 8) % 2 === 0,
    );
    position(boss, bossX, motion.matches ? 0 : Math.sin(time * 3) * 3 + 3);
    boss.classList.toggle("hit", !!state && time < state.bossHitUntil);
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
    $("spell-button").disabled = true;
    $("jump-button").disabled = true;
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
    $("spell-button").disabled = true;
    $("jump-button").disabled = true;
    $("final-score").textContent = Math.floor(state.score);
    $("final-detail").textContent =
      `${state.crystals} cristais · ${state.bosses} bosses derrotados · Sala ${state.round}`;
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
    $("boss-hud").hidden = true;
    $("notice").hidden = true;
    $("attack-cue").hidden = true;
    $("lane-warning").hidden = true;
    $("over-screen").hidden = true;
    $("menu-screen").hidden = false;
    world.hidden = true;
    audio?.pararEfeitos();
    render();
  });
  $("jump-button").addEventListener("pointerdown", (e) => {
    e.preventDefault();
    jump();
  });
  $("spell-button").addEventListener("pointerdown", (e) => {
    e.preventDefault();
    cast();
  });
  // Keyboard-generated click keeps the mobile controls accessible.
  $("jump-button").addEventListener("click", (e) => {
    if (e.detail === 0) jump();
  });
  $("spell-button").addEventListener("click", (e) => {
    if (e.detail === 0) cast();
  });
  $("pause-button").addEventListener("click", pause);
  $("resume-button").addEventListener("click", resume);
  $("ranking-refresh").addEventListener("click", loadRanking);
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
      ["Space", "ArrowUp", "KeyJ", "KeyX"].includes(e.code) &&
      state?.status === "playing"
    ) {
      e.preventDefault();
      if (e.repeat) return;
      if (e.code === "Space" || e.code === "ArrowUp") jump();
      else cast();
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
  const image = new Image();
  image.onload = () => {
    ready = true;
    $("start-button").disabled = false;
    $("start-button").textContent = "Entrar →";
  };
  image.onerror = () => {
    $("asset-status").textContent =
      "Não foi possível carregar os sprites. Atualize a página para tentar novamente.";
  };
  image.src = "assets/sprites/arcane-atlas.png";
  loadRanking();
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
