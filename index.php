<?php
$sprites = file_get_contents(__DIR__ . '/assets/sprites/frames.json');
$collectibles = file_get_contents(__DIR__ . '/assets/collectibles/frames.json');
$secretCharacters = ['thamires' =>
'THAMIRES', 'pedro' => 'PEDRO', 'guedes' => 'GUEDES', 'amanda' => 'AMANDA']; ?>
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
    <link rel="stylesheet" href="css/styles.css?v=arcade-13" />
    <script src="js/audio.js?v=arcade-13" defer></script>
    <script src="js/script.js?v=arcade-13" defer></script>
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
        <button
          id="btn-splash-ranking"
          class="splash-record"
          type="button"
          aria-label="Ver recorde e ranking"
        >
          <span class="record-emblem" aria-hidden="true">🏆</span>
          <span class="record-content"
            ><span class="screen-kicker">RECORDE DO BEYOND JUMP</span
            ><span id="splash-record-text">Consultando…</span></span
          >
          <svg
            class="record-arrow"
            aria-hidden="true"
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.8"
          >
            <path d="M6 18 18 6M6 6h12v12" />
          </svg>
        </button>
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
        <div class="screen-heading">
          <p class="screen-kicker">SEU PRÓXIMO DESAFIO</p>
          <h2 id="howto-title" class="game-title">COMO JOGAR</h2>
          <p class="screen-intro">
            Um salto de cada vez. Vá além do seu recorde.
          </p>
        </div>
        <div class="control-strip" aria-label="Controles">
          <span><kbd>ESPAÇO</kbd> ou <kbd>↑</kbd> para pular</span
          ><span>Toque no cenário pelo celular</span>
        </div>
        <ol class="howto-list">
          <li>
            <span class="step-number" aria-hidden="true">01</span>
            <div>
              <strong>PULE E DESVIE</strong>
              <p>
                Salte sobre os obstáculos. Você começa com <b>3 vidas</b>; cada
                dano retira um coração.
              </p>
            </div>
          </li>
          <li>
            <span class="step-number" aria-hidden="true">02</span>
            <div>
              <strong>COLETE E PONTUE</strong>
              <p>
                Gemas, doces ou argolas: cada item vale <b>+30 pontos</b>.
                Sobreviver também aumenta sua pontuação.
              </p>
            </div>
          </li>
          <li>
            <span class="step-number" aria-hidden="true">03</span>
            <div>
              <strong>ENCARE O BOSS</strong>
              <p>
                Após <b>24 segundos</b>, o Rei do Lodo aparece. Pule o veneno
                baixo e fique no chão contra o alto. Sobreviva por
                <b>20 segundos</b> e ganhe <b>+300 pontos</b>.
              </p>
            </div>
          </li>
          <li>
            <span class="step-number" aria-hidden="true">04</span>
            <div>
              <strong>DESCUBRA A EVOLUÇÃO</strong>
              <p>
                Com Pikachu, alcance <b>1.500 pontos</b> e colete a Pedra do
                Trovão. A partida pausa por um instante para a transformação em
                Raichu.
              </p>
            </div>
          </li>
          <li>
            <span class="step-number" aria-hidden="true">05</span>
            <div>
              <strong>SUPERE OS NÍVEIS</strong>
              <p>
                O desafio cresce aos <b>20 e 45 segundos</b> de partida. O ritmo
                aumenta aos poucos: observe e escolha a hora do salto.
              </p>
            </div>
          </li>
          <li>
            <span class="step-number" aria-hidden="true">06</span>
            <div>
              <strong>CONQUISTE O TOP 10</strong>
              <p>
                Seu resultado vai para o ranking no Game Over. Para fazer uma
                pausa, use <kbd>P</kbd>, <kbd>ESC</kbd> ou o botão Pausar.
              </p>
            </div>
          </li>
        </ol>
        <div class="howto-footer">
          <span>Pronto para o primeiro salto?</span
          ><button id="btn-howto-ok" class="primary">
            OK, ENTENDI <span aria-hidden="true">→</span>
          </button>
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
          <p
            id="secret-unlock-status"
            class="secret-unlock-status"
            role="status"
            hidden
          >
            ✨ Easter egg SENAI! Quatro personagens secretos liberados.
          </p>
          <fieldset class="character-fieldset">
            <legend>ESCOLHA SEU PERSONAGEM</legend>
            <div class="character-select">
              <?php foreach ($secretCharacters as $id => $name): ?>
              <label class="character-card" data-secret-character hidden>
                <input
                  type="radio"
                  name="character"
                  value="<?= $id ?>"
                  disabled
                />
                <span class="card-body"
                  ><span id="<?= $id ?>-preview" class="character-preview"
                    ><span class="sprite-art"></span></span
                  ><strong><?= $name ?></strong></span
                >
              </label>
              <?php endforeach; ?>
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
          <p class="screen-kicker">HALL DA FAMA</p>
          <h2 id="gameover-title" class="gameover-title">GAME OVER</h2>
          <p id="ranking-description" class="screen-intro">
            Cada salto conta. Este foi o seu resultado.
          </p>
          <div class="final-score-box">
            <div class="final-score-label">SUA PONTUAÇÃO</div>
            <div id="final-score-value" class="final-score-num">0</div>
            <div id="save-status-msg" class="save-status" role="status"></div>
          </div>
        </div>
        <div class="ranking-container">
          <div id="ranking-leader" class="ranking-leader" hidden>
            <span class="leader-emblem" aria-hidden="true">🏆</span>
            <div>
              <span class="screen-kicker">NO TOPO DO JOGO</span
              ><strong id="ranking-leader-name"></strong>
            </div>
            <span id="ranking-leader-score" class="leader-score"></span>
          </div>
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
