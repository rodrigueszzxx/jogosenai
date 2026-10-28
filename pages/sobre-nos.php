<?php
session_start([
    'cookie_httponly' => true, 'cookie_samesite' => 'Lax',
    'cookie_secure' => !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off'
]);
if (empty($_SESSION['contact_token'])) $_SESSION['contact_token'] = bin2hex(random_bytes(32));
$contactToken = $_SESSION['contact_token'];
session_write_close();
$company = require __DIR__ . '/../config/company.php';
require_once __DIR__ . '/../config/database.php';
$recorde = null; $partidas = null;
try {
    $pdo = conectarBanco();
    $recorde = $pdo->query('SELECT nome,pontos FROM ranking ORDER BY pontos DESC,id ASC LIMIT 1')->fetch() ?: null;
    $partidas = (int)$pdo->query('SELECT COUNT(*) FROM ranking')->fetchColumn();
} catch (Throwable $e) { /* A apresentação continua disponível sem o banco. */ }
function h(string $value): string { return htmlspecialchars($value, ENT_QUOTES, 'UTF-8'); }
$heroes = [
 ['pikachu','Pikachu','Energia para mais uma tentativa. Entre doces e obstáculos, o desafio é acertar o tempo do pulo.','Doce'],
 ['bart','Bart','Atitude de sobra nas ruas de Springfield. Desvie do gato e fique de olho na lata que vale pontos.','Lata'],
 ['sasuke','Sasuke','Concentração na vila ninja. Um pergaminho no ar, um obstáculo no chão e uma decisão rápida.','Pergaminho'],
 ['sonic','Sonic','Um clássico da velocidade. Colete anéis enquanto a partida acelera e o próximo salto se aproxima.','Anel'],
];
$founderWords = preg_split('/\s+/', trim($company['founder']));
$founderInitials = mb_substr($founderWords[0], 0, 1) . (count($founderWords) > 1 ? mb_substr(end($founderWords), 0, 1) : '');
$team = [
 [$company['founder'],'Fundador & CEO','Da primeira linha de código à última tentativa: quero criar jogos que dão vontade de voltar.',$founderInitials],
 ...$company['team'],
];
?>
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="Conheça a história da VORTEX, nosso universo arcade, a equipe e o Hero Jump. Converse com o estúdio.">
    <title>Sobre nós | VORTEX</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&family=Press+Start+2P&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="../css/styles.css?v=vortex-2">
    <link rel="stylesheet" href="../css/sobre-nos.css?v=2">
    <script src="../js/contato.js?v=2" defer></script>
</head>
<body class="company-page">
<a class="skip-content" href="#conteudo">Pular para o conteúdo</a>
<div class="company-shell">
    <header class="company-header">
        <a class="company-wordmark" href="../index.php">VORTEX<span>GAME STUDIO</span></a>
        <nav aria-label="Navegação da empresa">
            <a href="#historia">O estúdio</a><a href="#jogos">Jogos</a><a href="#equipe">Equipe</a><a href="#contato">Contato</a>
        </nav>
        <a class="company-button small" href="../index.php">Jogar agora <span aria-hidden="true">→</span></a>
    </header>
    <main id="conteudo">
        <section class="company-hero" aria-labelledby="company-title">
            <div>
                <p class="company-kicker"><span class="live-dot" aria-hidden="true"></span> ESTÚDIO INDEPENDENTE · DESDE 2026</p>
                <h1 id="company-title">Uma boa partida<br>puxa a <em>próxima.</em></h1>
                <p class="company-lead">Somos a VORTEX. Criamos pequenos universos de grandes desafios: controles simples, identidade arcade e aquela vontade de tentar só mais uma vez.</p>
                <div class="company-actions"><a class="company-button" href="#jogos">Entre no nosso universo →</a><a class="company-text-link" href="#historia">Conheça a história</a></div>
                <p class="fiction-note">Empresa e história fictícias, criadas para um projeto acadêmico.</p>
            </div>
            <div class="company-brand-art">
                <img src="../assets/brand/vortex.jpg" alt="Logotipo VORTEX, com personagens em pixel art dentro de um redemoinho" width="2814" height="1536">
                <span class="brand-orbit">CRIATIVIDADE EM ÓRBITA. DIVERSÃO EM MOVIMENTO.</span>
            </div>
        </section>
        <div class="company-stats" aria-label="Números do projeto">
            <div><strong>01</strong><span>jogo disponível</span></div>
            <div><strong>04</strong><span>personagens para escolher</span></div>
            <div><strong><?= $partidas !== null ? number_format($partidas, 0, ',', '.') : '—' ?></strong><span>partidas registradas no banco atual</span></div>
        </div>

        <section id="historia" class="company-section">
            <div class="section-heading"><p class="company-kicker">01 / QUEM SOMOS</p><h2>De uma ideia ao primeiro salto.</h2></div>
            <div class="story-grid">
                <div class="company-copy">
                    <p>A VORTEX nasceu em 2026, na imaginação de <strong><?= h($company['founder']) ?></strong>, um desenvolvedor apaixonado por jogos que queria transformar uma ideia simples em uma experiência difícil de largar.</p>
                    <p>O ponto de partida foi um jogo de pulo feito em sala de aula. O desafio era ir além: construir uma identidade, criar novos cenários e fazer cada tentativa ter algo a conquistar. Assim surgiu o <strong>Hero Jump</strong>.</p>
                    <p>Escolhemos o nome VORTEX porque um redemoinho sempre está em movimento. Para nós, ele representa o ciclo de criar, testar, ouvir e melhorar. Cada erro vira aprendizado. Cada partida abre espaço para a próxima ideia.</p>
                    <div class="story-quote">“Uma mecânica simples pode abrir um universo inteiro.”<span><?= h($company['founder']) ?> · fundador fictício</span></div>
                </div>
                <ol class="company-timeline">
                    <li><span>2026 · O COMEÇO</span><h3>Nasce a VORTEX</h3><p>Uma proposta: levar o espírito dos arcades para jogos de navegador.</p></li>
                    <li><span>PRIMEIRO PROJETO</span><h3>Hero Jump ganha forma</h3><p>O protótipo de pulo recebe nome, abertura própria e ranking persistente.</p></li>
                    <li><span>UM UNIVERSO MAIOR</span><h3>Quatro formas de entrar no jogo</h3><p>Pikachu, Bart, Sasuke e Sonic chegam com seus cenários e itens temáticos.</p></li>
                    <li><span>MAIS DESAFIO</span><h3>A partida acelera</h3><p>Velocidade progressiva e coletáveis animados dão ritmo a cada tentativa.</p></li>
                </ol>
            </div>
        </section>

        <section id="jogos" class="company-section">
            <div class="section-heading"><p class="company-kicker">02 / NOSSOS JOGOS</p><h2>Seu próximo recorde começa aqui.</h2><p>Para fãs de arcade que gostam de partidas rápidas, no computador ou no celular.</p></div>
            <article class="featured-game">
                <div class="game-art" role="img" aria-label="Cenário do Hero Jump com Pikachu e uma Pokébola como obstáculo">
                    <span class="game-tag">DISPONÍVEL AGORA</span>
                    <img class="game-art-hero" src="../assets/characters/pikachu.gif" alt="" loading="lazy">
                    <img class="game-art-obstacle" src="../assets/obstaculo-pikachu.png" alt="" loading="lazy">
                    <span class="game-art-title">HERO JUMP</span>
                </div>
                <div class="game-description"><p class="company-kicker">PULO · REFLEXO · SUPERAÇÃO</p><h3>Hero Jump</h3>
                    <p>Um salto separa você da próxima tentativa. Escolha seu herói, desvie dos obstáculos e colete itens que valem 50 pontos. Quanto mais tempo sobreviver, mais a partida acelera.</p>
                    <div class="live-record"><span>RECORDE DO RANKING ATUAL</span>
                    <?php if ($recorde): ?><strong><?= number_format((int)$recorde['pontos'], 0, ',', '.') ?> PTS</strong><small><?= h($recorde['nome']) ?></small>
                    <?php elseif ($partidas !== null): ?><strong>O primeiro pode ser seu.</strong><small>Ainda não há pontuações registradas.</small>
                    <?php else: ?><strong>Ranking indisponível agora.</strong><small>Tente consultar novamente mais tarde.</small><?php endif; ?>
                    </div>
                    <a class="company-button" href="../index.php">Jogar agora →</a>
                </div>
            </article>
            <div class="characters-heading"><h3>Quatro heróis. O seu próximo desafio.</h3><p>Os controles são os mesmos; cada personagem leva você a um cenário diferente.</p></div>
            <div class="character-roster">
                <?php foreach ($heroes as [$id,$nome,$descricao,$item]): ?>
                <article class="roster-card"><div class="roster-image"><img src="../assets/characters/<?= h($id) ?>.gif" alt="<?= h($nome) ?>" loading="lazy"></div><h4><?= h($nome) ?></h4><p><?= h($descricao) ?></p><span>COLETÁVEL / <?= h($item) ?></span></article>
                <?php endforeach; ?>
            </div>
            <article class="upcoming-game"><span class="upcoming-orbit" aria-hidden="true">◎</span><div><p class="company-kicker">NO NOSSO RADAR · CONCEITO FICTÍCIO</p><h3>Orbit Run</h3><p>Uma ideia para explorar reflexos entre órbitas e obstáculos espaciais. Ainda em planejamento, sem data de lançamento.</p></div><span class="status-pill">Em breve</span></article>
        </section>

        <section class="company-section" aria-labelledby="promises-title">
            <div class="section-heading"><p class="company-kicker">03 / COMO CRIAMOS</p><h2 id="promises-title">Diversão com respeito ao jogador.</h2></div>
            <div class="promise-grid">
                <article class="company-card"><span class="card-symbol" aria-hidden="true">01</span><h3>Entre e jogue</h3><p>Hero Jump é gratuito e não usa anúncios invasivos. O foco da tela é a sua partida.</p></article>
                <article class="company-card"><span class="card-symbol" aria-hidden="true">02</span><h3>Seus dados têm propósito</h3><p>O ranking mostra nome e pontuação. O e-mail do formulário fica fora das páginas públicas e é destinado ao contato.</p></article>
                <article class="company-card"><span class="card-symbol" aria-hidden="true">03</span><h3>Competição com respeito</h3><p>Nosso compromisso é valorizar a superação. Jogue sem manipular pontuações e respeite os outros participantes.</p></article>
            </div>
            <div class="technology-bar"><span>FEITO COM</span><?php foreach (['HTML'=>'&lt;/&gt;','CSS'=>'#','JavaScript'=>'JS','PHP'=>'php','MySQL'=>'SQL'] as $tech=>$icon): ?><span class="tech-badge"><b aria-hidden="true"><?= $icon ?></b><?= h($tech) ?></span><?php endforeach; ?></div>
            <div class="services-note"><h3>Também desenvolvemos ideias.</h3><p>Nosso universo inclui jogos para navegador, interfaces interativas, personalização de cenários e integração de rankings com banco de dados.</p></div>
        </section>

        <section id="equipe" class="company-section">
            <div class="section-heading"><p class="company-kicker">04 / GENTE QUE CRIA</p><h2>Uma ideia. Diferentes olhares.</h2><p>Equipe fictícia que representa as funções de um estúdio de jogos.</p></div>
            <div class="team-grid"><?php foreach ($team as [$name,$role,$quote,$initials]): ?><article class="team-card"><span class="team-avatar" aria-hidden="true"><?= h($initials) ?></span><h3><?= h($name) ?></h3><span class="team-role"><?= h($role) ?></span><p>“<?= h($quote) ?>”</p></article><?php endforeach; ?></div>
            <div class="testimonial-heading"><h3>Vozes do nosso universo</h3><span class="fiction-label">Depoimentos fictícios e ilustrativos</span></div>
            <div class="testimonial-grid"><blockquote>“Entrei para uma partida rápida. Saí querendo bater meu próprio recorde.”<cite>Júlia · fã de arcade</cite></blockquote><blockquote>“Trocar de personagem muda o clima do jogo. O desafio é saber a hora de pular.”<cite>Henrique · jogador de Hero Jump</cite></blockquote></div>
        </section>

        <section id="contato" class="company-section">
            <div class="section-heading"><p class="company-kicker">05 / CONTATO & COMUNIDADE</p><h2>A próxima ideia pode vir de você.</h2><p>Encontrou um problema? Quer sugerir um personagem? A conversa começa aqui.</p></div>
            <div class="contact-grid">
                <div class="contact-info">
                    <h3>Fale com a VORTEX</h3><p>Conte o que você jogou, o que sentiu e o que gostaria de encontrar na próxima versão.</p>
                    <div class="contact-channels"><span class="fiction-label">Canais ilustrativos do estúdio fictício</span>
                        <div><span>E-MAIL</span><strong><?= h($company['email']) ?></strong></div>
                        <div><span>INSTAGRAM</span><?php if (filter_var($company['instagram'], FILTER_VALIDATE_URL) && str_starts_with($company['instagram'], 'https://')): ?><a href="<?= h($company['instagram']) ?>" target="_blank" rel="noopener noreferrer"><?= h($company['instagram_label']) ?></a><?php else: ?><strong><?= h($company['instagram_label']) ?> · em preparação</strong><?php endif; ?></div>
                        <div><span>DISCORD</span><?php if (filter_var($company['discord'], FILTER_VALIDATE_URL) && str_starts_with($company['discord'], 'https://')): ?><a href="<?= h($company['discord']) ?>" target="_blank" rel="noopener noreferrer"><?= h($company['discord_label']) ?></a><?php else: ?><strong><?= h($company['discord_label']) ?> · em preparação</strong><?php endif; ?></div>
                    </div>
                    <aside class="careers-card"><p class="company-kicker">TRABALHE CONOSCO</p><h3>Você também cria mundos?</h3><p>Programação, arte, som ou testes: queremos conhecer suas ideias. No formulário, escolha “Trabalhe conosco” e conte o que gostaria de criar.</p><small>Chamada ilustrativa do estúdio fictício, sem vaga real anunciada.</small></aside>
                </div>
                <form id="contact-form" class="contact-form" action="../api/contato.php" method="post">
                    <input type="hidden" name="token" value="<?= h($contactToken) ?>">
                    <div class="form-honeypot" aria-hidden="true"><label>Website<input name="website" tabindex="-1" autocomplete="off"></label></div>
                    <div class="form-row"><label for="contact-name">Seu nome<input id="contact-name" name="nome" minlength="2" maxlength="80" autocomplete="name" required></label><label for="contact-email">Seu e-mail<input id="contact-email" name="email" type="email" maxlength="254" autocomplete="email" required></label></div>
                    <label for="contact-subject">Sobre o que vamos conversar?<select id="contact-subject" name="assunto" required><option value="">Escolha um assunto</option><option>Sugestão de personagem</option><option>Feedback do jogo</option><option>Problema técnico</option><option>Trabalhe conosco</option><option>Outro</option></select></label>
                    <label for="contact-message">Sua mensagem<textarea id="contact-message" name="mensagem" rows="5" minlength="10" maxlength="2000" placeholder="Conte sua ideia. Não inclua senhas ou dados sensíveis." required></textarea></label>
                    <label class="consent-label"><input type="checkbox" name="consentimento" required><span>Autorizo o uso do meu nome, e-mail e mensagem para este contato.</span></label>
                    <button type="submit" class="company-button">Registrar mensagem →</button>
                    <p class="form-note">O formulário registra a mensagem neste projeto. Não há envio automático de e-mail.</p>
                    <p id="contact-status" class="contact-status" role="status" aria-live="polite"></p>
                    <noscript>Ative o JavaScript para usar o formulário de contato.</noscript>
                </form>
            </div>
        </section>
        <section class="company-section faq-section" aria-labelledby="faq-title">
            <div class="section-heading"><p class="company-kicker">ANTES DO PRÓXIMO SALTO</p><h2 id="faq-title">Perguntas frequentes</h2></div>
            <details><summary>Como jogar Hero Jump?</summary><p>Na abertura, clique em Iniciar jogo, leia as instruções e escolha seu nome e personagem. Use Espaço, seta para cima ou toque no cenário para pular. Desvie dos obstáculos e colete itens.</p></details>
            <details><summary>Como entro no ranking?</summary><p>Ao terminar uma partida, seu nome e sua pontuação são salvos automaticamente quando o banco está disponível. As dez maiores pontuações aparecem no ranking. Colecionar itens acrescenta 50 pontos por coleta.</p></details>
            <details><summary>Como posso sugerir um personagem?</summary><p>Use o formulário acima e escolha “Sugestão de personagem”. Conte o nome, a ideia de cenário e qual seria o item coletável.</p></details>
            <details><summary>Posso jogar no celular? Preciso pagar?</summary><p>Sim. O jogo é gratuito e os controles aceitam toque no cenário. No computador, você também pode usar Espaço ou seta para cima.</p></details>
        </section>
    </main>
    <footer class="company-footer"><a class="company-wordmark" href="../index.php">VORTEX</a><p>Projeto acadêmico · empresa, equipe, depoimentos e próximos lançamentos fictícios.<br>Personagens e marcas de terceiros pertencem aos respectivos titulares.</p><a href="../index.php">Voltar ao jogo ↑</a></footer>
</div>
</body>
</html>
