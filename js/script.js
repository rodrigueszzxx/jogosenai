/**
 * Hero Jump - Lógica do Jogo e Integração com Ranking MySQL (Laragon)
 */

document.addEventListener('DOMContentLoaded', () => {
    // Elementos do Jogo
    const hero = document.querySelector('.hero');
    const pipe = document.querySelector('.pipe');
    const gameBoard = document.getElementById('game-board');
    const hudPlayerName = document.getElementById('hud-player-name');
    const scoreDisplay = document.getElementById('score-display');
    const speedDisplay = document.getElementById('speed-display');
    const jumpTip = document.getElementById('jump-tip');

    // Modais e Telas
    const startModal = document.getElementById('start-modal');
    const startForm = document.getElementById('start-form');
    const playerInput = document.getElementById('player-input');
    const btnViewRanking = document.getElementById('btn-view-ranking');
    const characterInputs = document.querySelectorAll('input[name="character"]');

    const gameoverModal = document.getElementById('gameover-modal');
    const finalScoreValue = document.getElementById('final-score-value');
    const saveStatusMsg = document.getElementById('save-status-msg');
    const rankingBody = document.getElementById('ranking-body');
    const btnRestart = document.getElementById('btn-restart');
    const btnChangePlayer = document.getElementById('btn-change-player');

    // ===== Sistema de velocidade (baseado no Dino Runner do Google/Chrome) =====
    // No Dino: a velocidade começa em 6, soma 0.001 a cada frame (60 FPS) e para em 13.
    // Aqui o 6 equivale à velocidade normal do obstáculo (1.0x) e o 13 a ~2.17x.
    // Para o jogo acelerar mais rápido/devagar, mexa em ACELERACAO; para limitar, em VELOCIDADE_MAXIMA.
    const VELOCIDADE_INICIAL = 6;
    const VELOCIDADE_MAXIMA = 13;
    const ACELERACAO = 0.001;           // somada a cada frame
    const FPS_REFERENCIA = 60;
    const PONTOS_POR_SEGUNDO_BASE = 10; // pontos/segundo na velocidade inicial (1 ponto a cada 100ms)

    // Variáveis de Estado
    let currentPlayer = '';
    let currentCharacter = null;
    let score = 0;
    let isPlaying = false;
    let gameLoop = null;
    let scoreLoop = null;
    let multiplicadorVelocidade = 1;    // 1 = velocidade inicial, ~2.17 = máxima
    let inicioPartida = 0;
    let pontosExatos = 0;
    let ultimoTickPontos = 0;
    let animacaoObstaculo = null;

    /**
     * Lê o personagem marcado na tela de início
     */
    function getSelectedCharacter() {
        const selected = document.querySelector('input[name="character"]:checked');
        if (!selected) return null;
        return {
            id: selected.value,
            name: selected.dataset.name,
            run: selected.dataset.run,
            dead: selected.dataset.dead,
            cenario: selected.dataset.cenario,
            obstaculo: selected.dataset.obstaculo
        };
    }

    /**
     * Mostra no jogo o personagem escolhido, com o cenário e o obstáculo dele
     */
    function showCharacterOnBoard() {
        if (!currentCharacter) return;
        hero.src = currentCharacter.run;
        pipe.src = currentCharacter.obstaculo;
        gameBoard.style.backgroundImage = `url('${currentCharacter.cenario}')`;
    }

    // Pré-carrega as imagens de "Game Over", cenário e obstáculo para a troca ser instantânea
    characterInputs.forEach((input) => {
        const imgDead = new Image();
        imgDead.src = input.dataset.dead;

        const imgCenario = new Image();
        imgCenario.src = input.dataset.cenario;

        const imgObstaculo = new Image();
        imgObstaculo.src = input.dataset.obstaculo;
    });

    // ===== Tela inicial: aparece ao entrar no site e ao voltar pelo botão do Game Over =====
    const splash = document.getElementById('splash-screen');
    const btnSplashPlay = document.getElementById('btn-splash-play');
    const btnHome = document.getElementById('btn-home');
    const splashRecord = document.getElementById('splash-record-text');

    const howtoModal = document.getElementById('howto-modal');
    const btnHowtoOk = document.getElementById('btn-howto-ok');

    // "Iniciar jogo" na tela inicial -> abre a tela "Como jogar"
    function irParaComoJogar() {
        if (!splash || !splash.classList.contains('active') || splash.classList.contains('leaving')) return;
        splash.classList.add('leaving');

        // Mostra o "Como jogar" por trás enquanto a tela inicial some
        howtoModal.classList.add('active');

        setTimeout(() => {
            splash.classList.remove('active', 'leaving');
            btnHowtoOk.focus();
        }, 400);
    }

    // "OK" no "Como jogar" -> segue para nome + personagem
    function confirmarComoJogar() {
        howtoModal.classList.remove('active');
        startModal.classList.add('active');
        playerInput.focus();
    }

    function abrirAbertura() {
        if (!splash) return;
        gameoverModal.classList.remove('active');
        howtoModal.classList.remove('active');
        startModal.classList.remove('active');
        resetElements();
        splash.classList.remove('leaving');
        splash.classList.add('active');
        if (btnSplashPlay) btnSplashPlay.focus();
    }

    /**
     * Atualiza o recorde mostrado na tela inicial com o 1º lugar do ranking
     */
    function atualizarRecorde(list) {
        if (!splashRecord || !list || list.length === 0) return;
        splashRecord.textContent = `${list[0].nome} - ${parseInt(list[0].pontos, 10)} PTS`;
    }

    if (splash) {
        if (btnSplashPlay) btnSplashPlay.addEventListener('click', irParaComoJogar);

        document.addEventListener('keydown', (e) => {
            if (!splash.classList.contains('active') || e.repeat) return;
            if (e.code === 'Enter' || e.code === 'Space' || e.key === ' ') {
                e.preventDefault();
                irParaComoJogar();
            }
        });
    }

    if (btnHowtoOk) {
        btnHowtoOk.addEventListener('click', confirmarComoJogar);
        // Segurar Enter não deve pular o "Como jogar" sem a pessoa ler
        btnHowtoOk.addEventListener('keydown', (e) => {
            if (e.repeat) e.preventDefault();
        });
    }

    if (btnHome) btnHome.addEventListener('click', abrirAbertura);

    // Recupera último nome utilizado caso exista
    const savedName = localStorage.getItem('hero_jump_player');
    if (savedName && playerInput) {
        playerInput.value = savedName;
    }

    // Recupera o último personagem escolhido caso exista
    const savedCharacter = localStorage.getItem('hero_jump_character');
    if (savedCharacter) {
        characterInputs.forEach((input) => {
            if (input.value === savedCharacter) {
                input.checked = true;
            }
        });
    }
    currentCharacter = getSelectedCharacter();
    showCharacterOnBoard();

    // Ao escolher outro personagem, mostra ele no cenário
    characterInputs.forEach((input) => {
        input.addEventListener('change', () => {
            currentCharacter = getSelectedCharacter();
            if (currentCharacter) {
                showCharacterOnBoard();
                localStorage.setItem('hero_jump_character', currentCharacter.id);
            }
        });
    });

    /**
     * Inicia uma nova rodada
     */
    function startGame() {
        // Limpa loops anteriores se existirem
        clearInterval(gameLoop);
        clearInterval(scoreLoop);

        // Reseta posições e visuais
        resetElements();

        isPlaying = true;
        score = 0;
        scoreDisplay.textContent = '0';
        hudPlayerName.textContent = currentPlayer || 'Jogador';

        // Ativa animações CSS do jogo
        gameBoard.classList.add('running');

        // Velocidade volta ao normal a cada partida
        inicioPartida = performance.now();
        multiplicadorVelocidade = 1;
        speedDisplay.textContent = '1.0x';
        animacaoObstaculo = obterAnimacaoDoObstaculo();

        // Loop de pontuação: 10 pts/s na velocidade inicial, e cresce junto com a velocidade (como a distância no Dino)
        pontosExatos = 0;
        ultimoTickPontos = performance.now();
        scoreLoop = setInterval(() => {
            if (!isPlaying) return;
            const agora = performance.now();
            const segundos = (agora - ultimoTickPontos) / 1000;
            ultimoTickPontos = agora;
            pontosExatos += PONTOS_POR_SEGUNDO_BASE * multiplicadorVelocidade * segundos;
            score = Math.floor(pontosExatos);
            scoreDisplay.textContent = score;
        }, 100);

        // Loop principal: acelera o jogo e checa colisão
        gameLoop = setInterval(() => {
            atualizarVelocidade();
            checkCollision();
        }, 10);
    }

    /**
     * Pega a animação CSS que move o obstáculo (para podermos acelerá-la sem "pulos")
     */
    function obterAnimacaoDoObstaculo() {
        if (typeof pipe.getAnimations !== 'function') return null;
        const animacoes = pipe.getAnimations();
        return animacoes.find((a) => a.animationName === 'pipe-animation') || animacoes[0] || null;
    }

    /**
     * Velocidade no estilo Dino: sobe com o tempo (60 "frames" por segundo) até o máximo.
     * Devolve um multiplicador: 1.0 = velocidade inicial.
     */
    function calcularMultiplicador(msDecorridos) {
        const frames = (msDecorridos / 1000) * FPS_REFERENCIA;
        const velocidade = Math.min(VELOCIDADE_INICIAL + ACELERACAO * frames, VELOCIDADE_MAXIMA);
        return velocidade / VELOCIDADE_INICIAL;
    }

    function atualizarVelocidade() {
        multiplicadorVelocidade = calcularMultiplicador(performance.now() - inicioPartida);

        // playbackRate muda a velocidade da animação mantendo a posição atual (sem saltos)
        if (animacaoObstaculo) {
            animacaoObstaculo.playbackRate = multiplicadorVelocidade;
        }

        const texto = multiplicadorVelocidade.toFixed(1) + 'x';
        if (speedDisplay.textContent !== texto) {
            speedDisplay.textContent = texto;
        }
    }


    function resetElements() {
        // Reseta obstáculo
        pipe.style.animation = '';
        pipe.style.left = '';

        // Reseta personagem
        if (currentCharacter) {
            hero.src = currentCharacter.run;
        }
        hero.style.animation = '';
        hero.style.bottom = '0px';
        hero.classList.remove('jump');

        if (jumpTip) {
            jumpTip.style.opacity = '1';
        }
    }

    function jump() {
        if (!isPlaying) return;
        if (hero.classList.contains('jump')) return;

        hero.classList.add('jump');

        if (jumpTip) {
            jumpTip.style.opacity = '0';
        }

        setTimeout(() => {
            hero.classList.remove('jump');
        }, 500);
    }

    function checkCollision() {
        if (!isPlaying) return;

        const pipePosition = pipe.offsetLeft;
        const heroPosition = +window.getComputedStyle(hero).bottom.replace('px', '');

        // Tolerância de colisão: quando o obstáculo está na faixa de contato com o personagem.
        // A altura que o herói precisa alcançar acompanha o tamanho do obstáculo (80% da altura dele).
        const alturaColisao = pipe.offsetHeight * 0.8;
        if (pipePosition <= 120 && pipePosition > 0 && heroPosition < alturaColisao) {
            triggerGameOver(pipePosition, heroPosition);
        }
    }

    function triggerGameOver(pipePosition, heroPosition) {
        isPlaying = false;
        clearInterval(gameLoop);
        clearInterval(scoreLoop);

        
        gameBoard.classList.remove('running');

        
        pipe.style.animation = 'none';
        pipe.style.left = `${pipePosition}px`;

        // Congela o personagem na altura exata e muda para a imagem de Game Over
        hero.style.animation = 'none';
        hero.style.bottom = `${heroPosition}px`;
        if (currentCharacter) {
            hero.src = currentCharacter.dead;
        }

        // Atualiza modal de Game Over
        finalScoreValue.textContent = score;
        saveStatusMsg.textContent = 'Salvando pontuação no banco...';
        saveStatusMsg.style.color = '#ffcc00';

        // Abre modal de Game Over
        gameoverModal.classList.add('active');

        // Salva a pontuação no banco MySQL via PHP
        saveScore(currentPlayer, score);
    }


    function saveScore(playerName, finalScore) {
        fetch('salvar_ranking.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                nome: playerName,
                pontos: finalScore
            })
        })
        .then(res => res.json())
        .then(data => {
            if (data.status === 'success') {
                saveStatusMsg.textContent = 'Pontuação registrada no banco!';
                saveStatusMsg.style.color = '#10b981';
                if (data.ranking) {
                    renderRanking(data.ranking, playerName, finalScore);
                }
            } else {
                saveStatusMsg.textContent = '⚠️ ' + (data.message || 'Erro ao registrar.');
                saveStatusMsg.style.color = '#ef4444';
            }
        })
        .catch(err => {
            console.error('Erro na requisição:', err);
            saveStatusMsg.textContent = '⚠️ Erro ao conectar ao servidor Laragon.';
            saveStatusMsg.style.color = '#ef4444';
        });
    }

    /**
     * Busca o ranking atualizado no banco
     */
    function fetchRanking() {
        fetch('obter_ranking.php')
            .then(res => res.json())
            .then(data => {
                if (data.status === 'success' && data.ranking) {
                    renderRanking(data.ranking);
                }
            })
            .catch(err => console.error('Erro ao buscar ranking:', err));
    }

    /**
     * Atualiza a tabela HTML do ranking
     */
    function renderRanking(list, highlightName = null, highlightScore = null) {
        atualizarRecorde(list);
        if (!rankingBody) return;
        rankingBody.innerHTML = '';

        if (!list || list.length === 0) {
            rankingBody.innerHTML = '<tr><td colspan="3" class="loading-cell">Nenhuma pontuação gravada ainda. Jogue para ser o 1º!</td></tr>';
            return;
        }

        let highlighted = false;

        list.forEach((item, index) => {
            const tr = document.createElement('tr');

            // Destaca a pontuação atual recém-salva se coincidir
            if (!highlighted && highlightName && item.nome === highlightName && parseInt(item.pontos, 10) === highlightScore) {
                tr.classList.add('highlight-current');
                highlighted = true;
            }

            let medal = `${index + 1}º`;
            if (index === 0) medal = '🥇 1º';
            else if (index === 1) medal = '🥈 2º';
            else if (index === 2) medal = '🥉 3º';

            tr.innerHTML = `
                <td class="ranking-pos">${medal}</td>
                <td><strong>${escapeHtml(item.nome)}</strong></td>
                <td>${parseInt(item.pontos, 10)} pts</td>
            `;

            rankingBody.appendChild(tr);
        });
    }

    /**
     * Função auxiliar para sanitizar strings no HTML
     */
    function escapeHtml(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    // Submit do Formulário de Início (INICIAR JOGO)
    startForm.addEventListener('submit', (e) => {
        e.preventDefault(); // Impede o recarregamento da página

        const nameValue = playerInput.value.trim();
        if (!nameValue) {
            playerInput.focus();
            return;
        }

        currentPlayer = nameValue;
        localStorage.setItem('hero_jump_player', currentPlayer);

        currentCharacter = getSelectedCharacter();
        if (currentCharacter) {
            localStorage.setItem('hero_jump_character', currentCharacter.id);
        }

        // Fecha tela de início e começa o jogo
        startModal.classList.remove('active');
        startGame();
    });

    // Botão "VER RANKING" na tela inicial
    btnViewRanking.addEventListener('click', () => {
        fetchRanking();
        finalScoreValue.textContent = '---';
        saveStatusMsg.textContent = '';
        startModal.classList.remove('active');
        gameoverModal.classList.add('active');
    });

    // Botão "JOGAR NOVAMENTE" no Game Over
    btnRestart.addEventListener('click', () => {
        gameoverModal.classList.remove('active');
        if (!currentPlayer) {
            startModal.classList.add('active');
            playerInput.focus();
        } else {
            startGame();
        }
    });

    // 4. Botão "TROCAR JOGADOR" no Game Over
    btnChangePlayer.addEventListener('click', () => {
        gameoverModal.classList.remove('active');
        resetElements();
        startModal.classList.add('active');
        playerInput.value = '';
        playerInput.focus();
    });

    // 5. Controle do Pulo por Teclado (Espaço ou Seta para Cima)
    document.addEventListener('keydown', (e) => {
        if (e.code === 'Space' || e.key === ' ' || e.code === 'ArrowUp') {
            if (isPlaying) {
                e.preventDefault();
                jump();
            }
        }
    });

    // 6. Controle do Pulo por clique/toque no cenário (como diz a dica na tela)
    gameBoard.addEventListener('pointerdown', (e) => {
        if (isPlaying) {
            e.preventDefault();
            jump();
        }
    });
});
