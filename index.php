<?php
$sprites = file_get_contents(__DIR__ . '/assets/sprites/frames.json');
?>
<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta
      name="viewport"
      content="width=device-width, initial-scale=1, viewport-fit=cover"
    />
    <meta name="theme-color" content="#100e1a" />
    <title>Arcane Run · VORTEX</title>
    <link rel="stylesheet" href="css/styles.css?v=gem-run-3" />
    <script src="js/audio.js?v=gem-run-3" defer></script>
    <script src="js/script.js?v=gem-run-3" defer></script>
  </head>
  <body class="game-page">
    <header class="site-header">
      <div class="header-top">
        <a class="brand" href="index.php" aria-label="VORTEX, início"
          ><span class="brand-mark">V</span> VORTEX</a
        >
        <nav aria-label="Navegação principal">
          <a href="pages/sobre-nos.php">Sobre nós</a>
          <button
            type="button"
            id="audio-toggle"
            class="quiet"
            aria-label="Silenciar áudio"
            aria-pressed="false"
          >
            Som: ligado
          </button>
          <button
            type="button"
            id="pause-button"
            class="quiet"
            disabled
            aria-label="Pausar partida"
          >
            Ⅱ Pausar
          </button>
        </nav>
      </div>
      <div class="hud" aria-label="Informações da partida">
        <div class="player-info">
          <span class="label">JOGADOR</span
          ><strong id="hud-player">Mago</strong>
        </div>
        <div>
          <span class="label">NÍVEL</span
          ><strong id="hud-level">1 · Fácil</strong>
        </div>
        <div>
          <span class="label">VIDAS</span
          ><strong id="hud-lives" aria-label="3 vidas">◆ ◆ ◆</strong>
        </div>
        <div class="score">
          <span class="label">PONTOS</span><strong id="hud-score">00000</strong>
        </div>
      </div>
    </header>
    <main class="game-shell">
      <section
        class="game-board"
        id="game-board"
        tabindex="0"
        aria-label="Partida; toque ou pressione Espaço para pular"
      >
        <video
          id="scene-video"
          class="scene-video"
          muted
          loop
          playsinline
          preload="auto"
          poster="assets/scenes/dungeon-poster.webp"
          aria-hidden="true"
        >
          <source src="assets/scenes/dungeon.mp4" type="video/mp4" />
        </video>
        <div class="scene-shade" aria-hidden="true"></div>
        <div class="floor" aria-hidden="true"></div>
        <div class="world" id="world" aria-hidden="true" hidden>
          <div class="actor hero" id="hero">
            <span class="sprite-art"></span>
          </div>
          <div class="actor boss" id="boss" hidden>
            <span class="sprite-art"></span>
          </div>
          <div class="lane-warning" id="lane-warning" hidden></div>
        </div>
        <p
          class="transition-banner"
          id="notice"
          role="status"
          aria-live="polite"
          hidden
        ></p>
        <div class="screen" id="menu-screen">
          <div class="menu-card">
            <span class="chapter">VORTEX · ARCANE RUN</span>
            <h1>Aventure-se<br />nas <em>sombras.</em></h1>
            <p>Salte sobre as ruínas e sobreviva aos ataques do Rei do Lodo.</p>
            <form id="start-form">
              <label for="player-name">Como devemos chamar você?</label>
              <div class="start-row">
                <input
                  id="player-name"
                  name="nome"
                  maxlength="30"
                  autocomplete="nickname"
                  placeholder="Seu nome"
                  required
                /><button id="start-button" class="primary" disabled>
                  Carregando…
                </button>
              </div>
            </form>
            <p class="menu-help">
              Espaço, ↑ ou toque no cenário para pular.<br />No boss, pule o
              veneno baixo e fique no chão contra o alto.<br />Sobreviva por 20
              segundos para continuar.
            </p>
            <p id="asset-status" class="muted" role="status"></p>
          </div>
        </div>
        <div class="screen pause-screen" id="pause-screen" hidden>
          <div class="dialog">
            <h2>Partida pausada</h2>
            <button id="resume-button" class="primary">Continuar</button>
          </div>
        </div>
        <div class="screen" id="over-screen" hidden>
          <div class="dialog gameover">
            <h2>Fim da jornada</h2>
            <strong class="final-score" id="final-score">0</strong>
            <p id="final-detail"></p>
            <p id="save-status" role="status"></p>
            <details id="ranking-details" class="ranking">
              <summary>Ver ranking</summary>
              <p id="ranking-status" class="muted" role="status"></p>
              <ol id="ranking-list"></ol>
            </details>
            <div class="actions">
              <button id="restart-button" class="primary">
                Tentar novamente</button
              ><button id="menu-button" class="secondary">Início</button>
            </div>
          </div>
        </div>
      </section>
    </main>
    <script id="sprite-data" type="application/json">
      <?= $sprites ?>
    </script>
  </body>
</html>
