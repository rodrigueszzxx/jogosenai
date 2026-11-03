<?php
$sprites = file_get_contents(__DIR__ . '/assets/sprites/frames.json');
$collectibles = file_get_contents(__DIR__ . '/assets/collectibles/frames.json');
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
    <title>Beyond Jump · Beyond the Limits</title>
    <link
      rel="preload"
      href="assets/fonts/press-start-2p-latin-400-normal.woff2"
      as="font"
      type="font/woff2"
      crossorigin
    />
    <link
      rel="preload"
      href="assets/fonts/poppins-latin-400-normal.woff2"
      as="font"
      type="font/woff2"
      crossorigin
    />
    <link rel="stylesheet" href="css/styles.css?v=runner-9" />
    <script src="js/audio.js?v=runner-9" defer></script>
    <script src="js/script.js?v=runner-9" defer></script>
  </head>
  <body class="game-page">
    <div class="game-tools" aria-label="Controles da partida">
      <button
        type="button"
        id="audio-toggle"
        class="quiet"
        aria-label="Silenciar áudio"
        aria-pressed="false"
      >
        Som: ligado</button
      ><button
        type="button"
        id="pause-button"
        class="quiet"
        disabled
        aria-label="Pausar partida"
      >
        Ⅱ Pausar
      </button>
    </div>
    <div class="game-container">
      <header class="hud-bar" aria-label="Informações da partida">
        <div class="player-info">
          <span class="label">JOGADOR</span><strong id="hud-player">---</strong>
        </div>
        <div>
          <span class="label">NÍVEL</span
          ><strong id="hud-level">1 · Fácil</strong>
        </div>
        <div>
          <span class="label">VIDAS</span
          ><span id="hud-lives" role="img" aria-label="3 vidas"
            ><span class="life-heart" aria-hidden="true"></span
            ><span class="life-heart" aria-hidden="true"></span
            ><span class="life-heart" aria-hidden="true"></span
          ></span>
        </div>
        <div class="score">
          <span class="label">PONTOS</span><strong id="hud-score">00000</strong>
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
          <div
            id="scene-panorama"
            class="scene-panorama"
            aria-hidden="true"
            hidden
          >
            <div class="scene-track">
              <span class="scene-panel"></span><span class="scene-panel"></span
              ><span class="scene-panel"></span>
            </div>
          </div>
          <div class="scene-shade" aria-hidden="true"></div>
          <div class="floor" aria-hidden="true"></div>
          <div class="world" id="world" aria-hidden="true" hidden>
            <div class="actor hero" id="hero">
              <span class="sprite-art"></span
              ><img
                id="hero-image"
                class="character-image"
                alt=""
                hidden
              /><canvas
                id="hero-freeze"
                class="character-image"
                hidden
              ></canvas>
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
        </section>
      </main>
    </div>
    <!-- Fluxo de telas do Hero Jump: abertura, instruções, seleção e resultado. -->
    <section
      id="splash-screen"
      class="splash-screen"
      aria-labelledby="splash-title"
    >
      <div class="splash-content">
        <div class="splash-company">
          <img
            class="company-logo"
            src="assets/brand/beyond-the-limits.png"
            alt="Beyond the Limits"
          /><small>APRESENTA</small>
        </div>
        <h1 id="splash-title" class="splash-title">
          BEYOND<br /><span>JUMP</span>
        </h1>
        <p class="splash-record">
          RECORDE: <strong id="splash-record-text">Consultando…</strong>
        </p>
        <button id="btn-splash-play" class="primary">INICIAR JOGO</button
        ><a class="about-link" href="pages/sobre-nos.php">Sobre nós →</a>
      </div>
    </section>
    <section
      id="howto-modal"
      class="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="howto-title"
      hidden
    >
      <div class="modal-card howto-card">
        <h2 id="howto-title" class="game-title">COMO JOGAR</h2>
        <ul class="howto-list">
          <li>
            <strong>PULAR</strong
            ><span>Use Espaço, ↑ ou clique/toque no cenário.</span>
          </li>
          <li>
            <strong>SOBREVIVER</strong
            ><span
              >Salte sobre os obstáculos. Você tem três vidas por partida.</span
            >
          </li>
          <li>
            <strong>BOSS</strong
            ><span
              >Após 24 segundos, enfrente o Rei do Lodo. Pule o veneno baixo e
              permaneça no chão contra o alto. Sobreviva por 20 segundos para
              continuar.</span
            >
          </li>
          <li>
            <strong>COLETAR</strong
            ><span
              >Os itens valem 30 pontos. O Mago coleta gemas, o Pikachu coleta
              doces e Sonic e Shadow coletam argolas.</span
            >
          </li>
          <li>
            <strong>EVOLUIR</strong
            ><span
              >Com Pikachu, alcance 1.500 pontos e colete a Pedra do Trovão para
              evoluir para Raichu. Os raios pausam a partida por 1,2
              segundo.</span
            >
          </li>
          <li>
            <strong>NÍVEIS E RANKING</strong
            ><span
              >O nível muda aos 20 e 45 segundos ativos. A pontuação é salva no
              Game Over e os dez melhores aparecem no ranking.</span
            >
          </li>
        </ul>
        <div class="modal-actions">
          <button id="btn-howto-ok" class="primary">OK, ENTENDI</button>
        </div>
      </div>
    </section>
    <section
      id="start-modal"
      class="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="start-title"
      hidden
    >
      <div class="modal-card start-card">
        <h2 id="start-title" class="game-title">BEYOND JUMP</h2>
        <p class="game-subtitle">Escolha seu herói e comece a aventura.</p>
        <form id="start-form">
          <div class="input-group">
            <label for="player-input">DIGITE SEU NOME</label
            ><input
              id="player-input"
              name="nome"
              maxlength="30"
              autocomplete="nickname"
              placeholder="Ex: Seu nome"
              required
            />
          </div>
          <fieldset class="character-fieldset">
            <legend>ESCOLHA SEU PERSONAGEM</legend>
            <div class="character-select">
              <label class="character-card"
                ><input
                  type="radio"
                  name="character"
                  value="wizard"
                  checked
                /><span class="card-body"
                  ><span id="mage-preview" class="character-preview"
                    ><span class="sprite-art"></span></span
                  ><strong>MAGO</strong></span
                ></label
              >
              <label class="character-card"
                ><input type="radio" name="character" value="pikachu" /><span
                  class="card-body"
                  ><img
                    src="assets/characters/pikachu.gif"
                    alt="Pikachu correndo"
                  /><strong>PIKACHU</strong></span
                ></label
              >
              <label class="character-card">
                <input type="radio" name="character" value="sonic" />
                <span class="card-body"
                  ><img
                    src="assets/characters/sonic.gif"
                    alt="Sonic correndo"
                  /><strong>SONIC</strong></span
                >
              </label>
              <label class="character-card">
                <input type="radio" name="character" value="shadow" />
                <span class="card-body"
                  ><span id="shadow-preview" class="character-preview"
                    ><span class="sprite-art"></span></span
                  ><strong>SHADOW</strong></span
                >
              </label>
            </div>
          </fieldset>
          <div class="modal-actions">
            <button id="btn-start-game" class="primary" disabled>
              CARREGANDO…</button
            ><button type="button" id="btn-view-ranking" class="secondary">
              VER RANKING
            </button>
          </div>
        </form>
        <p id="asset-status" class="muted" role="status"></p>
        <p id="server-status" class="server-status" role="status">
          Verificando conexão do ranking…
        </p>
      </div>
    </section>
    <section
      id="pause-screen"
      class="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pause-title"
      hidden
    >
      <div class="modal-card pause-card">
        <h2 id="pause-title">Partida pausada</h2>
        <div class="modal-actions">
          <button id="resume-button" class="primary">Continuar</button
          ><button id="btn-pause-home" class="secondary">
            VOLTAR À TELA INICIAL
          </button>
        </div>
      </div>
    </section>
    <section
      id="gameover-modal"
      class="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="gameover-title"
      hidden
    >
      <div class="modal-card gameover-card">
        <div class="modal-header">
          <h2 id="gameover-title" class="gameover-title">GAME OVER</h2>
          <div class="final-score-box">
            <div class="final-score-label">SUA PONTUAÇÃO</div>
            <div id="final-score-value" class="final-score-num">0</div>
            <div id="save-status-msg" class="save-status" role="status"></div>
          </div>
        </div>
        <div class="ranking-container">
          <h3 class="ranking-title">
            <span aria-hidden="true">🏆</span> TOP 10 MELHORES PONTUAÇÕES
          </h3>
          <p id="ranking-status" class="muted" role="status"></p>
          <div class="table-wrapper">
            <table class="ranking-table">
              <thead>
                <tr>
                  <th scope="col">POS</th>
                  <th scope="col">JOGADOR</th>
                  <th scope="col">PONTUAÇÃO</th>
                </tr>
              </thead>
              <tbody id="ranking-body"></tbody>
            </table>
          </div>
        </div>
        <div class="modal-actions">
          <button id="btn-restart" class="primary">JOGAR NOVAMENTE</button
          ><button id="btn-change-player" class="secondary">
            TROCAR JOGADOR</button
          ><button id="btn-home" class="secondary">
            VOLTAR À TELA INICIAL
          </button>
        </div>
      </div>
    </section>
    <div id="raios-evolucao" class="raios-evolucao" hidden aria-hidden="true">
      <img src="assets/effects/evolution-thunder-1.jpg" alt="" hidden /><img
        src="assets/effects/evolution-thunder-2.jpg"
        alt=""
        hidden
      /><img src="assets/effects/evolution-thunder-3.jpg" alt="" hidden /><img
        src="assets/effects/evolution-thunder-4.jpg"
        alt=""
        hidden
      />
      <p>PIKACHU → RAICHU</p>
    </div>
    <script id="sprite-data" type="application/json">
      <?= $sprites ?>
    </script>
    <script id="collectible-sprites" type="application/json">
      <?= $collectibles ?>
    </script>
  </body>
</html>
