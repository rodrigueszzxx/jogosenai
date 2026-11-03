<?php
$atlas = file_get_contents(__DIR__ . '/assets/sprites/frames.json');
?>
<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="theme-color" content="#100e1a" />
    <title>Arcane Run · VORTEX</title>
    <link rel="stylesheet" href="css/styles.css?v=arcane-1" />
    <script src="js/audio.js?v=arcane-1" defer></script>
    <script src="js/script.js?v=arcane-1" defer></script>
  </head>
  <body>
    <header class="site-header">
      <a class="brand" href="index.php" aria-label="VORTEX, início"
        ><span class="brand-mark">V</span> VORTEX <small>ARCADE</small></a
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
      </nav>
    </header>
    <main class="game-shell">
      <div class="game-heading">
        <div>
          <p class="eyebrow">AS PROFUNDEZAS ESPERAM</p>
          <h1>ARCANE <span>RUN</span></h1>
        </div>
        <span class="edition">CAPÍTULO I · A MASMORRA</span>
      </div>
      <div class="hud" aria-label="Informações da partida">
        <div>
          <span class="label">JOGADOR</span
          ><strong id="hud-player">Mago</strong>
        </div>
        <div>
          <span class="label">ETAPA</span
          ><strong id="hud-phase">Travessia</strong>
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
      <section
        class="game-board"
        id="game-board"
        aria-label="Cenário da partida"
      >
        <video
          id="scene-video"
          class="scene-video"
          muted
          loop
          playsinline
          preload="metadata"
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
        <div class="boss-hud" id="boss-hud" hidden>
          <div>
            <strong>REI DO LODO</strong><span id="boss-health-text"></span>
          </div>
          <progress
            id="boss-health"
            max="12"
            value="12"
            aria-label="Vida do boss"
          ></progress>
        </div>
        <p
          class="notice"
          id="notice"
          role="status"
          aria-live="polite"
          hidden
        ></p>
        <p
          class="attack-cue"
          id="attack-cue"
          role="status"
          aria-live="polite"
          hidden
        ></p>
        <div class="screen" id="menu-screen">
          <div class="menu-card">
            <span class="chapter">UMA CORRIDA. UM DUELO. SUA MAGIA.</span>
            <h2>Aventure-se<br />nas <em>sombras.</em></h2>
            <p>
              Salte sobre as ruínas. Enfrente o Rei do Lodo.<br />Sobreviva para
              atravessar a próxima sala.
            </p>
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
              ESPAÇO / ↑ para pular <span>·</span> J / X para lançar feitiço no
              boss
            </p>
            <p id="asset-status" class="muted" role="status"></p>
          </div>
        </div>
        <div class="screen pause-screen" id="pause-screen" hidden>
          <div class="dialog">
            <p class="eyebrow">RESPIRE UM POUCO</p>
            <h2>Partida pausada</h2>
            <p>O tempo, os ataques e os pontos estão parados.</p>
            <button id="resume-button" class="primary">Continuar</button>
          </div>
        </div>
        <div class="screen" id="over-screen" hidden>
          <div class="dialog gameover">
            <p class="eyebrow">A MASMORRA VENCEU ESTA VEZ</p>
            <h2>Fim da jornada</h2>
            <strong class="final-score" id="final-score">0</strong>
            <p id="final-detail"></p>
            <p id="save-status" role="status"></p>
            <div class="actions">
              <button id="restart-button" class="primary">
                Tentar novamente</button
              ><button id="menu-button" class="secondary">Início</button>
            </div>
          </div>
        </div>
      </section>
      <div class="game-toolbar">
        <p id="phase-tip">
          Desvie das pedras e colete cristais. Cada cristal vale 30 pontos.
        </p>
        <div class="controls">
          <button id="jump-button" class="control">
            ↑ Pular <kbd>ESPAÇO</kbd></button
          ><button id="spell-button" class="control spell" disabled>
            ✦ Feitiço <kbd>J</kbd></button
          ><button
            id="pause-button"
            class="quiet"
            disabled
            aria-label="Pausar partida"
          >
            Ⅱ Pausar
          </button>
        </div>
      </div>
      <section class="below-game">
        <div class="journey">
          <p class="eyebrow">ENTENDA A JORNADA</p>
          <h2>A cada sala, um novo desafio.</h2>
          <div class="steps">
            <p>
              <b>01 / TRAVESSIA</b>Salte sobre as pedras e junte cristais
              durante 24 segundos.
            </p>
            <p>
              <b>02 / CONFRONTO</b>Pule o veneno baixo, fique no chão contra o
              alto e lance feitiços.
            </p>
            <p>
              <b>03 / PRÓXIMA SALA</b>Derrote o boss, receba 300 pontos e
              continue uma nova travessia.
            </p>
          </div>
        </div>
        <div class="ranking">
          <div class="ranking-title">
            <h2>Top 10</h2>
            <button
              id="ranking-refresh"
              class="quiet"
              aria-label="Atualizar ranking"
            >
              ↻
            </button>
          </div>
          <p id="ranking-status" class="muted" role="status">
            Consultando ranking…
          </p>
          <ol id="ranking-list"></ol>
        </div>
      </section>
    </main>
    <footer>
      VORTEX © 2026 <span>Projeto acadêmico · mario_final_grupo</span>
    </footer>
    <script id="sprite-data" type="application/json">
      <?= $atlas ?>
    </script>
  </body>
</html>
