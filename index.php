<?php

require_once 'conexao.php';

/**
 * Lista de personagens jogáveis.
 * Para adicionar um novo: coloque as imagens em assets/characters/ e inclua um item aqui.
 *  - 'run'  = imagem do personagem correndo (PNG, GIF ou SVG)
 *  - 'dead' = imagem do personagem quando perde (Game Over)
 *  - 'cenario' = imagem de fundo do jogo desse personagem
 *  - 'obstaculo' = imagem do obstáculo desse personagem
 */
$personagens = [
    ['id' => 'pikachu', 'nome' => 'Pikachu', 'run' => 'assets/characters/pikachu.gif', 'dead' => 'assets/characters/pikachu.gif', 'cenario' => 'assets/cenario-pikachu.jpg', 'obstaculo' => 'assets/obstaculo-pikachu.png'],
    ['id' => 'bart', 'nome' => 'Bart', 'run' => 'assets/characters/bart.gif', 'dead' => 'assets/characters/bart.gif', 'cenario' => 'assets/cenario-bart.png', 'obstaculo' => 'assets/obstaculo-bart.png'],
    ['id' => 'sasuke', 'nome' => 'Sasuke', 'run' => 'assets/characters/sasuke.gif', 'dead' => 'assets/characters/sasuke.gif', 'cenario' => 'assets/cenario-sasuke.png', 'obstaculo' => 'assets/obstaculo-sasuke.png'],
    ['id' => 'sonic', 'nome' => 'Sonic', 'run' => 'assets/characters/sonic.gif', 'dead' => 'assets/characters/sonic.gif', 'cenario' => 'assets/cenario-sonic.jpg', 'obstaculo' => 'assets/obstaculo-sonic.png'],
];

// Busca inicial do ranking para carregar rápido na primeira abertura
$rankingInicial = [];
try {
    $stmt = $pdo->query("
        SELECT id, nome, pontos, DATE_FORMAT(data_registro, '%d/%m/%Y %H:%i') as data 
        FROM ranking 
        ORDER BY pontos DESC, id ASC 
        LIMIT 10
    ");
    $rankingInicial = $stmt->fetchAll();
} catch (Exception $e) {
    // Caso o banco ainda não possua registros
    $rankingInicial = [];
}

// Recorde (1º lugar) mostrado na tela de abertura
$recorde = !empty($rankingInicial) ? $rankingInicial[0] : null;
?>
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Hero Jump - Jogo com Ranking MySQL</title>

    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&family=Press+Start+2P&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="css/styles.css">
</head>
<body>

    <div class="game-container">
        
        <header class="hud-bar">
            <div class="player-info">
                <span class="label">JOGADOR:</span>
                <span class="value" id="hud-player-name">---</span>
            </div>
            <div class="speed-info">
                <span class="label">VEL:</span>
                <span class="value" id="speed-display">1.0x</span>
            </div>
            <div class="score-info">
                <span class="label">PONTOS:</span>
                <span class="value" id="score-display">0</span>
            </div>
        </header>

        
        <main class="game-board" id="game-board">

            <img src="<?= htmlspecialchars($personagens[0]['run']) ?>" class="hero" alt="Personagem">
            <img src="<?= htmlspecialchars($personagens[0]['obstaculo']) ?>" class="pipe" alt="Obstáculo">
            <span class="jump-tip" id="jump-tip">Pressione ESPAÇO ou clique para pular</span>
        </main>
    </div>

    <!-- 0. TELA INICIAL (aparece ao entrar no site e ao clicar em "Voltar à tela inicial") -->
    <div class="splash active" id="splash-screen" role="dialog" aria-label="Hero Jump - tela inicial">
        <div class="splash-bg" aria-hidden="true"></div>

        <div class="splash-content">
            <h1 class="splash-title">HERO<br>JUMP</h1>

            <p class="splash-record">🏆 RECORDE: <span id="splash-record-text"><?= $recorde ? htmlspecialchars($recorde['nome']) . ' - ' . (int)$recorde['pontos'] . ' PTS' : '---' ?></span></p>

            <button type="button" class="btn btn-primary splash-play" id="btn-splash-play">INICIAR JOGO</button>
        </div>
    </div>

    <!-- 0.1 COMO JOGAR (abre ao clicar em "Iniciar jogo" na tela inicial) -->
    <div class="modal-overlay" id="howto-modal" role="dialog" aria-modal="true" aria-labelledby="howto-title">
        <div class="modal-card howto-card">
            <h2 class="game-title" id="howto-title">COMO JOGAR</h2>

            <ul class="howto-list">
                <li>
                    <span class="howto-label">PULAR</span>
                    <span>Aperte <span class="key">ESPAÇO</span> ou <span class="key">&uarr;</span>, ou clique/toque no cenário.</span>
                </li>
                <li>
                    <span class="howto-label">DESVIAR</span>
                    <span>Pule por cima dos obstáculos. Bateu em um, acabou!</span>
                </li>
                <li>
                    <span class="howto-label">PONTUAR</span>
                    <span>Quanto mais tempo você sobreviver, mais pontos faz.</span>
                </li>
                <li>
                    <span class="howto-label">RANKING</span>
                    <span>Sua pontuação é salva e os 10 melhores aparecem no ranking.</span>
                </li>
            </ul>

            <div class="modal-actions">
                <button type="button" class="btn btn-primary" id="btn-howto-ok">OK</button>
            </div>
        </div>
    </div>

    <!-- 1. TELA DE INÍCIO / INSERIR NOME / ESCOLHER PERSONAGEM -->
    <div class="modal-overlay" id="start-modal">
        <div class="modal-card start-card">
            <div class="modal-header">
                <h1 class="game-title">HERO JUMP</h1>
                <p class="game-subtitle">Corra pela cidade, desvie dos obstáculos e dispute o topo do ranking!</p>
            </div>

            <form class="start-form" id="start-form">
                <div class="input-group">
                    <label for="player-input">DIGITE SEU NOME:</label>
                    <input 
                        type="text" 
                        id="player-input" 
                        placeholder="Ex: Seu Nome" 
                        maxlength="30" 
                        required 
                        autocomplete="off"
                        autofocus
                    >
                </div>

                <div class="input-group">
                    <span class="field-label" id="character-label">ESCOLHA SEU PERSONAGEM:</span>
                    <div class="character-select" role="radiogroup" aria-labelledby="character-label">
                        <?php foreach ($personagens as $i => $p): ?>
                            <label class="character-card">
                                <input
                                    type="radio"
                                    name="character"
                                    value="<?= htmlspecialchars($p['id']) ?>"
                                    data-name="<?= htmlspecialchars($p['nome']) ?>"
                                    data-run="<?= htmlspecialchars($p['run']) ?>"
                                    data-dead="<?= htmlspecialchars($p['dead']) ?>"
                                    data-cenario="<?= htmlspecialchars($p['cenario']) ?>"
                                    data-obstaculo="<?= htmlspecialchars($p['obstaculo']) ?>"
                                    <?= $i === 0 ? 'checked' : '' ?>
                                >
                                <span class="card-body">
                                    <img src="<?= htmlspecialchars($p['run']) ?>" alt="">
                                    <span class="card-name"><?= htmlspecialchars($p['nome']) ?></span>
                                </span>
                            </label>
                        <?php endforeach; ?>
                    </div>
                </div>

                <div class="modal-actions">
                    <button type="submit" class="btn btn-primary" id="btn-start">INICIAR JOGO</button>
                    <button type="button" class="btn btn-secondary" id="btn-view-ranking">VER RANKING</button>
                </div>
            </form>

            <div class="server-status" id="server-status">
                <span class="status-dot online"></span> Conectado ao MySQL
            </div>
        </div>
    </div>

    <!-- 2. TELA DE GAME OVER & RANKING -->
    <div class="modal-overlay" id="gameover-modal">
        <div class="modal-card gameover-card">
            <div class="modal-header">
                <h2 class="gameover-title">GAME OVER</h2>
                <div class="final-score-box">
                    <div class="final-score-label">SUA PONTUAÇÃO</div>
                    <div class="final-score-num" id="final-score-value">0</div>
                    <div class="save-status" id="save-status-msg"></div>
                </div>
            </div>

            <!-- Tabela com o TOP 10 -->
            <div class="ranking-container">
                <h3 class="ranking-title">🏆 TOP 10 MELHORES PONTUAÇÕES</h3>
                <div class="table-wrapper">
                    <table class="ranking-table">
                        <thead>
                            <tr>
                                <th>POS</th>
                                <th>JOGADOR</th>
                                <th>PONTUAÇÃO</th>
                            </tr>
                        </thead>
                        <tbody id="ranking-body">
                            <?php if (!empty($rankingInicial)): ?>
                                <?php foreach ($rankingInicial as $i => $row): ?>
                                    <tr>
                                        <td class="ranking-pos">
                                            <?= $i === 0 ? '🥇 1º' : ($i === 1 ? '🥈 2º' : ($i === 2 ? '🥉 3º' : ($i + 1) . 'º')) ?>
                                        </td>
                                        <td><strong><?= htmlspecialchars($row['nome']) ?></strong></td>
                                        <td><?= (int)$row['pontos'] ?> pts</td>
                                    </tr>
                                <?php endforeach; ?>
                            <?php else: ?>
                                <tr>
                                    <td colspan="3" class="loading-cell">Nenhuma pontuação gravada ainda. Jogue para ser o 1º!</td>
                                </tr>
                            <?php endif; ?>
                        </tbody>
                    </table>
                </div>
            </div>

            <div class="modal-actions">
                <button type="button" class="btn btn-primary" id="btn-restart">JOGAR NOVAMENTE</button>
                <button type="button" class="btn btn-secondary" id="btn-change-player">TROCAR JOGADOR</button>
                <button type="button" class="btn btn-secondary" id="btn-home">VOLTAR À TELA INICIAL</button>
            </div>
        </div>
    </div>

   
    <script src="js/script.js" defer></script>
</body>
</html>
