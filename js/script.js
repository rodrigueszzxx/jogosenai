/** Beyond Jump: one animation clock controls movement, battles, score and pauses. */
(() => {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const sprites = JSON.parse($("sprite-data").textContent);
  const collectibleSprites = JSON.parse($("collectible-sprites").textContent);
  const audio = window.BeyondJumpAudio;
  const PIKACHU_IMAGE = "assets/characters/pikachu.gif";
  const SONIC_IMAGE = "assets/characters/sonic.gif";
  const CHARACTERS = {
    wizard: {
      name: "Mago",
      theme: "dungeon",
      obstacle: "rock",
      collectible: "gem",
      sprite: "hero",
      scale: 1,
    },
    pikachu: {
      name: "Pikachu",
      theme: "pokemon",
      obstacle: "pokeball",
      collectible: "candy",
    },
    sonic: {
      name: "Sonic",
      theme: "forest",
      obstacle: "spike",
      collectible: "ring",
    },
    shadow: {
      name: "Shadow",
      theme: "forest",
      obstacle: "spike",
      collectible: "ring",
      sprite: "shadow",
      scale: 0.92,
    },
    ...Object.fromEntries(
      ["thamires", "pedro", "guedes", "amanda"].map((id) => [
        id,
        {
          name: id[0].toUpperCase() + id.slice(1),
          theme: "dungeon",
          obstacle: "rock",
          collectible: "ring",
          sprite: id,
          scale: 0.94,
          secret: true,
        },
      ]),
    ),
  };
  const RAICHU_IMAGES = [1, 2, 3].map(
    (n) => `assets/characters/raichu/corrida-0${n}.png`,
  );
  const RAICHU_SEQUENCE = [0, 1, 2, 1];
  const EVOLUTION_SCORE = 1500;
  const EVOLUTION_DURATION = 1.2;
  const heroImage = $("hero-image");
  const heroFreeze = $("hero-freeze");
  const evolutionOverlay = $("raios-evolucao");
  const evolutionFrames = [...evolutionOverlay.querySelectorAll("img")];
  const preloadedImages = new Map();
  let frozenImageKey = "";
  let rankingRequest = 0;
  const board = $("game-board");
  const world = $("world");
  const hero = $("hero");
  const boss = $("boss");
  const video = $("scene-video");
  const panorama = $("scene-panorama");
  const motion = matchMedia("(prefers-reduced-motion: reduce)");
  const RUN_DURATION = 24;
  const TRANSITION_DURATION = 2.4;
  const BOSS_DURATION = 20;
  const GROUND = 43;
  const JUMP_HEIGHT = 110;
  const RISE_GRAVITY = 2600;
  const FALL_GRAVITY = 3900;
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
  let previewTime = 0;

  function paintSelection(dt = 0) {
    if (document.hidden || $("start-modal").hidden) return;
    previewTime += dt;
    const size = matchMedia("(max-width: 600px)").matches ? 100 : 110;
    for (const [id, kind] of [
      ["mage-preview", "hero"],
      ["shadow-preview", "shadow"],
      ...Object.entries(CHARACTERS)
        .filter(([, c]) => c.secret)
        .map(([id]) => [`${id}-preview`, id]),
    ]) {
      if ($(id).closest("[hidden]")) continue;
      const sheet = sprites[kind];
      const sequence = sheet.runSequence;
      const frame =
        sequence[
          Math.floor((previewTime * 1000) / sheet.frameMs) % sequence.length
        ];
      paintSprite($(id), kind, size, frame);
    }
  }

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
  $("player-input").value =
    readStorage("mario_final_player") || readStorage("hero_jump_player");
  const hasSecretName = () =>
    $("player-input").value.trim().toUpperCase() === "SENAI";
  function syncSecretCharacters() {
    const unlocked = hasSecretName();
    document.querySelectorAll("[data-secret-character]").forEach((card) => {
      card.hidden = !unlocked;
      const input = card.querySelector("input");
      input.disabled = !unlocked;
      if (!unlocked && input.checked) {
        document.querySelector('input[value="wizard"]').checked = true;
        saveStorage("mario_final_character", "wizard");
      }
    });
    $("secret-unlock-status").hidden = !unlocked;
    paintSelection();
  }
  syncSecretCharacters();
  $("player-input").addEventListener("input", syncSecretCharacters);
  $("player-input").addEventListener("change", syncSecretCharacters);
  const savedCharacter = readStorage("mario_final_character");
  const canSelect = (id) =>
    Object.hasOwn(CHARACTERS, id) &&
    (!CHARACTERS[id].secret || hasSecretName());
  const savedRadio = document.querySelector(
    `input[name="character"][value="${canSelect(savedCharacter) ? savedCharacter : "wizard"}"]`,
  );
  savedRadio.checked = true;
  document
    .querySelectorAll('input[name="character"]')
    .forEach((input) =>
      input.addEventListener("change", () =>
        saveStorage("mario_final_character", input.value),
      ),
    );

  function paintSprite(node, kind, size, frame = 0) {
    if (kind === "rock" && state) kind = CHARACTERS[state.character].obstacle;
    const sheet =
      kind === "hero" ? sprites.hero : sprites[kind] || sprites.world;
    const f = Array.isArray(sheet.frames)
      ? sheet.frames[frame]
      : sheet.frames[kind];
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
      Math.min(148, Math.max(104, width * 0.16), board.clientHeight * 0.32),
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
    paintSprite(boss, "boss", bossSize);
    render();
  }

  function paintHero() {
    const time = state?.time || 0;
    const art = hero.querySelector(".sprite-art");
    if (!state || CHARACTERS[state.character].sprite) {
      art.hidden = false;
      heroImage.hidden = true;
      heroFreeze.hidden = true;
      hero.classList.remove("is-evolved");
      const kind = state ? CHARACTERS[state.character].sprite : "hero";
      const sheet = sprites[kind];
      const sequence = sheet.runSequence;
      const frame = state
        ? sequence[Math.floor((time * 1000) / sheet.frameMs) % sequence.length]
        : 0;
      paintSprite(
        hero,
        kind,
        heroSize * (state ? CHARACTERS[state.character].scale : 1),
        frame,
      );
      return;
    }
    art.hidden = true;
    hero.style.width = `${heroSize}px`;
    hero.style.height = `${heroSize}px`;
    hero.classList.toggle("is-evolved", state.evolved);
    const src = state.evolved
      ? RAICHU_IMAGES[
          RAICHU_SEQUENCE[
            Math.floor((time - state.raichuStartedAt) / 0.1) %
              RAICHU_SEQUENCE.length
          ]
        ]
      : state.character === "sonic"
        ? SONIC_IMAGE
        : PIKACHU_IMAGE;
    if (heroImage.getAttribute("src") !== src) heroImage.src = src;
    heroImage.alt = state.evolved ? "Raichu" : CHARACTERS[state.character].name;
    const image = preloadedImages.get(src);
    if (!image) return;
    const height = Math.min(
      heroSize * (state.evolved ? 1.15 : 0.88),
      board.clientHeight - GROUND - 98,
    );
    const drawWidth = (height * image.naturalWidth) / image.naturalHeight;
    for (const node of [heroImage, heroFreeze]) {
      node.style.height = `${height}px`;
      node.style.width = `${drawWidth}px`;
    }
    const freeze = state.status !== "playing";
    heroImage.hidden = freeze;
    heroFreeze.hidden = !freeze;
    if (!freeze) frozenImageKey = "";
    else if (frozenImageKey !== src) {
      heroFreeze.width = image.naturalWidth;
      heroFreeze.height = image.naturalHeight;
      heroFreeze
        .getContext("2d")
        .drawImage(
          heroImage.complete && heroImage.naturalWidth ? heroImage : image,
          0,
          0,
        );
      frozenImageKey = src;
    }
  }

  function makeCollectible(special = false) {
    const size = special
      ? Math.max(54, Math.min(72, heroSize * 0.52))
      : Math.max(40, Math.min(56, heroSize * 0.4));
    const collectible = CHARACTERS[state.character].collectible;
    if (!special && ["gem", "ring"].includes(collectible))
      return makeSprite(collectible, size, width + size, heroSize * 0.9 + 20);
    const el = document.createElement("span");
    const kind = special ? "stone" : "candy";
    el.className = `actor collectible ${kind}`;
    el.style.width = `${size}px`;
    el.style.height = `${size}px`;
    const visual = document.createElement("span");
    visual.className = "collectible-visual";
    el.append(visual);
    world.append(el);
    const object = {
      kind,
      el,
      visual,
      size,
      x: width + size,
      y: heroSize * 0.9 + 20,
      dead: false,
      frame: -1,
    };
    objects.push(object);
    paintCollectible(object);
    position(el, object.x, object.y);
    return object;
  }

  function paintCollectible(object) {
    if (!object.visual) return;
    const sheet =
      collectibleSprites[object.kind === "stone" ? "thunderstone" : "pikachu"];
    const index =
      Math.floor((state?.time || 0) * sheet.fps) % sheet.frames.length;
    if (object.frame === index) return;
    const frame = sheet.frames[index];
    const scale = object.size / sheet.maxHeight;
    const visual = object.visual;
    visual.style.width = `${frame.w * scale}px`;
    visual.style.height = `${frame.h * scale}px`;
    visual.style.left = "50%";
    visual.style.transform = "translateX(-50%)";
    visual.style.backgroundImage = `url('${sheet.image}')`;
    visual.style.backgroundSize = `${sheet.width * scale}px ${sheet.height * scale}px`;
    visual.style.backgroundPosition = `${-frame.x * scale}px ${-frame.y * scale}px`;
    visual.style.clipPath = frame.clip;
    object.frame = index;
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
    if (
      state?.status === "playing" &&
      CHARACTERS[state.character].theme === "dungeon" &&
      !document.hidden
    ) {
      video.muted = true;
      video.playbackRate = 1;
      if (video.paused)
        video.play().catch((error) => {
          console.warn("Não foi possível iniciar o vídeo do cenário:", error);
        });
    } else video.pause();
  }

  function start() {
    if (!ready) return;
    const name = $("player-input").value.trim();
    if (!name) {
      $("player-input").focus();
      return;
    }
    syncSecretCharacters();
    requestVersion++;
    saveStorage("mario_final_player", name);
    clearObjects();
    audio?.pararEfeitos();
    state = {
      status: "playing",
      mode: "run",
      name,
      character: document.querySelector('input[name="character"]:checked')
        .value,
      evolved: false,
      raichuStartedAt: 0,
      stoneUnlocked: false,
      stoneAt: 0,
      evolution: null,
      resumeStatus: "playing",
      score: 0,
      sceneryOffset: 0,
      time: 0,
      elapsed: 0,
      phaseTime: 0,
      round: 1,
      lives: 3,
      bosses: 0,
      y: 0,
      vy: 0,
      hurtUntil: 0,
      spawn: 1.2,
      crystalAt: 1,
      attackAt: 1.8,
      attackCount: 0,
      pendingAttack: null,
      transitionTo: null,
    };
    saveStorage("mario_final_character", state.character);
    const theme = CHARACTERS[state.character].theme;
    board.dataset.theme = theme;
    video.hidden = theme !== "dungeon";
    panorama.hidden = theme === "dungeon";
    panorama.style.setProperty(
      "--scene-image",
      theme === "dungeon"
        ? "none"
        : `url('${new URL(`assets/scenes/${theme === "pokemon" ? "pokemon" : "forest"}.jpg`, document.baseURI).href}')`,
    );
    clearEvolution();
    setScreen(null);
    frozenImageKey = "";
    $("hud-player").textContent = name;
    world.hidden = false;
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
    // A short arc with stronger falling gravity, rather than a long float.
    // Reserve room for Raichu too, keeping the same jump for every hero.
    const headroom = board.clientHeight - GROUND - heroSize * 1.15 - 12;
    const height = Math.max(52, Math.min(JUMP_HEIGHT, headroom));
    state.vy = Math.sqrt(2 * RISE_GRAVITY * height);
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
    state.spawn = 1.2;
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
    const speed = speedMultiplier();
    // At least three seconds without new rocks before the encounter.
    if (state.phaseTime < RUN_DURATION - 3) {
      state.spawn -= dt;
      if (state.spawn <= 0) {
        const size =
          CHARACTERS[state.character].obstacle === "rock"
            ? Math.max(60, Math.min(96, width * 0.105))
            : Math.max(44, Math.min(70, heroSize * 0.48));
        makeSprite("rock", size, width + size, 0);
        state.spawn = Math.max(0.9, 1.35 / speed) + Math.random() * 0.3;
      }
      state.crystalAt -= dt;
      if (state.crystalAt <= 0) {
        if (!state.stoneUnlocked) makeCollectible();
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
      if (o.kind !== "rock") continue;
      o.x -= worldSpeed() * dt;
      const box = {
        x: o.x + o.size * 0.15,
        y: 0,
        w: o.size * 0.7,
        h:
          o.size *
          (CHARACTERS[state.character].obstacle === "rock" ? 0.46 : 0.65),
      };
      if (intersects(heroBox(), box)) hurt(o);
      if (o.x < -o.size) o.dead = true;
      if (state.status !== "playing") return;
    }
  }

  function updateCollectibles(dt) {
    if (state.mode === "transition") return;
    if (
      state.character === "pikachu" &&
      !state.evolved &&
      !state.stoneUnlocked &&
      state.score >= EVOLUTION_SCORE
    ) {
      state.stoneUnlocked = true;
      state.stoneAt = 0;
      objects.forEach((o) => {
        if (["gem", "candy", "ring"].includes(o.kind)) o.dead = true;
      });
    }
    if (
      state.stoneUnlocked &&
      !objects.some((o) => o.kind === "stone" && !o.dead)
    ) {
      state.stoneAt -= dt;
      if (state.stoneAt <= 0) makeCollectible(true);
    }
    for (const o of objects) {
      if (o.dead || !["gem", "candy", "ring", "stone"].includes(o.kind))
        continue;
      o.x -= worldSpeed() * dt;
      if (
        intersects(heroBox(), {
          x: o.x + o.size * 0.15,
          y: o.y + o.size * 0.08,
          w: o.size * 0.7,
          h: o.size * 0.84,
        })
      ) {
        state.score += 30;
        o.dead = true;
        audio?.tocar("coleta");
        if (o.kind === "stone") {
          startEvolution();
          return;
        }
      } else if (o.x < -o.size) {
        o.dead = true;
        if (o.kind === "stone") state.stoneAt = 0.8;
      }
    }
  }

  function clearEvolution() {
    evolutionOverlay.hidden = true;
    evolutionFrames.forEach((frame) => (frame.hidden = true));
  }

  function startEvolution() {
    if (state.character !== "pikachu" || state.evolved) return;
    state.status = "evolving";
    state.evolution = { elapsed: 0 };
    state.stoneUnlocked = false;
    frozenImageKey = "";
    scenePlayback();
    audio?.tocar("evolucao");
    renderEvolution();
  }

  function renderEvolution() {
    if (!state?.evolution || state.status === "paused") {
      evolutionOverlay.hidden = true;
      return;
    }
    const elapsed = state.evolution.elapsed;
    const index = motion.matches ? 0 : Math.min(3, Math.floor(elapsed / 0.21));
    evolutionFrames.forEach((frame, i) => (frame.hidden = i !== index));
    evolutionOverlay.hidden = false;
    evolutionOverlay.style.opacity = String(
      Math.min(1, elapsed / 0.1, (EVOLUTION_DURATION - elapsed) / 0.24),
    );
  }

  function updateEvolution(dt) {
    state.evolution.elapsed += dt;
    if (!state.evolved && state.evolution.elapsed >= 0.6) {
      state.evolved = true;
      state.raichuStartedAt = state.time;
      frozenImageKey = "";
    }
    if (state.evolution.elapsed >= EVOLUTION_DURATION) {
      state.status = "playing";
      state.evolution = null;
      clearEvolution();
      scenePlayback();
    } else renderEvolution();
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
        high ? highAttackY() : 2,
      );
      shot.high = high;
      state.pendingAttack = null;
      state.attackCount++;
      state.attackAt =
        state.phaseTime + Math.max(1.3, 2.05 - state.round * 0.08);
      boss.classList.remove("charging");
    }
    for (const o of objects) {
      if (o.kind !== "poison projectile") continue;
      o.x -= projectileSpeed() * dt;
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
      .filter(
        (o) =>
          o.kind === "poison projectile" &&
          !o.dead &&
          o.x + o.size > heroBox().x,
      )
      .sort((a, b) => a.x - b.x)[0];
    const attack = threat || state.pendingAttack;
    $("lane-warning").hidden = !attack;
    if (attack)
      $("lane-warning").style.bottom =
        `${GROUND + (attack.high ? highAttackY() : 0)}px`;
  }

  function levelIndex() {
    let index = 0;
    LEVELS.forEach((level, i) => {
      if (state.elapsed >= level.start) index = i;
    });
    return index;
  }

  // A gentler start; acceleration is continuous and only counts active play.
  function speedMultiplier() {
    const index = levelIndex();
    const level = LEVELS[index];
    const next = LEVELS[index + 1] || { start: 120, speed: 1.6 };
    const progress = Math.min(
      1,
      Math.max(0, (state.elapsed - level.start) / (next.start - level.start)),
    );
    return level.speed + (next.speed - level.speed) * progress;
  }

  function worldSpeed() {
    return Math.max(280, (width + 120) * 0.6) * speedMultiplier();
  }

  function projectileSpeed() {
    return Math.max(185, width * 0.32) * speedMultiplier();
  }

  function highAttackY() {
    return heroSize * 0.84 + 25;
  }

  function updateJump(dt) {
    if (state.y <= 0 && state.vy <= 0) return;
    // Split the apex inside the frame so 30/60/120 Hz share the same arc.
    if (state.vy > 0) {
      const rising = Math.min(dt, state.vy / RISE_GRAVITY);
      state.y += state.vy * rising - 0.5 * RISE_GRAVITY * rising ** 2;
      state.vy = Math.max(0, state.vy - RISE_GRAVITY * rising);
      dt -= rising;
    }
    state.y += state.vy * dt - 0.5 * FALL_GRAVITY * dt ** 2;
    state.vy -= FALL_GRAVITY * dt;
    if (state.y <= 0) state.y = state.vy = 0;
  }

  function update(dt) {
    state.time += dt;
    if (state.mode !== "transition") {
      state.elapsed += dt;
      state.score += dt * 10;
      state.sceneryOffset =
        (state.sceneryOffset + 50 * speedMultiplier() * dt) % (width * 2);
    }
    state.phaseTime += dt;
    updateJump(dt);
    if (state.mode === "run") updateRun(dt);
    else if (state.mode === "boss") updateBoss(dt);
    else if (state.phaseTime >= TRANSITION_DURATION) finishTransition();
    if (state.status === "playing") updateCollectibles(dt);
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
    $("hud-level").dataset.level = String(index + 1);
    $("hud-score").textContent = Math.floor(state.score)
      .toString()
      .padStart(5, "0");
    const lives = Math.max(0, state.lives);
    const hearts = $("hud-lives");
    if (hearts.childElementCount !== lives) {
      hearts.replaceChildren(
        ...Array.from({ length: lives }, () => {
          const heart = document.createElement("span");
          heart.className = "life-heart";
          heart.setAttribute("aria-hidden", "true");
          return heart;
        }),
      );
    }
    hearts.setAttribute(
      "aria-label",
      `${lives} ${lives === 1 ? "vida" : "vidas"}`,
    );
  }

  function render() {
    const time = state?.time || 0;
    panorama.style.setProperty(
      "--scene-offset",
      `${-(state?.sceneryOffset || 0)}px`,
    );
    paintHero();
    position(hero, heroX, state?.y || 0);
    hero.classList.toggle(
      "hurt",
      !!state && time < state.hurtUntil && Math.floor(time * 8) % 2 === 0,
    );
    position(boss, bossX, motion.matches ? 0 : Math.sin(time * 3) * 3 + 3);
    objects.forEach((o) => {
      paintCollectible(o);
      position(o.el, o.x, o.y);
    });
    renderEvolution();
  }

  function pause() {
    if (!["playing", "evolving"].includes(state?.status)) return;
    state.resumeStatus = state.status;
    state.status = "paused";
    document.body.dataset.screen = "pause";
    $("pause-screen").hidden = false;
    audio?.pararEfeitos();
    scenePlayback();
    render();
    $("resume-button").focus();
  }
  function resume() {
    if (state?.status !== "paused" || document.hidden) return;
    state.status = state.resumeStatus;
    document.body.dataset.screen = "game";
    previous = performance.now();
    $("pause-screen").hidden = true;
    board.focus({ preventScroll: true });
    updateHud();
    render();
    scenePlayback();
  }

  async function endGame() {
    state.status = "over";
    audio?.pararEfeitos();
    audio?.tocar("gameover");
    scenePlayback();
    clearEvolution();
    setScreen("gameover-modal");
    render();
    $("pause-button").disabled = true;
    $("final-score-value").textContent = Math.floor(state.score);
    $("save-status-msg").textContent = "Registrando pontuação…";
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
      $("save-status-msg").textContent = "Pontuação registrada!";
      renderRanking(data.ranking || []);
    } catch (_) {
      if (version === requestVersion)
        $("save-status-msg").textContent =
          "Não foi possível salvar. Confira a conexão com o banco.";
    }
  }

  function renderRanking(items) {
    $("ranking-body").replaceChildren();
    $("ranking-status").textContent = "";
    const leader = items[0];
    const record = $("splash-record-text");
    record.replaceChildren();
    $("ranking-leader").hidden = !leader;
    if (leader) {
      const name = document.createElement("span");
      name.className = "record-player";
      name.textContent = leader.nome;
      const points = document.createElement("span");
      points.className = "record-points";
      points.textContent = `${Number(leader.pontos)} PTS`;
      record.append(name, points);
      $("ranking-leader-name").textContent = leader.nome;
      $("ranking-leader-score").textContent = points.textContent;
    } else record.textContent = "Seja o primeiro!";
    if (!items.length) {
      const row = document.createElement("tr");
      const cell = document.createElement("td");
      cell.colSpan = 3;
      cell.className = "loading-cell";
      cell.textContent =
        "Nenhuma pontuação gravada ainda. Jogue para ser o 1º!";
      row.append(cell);
      $("ranking-body").append(row);
      return;
    }
    let highlighted = false;
    items.forEach((item, index) => {
      const row = document.createElement("tr");
      if (index < 3) row.classList.add(`rank-${index + 1}`);
      const current =
        !highlighted &&
        state?.status === "over" &&
        item.nome === state.name &&
        Number(item.pontos) === Math.floor(state.score);
      if (current) {
        row.classList.add("highlight-current");
        highlighted = true;
      }
      const position = document.createElement("td");
      position.className = "ranking-pos";
      position.textContent =
        ["🥇 1º", "🥈 2º", "🥉 3º"][index] || `${index + 1}º`;
      const name = document.createElement("td");
      const strong = document.createElement("strong");
      strong.textContent = item.nome;
      name.append(strong);
      const points = document.createElement("td");
      points.textContent = `${Number(item.pontos)} pts`;
      row.append(position, name, points);
      $("ranking-body").append(row);
    });
  }

  async function loadRanking() {
    const version = ++rankingRequest;
    $("ranking-status").textContent = "Consultando ranking…";
    try {
      const res = await fetch("php/obter-ranking.php");
      const data = await res.json();
      if (version !== rankingRequest) return;
      if (!res.ok || data.status !== "success") throw Error("ranking");
      renderRanking(data.ranking || []);
      $("server-status").textContent = "Conectado ao banco do ranking";
    } catch (_) {
      if (version !== rankingRequest) return;
      $("ranking-status").textContent = "Ranking indisponível no momento.";
      $("splash-record-text").textContent = "Indisponível";
      $("server-status").textContent =
        "Banco indisponível. Você pode jogar normalmente.";
    }
  }

  const screens = [
    "splash-screen",
    "howto-modal",
    "start-modal",
    "gameover-modal",
  ];
  function setScreen(id) {
    screens.forEach((name) => ($(name).hidden = name !== id));
    document.body.dataset.screen = id || "game";
    if (id === "start-modal") syncSecretCharacters();
    board.tabIndex = id ? -1 : 0;
    if (id === "gameover-modal") {
      const result = state?.status === "over";
      document.querySelector(".final-score-box").hidden = !result;
      $("btn-restart").hidden = !result;
      $("gameover-title").textContent = result ? "GAME OVER" : "RANKING";
      $("ranking-description").textContent = result
        ? "Cada salto conta. Este foi o seu resultado."
        : "Os dez melhores resultados. O próximo pode ser seu.";
      $("btn-change-player").textContent = result
        ? "TROCAR JOGADOR"
        : "ESCOLHER PERSONAGEM";
      $("btn-change-player").classList.toggle("primary", !result);
      $("btn-change-player").classList.toggle("secondary", result);
    }
  }

  function resetForMenu() {
    requestVersion++;
    clearObjects();
    clearEvolution();
    state = null;
    world.hidden = true;
    boss.hidden = true;
    boss.classList.remove("charging");
    $("notice").hidden = true;
    $("lane-warning").hidden = true;
    $("pause-screen").hidden = true;
    $("pause-button").disabled = true;
    scenePlayback();
    audio?.pararEfeitos();
  }
  function openSelection() {
    resetForMenu();
    setScreen("start-modal");
    $("player-input").focus();
  }
  function openHome() {
    resetForMenu();
    setScreen("splash-screen");
    loadRanking();
    $("btn-splash-play").focus();
  }
  $("btn-splash-play").addEventListener("click", () => {
    setScreen("howto-modal");
    $("btn-howto-ok").focus();
  });
  $("btn-howto-ok").addEventListener("click", openSelection);
  $("btn-howto-ok").addEventListener("keydown", (e) => {
    if (e.repeat) e.preventDefault();
  });
  $("start-form").addEventListener("submit", (e) => {
    e.preventDefault();
    start();
  });
  $("btn-restart").addEventListener("click", start);
  $("btn-change-player").addEventListener("click", openSelection);
  $("btn-home").addEventListener("click", openHome);
  $("btn-pause-home").addEventListener("click", openHome);
  function openRanking() {
    setScreen("gameover-modal");
    loadRanking();
    $("btn-change-player").focus();
  }
  $("btn-view-ranking").addEventListener("click", openRanking);
  $("btn-splash-ranking").addEventListener("click", openRanking);
  $("pause-button").addEventListener("click", pause);
  $("resume-button").addEventListener("click", resume);
  board.addEventListener("pointerdown", (e) => {
    if (!e.target.closest("button,input,a,form,.modal-overlay")) jump();
  });
  document.addEventListener("keydown", (e) => {
    const visible = !$("pause-screen").hidden
      ? $("pause-screen")
      : screens.map((id) => $(id)).find((node) => !node.hidden);
    if (visible) {
      if (
        visible.id === "pause-screen" &&
        ["Escape", "KeyP"].includes(e.code)
      ) {
        e.preventDefault();
        resume();
        return;
      }
      if (
        visible.id === "splash-screen" &&
        !e.repeat &&
        ["Enter", "Space"].includes(e.code) &&
        !e.target.closest("button,a,input")
      ) {
        e.preventDefault();
        $("btn-splash-play").click();
        return;
      }
      if (e.key === "Tab") {
        const controls = [
          ...visible.querySelectorAll(
            "button:not(:disabled):not([hidden]),a[href],input:not(:disabled)",
          ),
        ].filter((node) => node.getClientRects().length);
        controls.push($("audio-toggle"));
        const index = controls.indexOf(document.activeElement);
        e.preventDefault();
        controls[
          (index + (e.shiftKey ? -1 : 1) + controls.length) % controls.length
        ]?.focus();
      }
      return;
    }
    if (
      e.target.closest("input,textarea,select,button,a") ||
      e.ctrlKey ||
      e.altKey ||
      e.metaKey
    )
      return;
    if (e.code === "Escape" || e.code === "KeyP") {
      pause();
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
  // Core animations remain active even with reduced motion. Optional bobbing
  // and CSS transitions still respect the preference.
  video.addEventListener("canplay", scenePlayback);
  video.addEventListener("error", () =>
    console.error("Falha ao carregar o vídeo do cenário:", video.error),
  );
  new ResizeObserver(resize).observe(board);
  resize();
  setScreen("splash-screen");
  loadRanking();
  heroImage.addEventListener("load", () => {
    if (state && state.status !== "playing") paintHero();
  });
  Promise.all(
    [
      sprites.hero.image,
      sprites.world.image,
      sprites.gem.image,
      PIKACHU_IMAGE,
      SONIC_IMAGE,
      sprites.shadow.image,
      sprites.thamires.image,
      sprites.pokeball.image,
      sprites.spike.image,
      sprites.ring.image,
      "assets/scenes/pokemon.jpg",
      "assets/scenes/forest.jpg",
      ...RAICHU_IMAGES,
      ...Object.values(collectibleSprites).map((sheet) => sheet.image),
      ...evolutionFrames.map((image) => image.getAttribute("src")),
    ].map(
      (src) =>
        new Promise((resolve, reject) => {
          const image = new Image();
          image.onload = () => {
            preloadedImages.set(src, image);
            resolve();
          };
          image.onerror = reject;
          image.src = src;
        }),
    ),
  )
    .then(() => {
      ready = true;
      $("btn-start-game").disabled = false;
      $("btn-start-game").textContent = "INICIAR JOGO";
    })
    .catch(() => {
      $("asset-status").textContent =
        "Não foi possível carregar os sprites. Atualize a página para tentar novamente.";
    });
  function loop(now) {
    const dt = Math.min(0.032, Math.max(0, (now - previous) / 1000));
    previous = now;
    paintSelection(dt);
    if (state?.status === "playing") update(dt);
    else if (state?.status === "evolving") updateEvolution(dt);
    if (["playing", "evolving"].includes(state?.status)) render();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
