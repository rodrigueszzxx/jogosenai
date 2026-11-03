# VORTEX · Beyond Jump

Nova versão do jogo acadêmico, com Mago e Pikachu selecionáveis, masmorra em vídeo e fases alternadas de obstáculos e confronto. O nome oficial do jogo é **Beyond Jump**. A publicação continua em `rodrigueszzxx/jogosenai`, conforme solicitado.

## Jogar

1. Na abertura, clique em Iniciar jogo, leia as instruções e informe seu nome. Escolha Mago ou Pikachu para entrar na masmorra.
2. Na travessia, pule as pedras e colete gemas com o Mago ou doces com o Pikachu. Cada item vale 30 pontos.
3. Após 24 segundos ativos, o jogo muda para o confronto. Há um aviso três segundos antes e uma transição sem perigos de 2,4 segundos.
4. Contra o Rei do Lodo, pule os projéteis baixos e permaneça no chão contra os altos. O brilho do boss e a faixa na trajetória sinalizam os ataques, sem dicas escritas durante a ação.
5. Sobreviva por **20 segundos ativos** para superar o boss. O jogador não dispara projéteis; não há feitiços, atalhos de ataque ou barra de vida do boss.
6. Superar o confronto concede 300 pontos e inicia outra travessia. Não há limite de salas.

São três vidas por partida e 1,4 segundo de proteção após sofrer dano. O jogo também concede dez pontos por segundo ativo. Não há pontuação durante pausa ou transição. Os níveis mudam aos 20 e 45 segundos ativos; a velocidade dos obstáculos aumenta e os ataques do boss ficam mais frequentes nas salas seguintes.

| Ação      | Computador                                  | Celular                   |
| --------- | ------------------------------------------- | ------------------------- |
| Pular     | Espaço, seta para cima ou clique no cenário | Toque no cenário          |
| Pausar    | P, Esc ou botão Pausar no cabeçalho         | Botão Pausar no cabeçalho |
| Continuar | Botão Continuar                             | Botão Continuar           |

Durante a partida, o cabeçalho compacto mostra jogador, nível, itens, vidas e pontos em uma barra como no Hero Jump. Os controles de som e pausa ficam discretos no canto superior. Não há título acima da área de jogo, indicador de etapa, barra de informações inferior, seção de jornada, ranking abaixo do jogo ou rodapé. O tabuleiro fica centralizado, com largura máxima de 900 px e altura de 420 px no computador ou 340 px no celular, limitada pela altura disponível na janela, incluindo paisagem. Os avisos escritos aparecem apenas nas trocas de etapa. As instruções ficam na abertura e no Sobre nós. A estrutura de telas segue o Hero Jump enviado: abertura com marca e recorde → Como jogar → nome e personagem → partida → Game Over com tabela Top 10. O ranking também pode ser consultado antes de iniciar, sem registrar uma pontuação. O Game Over reproduz o painel azul com borda lilás do Hero Jump: pontuação, status de gravação, tabela Top 10 com medalhas e destaque da rodada atual, além dos botões empilhados para jogar novamente, trocar jogador e voltar à abertura. O menu de pausa também oferece Voltar à tela inicial, encerrando a rodada em andamento e limpando obstáculos, projéteis e a evolução sem registrar uma pontuação de Game Over.

Ao ocultar a aba, o jogo pausa automaticamente. O retorno exige Continuar, evitando uma retomada inesperada. O vídeo e o áudio também suspendem. O áudio começa após uma interação; a preferência de silêncio é salva. A corrida e o vídeo permanecem animados durante a partida, inclusive quando o sistema indica movimento reduzido. Essa preferência reduz apenas efeitos decorativos secundários, como a oscilação do boss e as transições do CSS. A corrida usa os quadros 2 → 3 → 4 → 3, com 100 ms por quadro; as poses paradas foram retiradas do ciclo. Pausa, Game Over e aba oculta interrompem as animações.

## Evolução do Pikachu

Somente Pikachu libera a Pedra do Trovão ao atingir **1.500 pontos reais**. Alterar apenas o texto do placar não dispara a evolução. A pedra substitui os itens normais e pode aparecer tanto na travessia quanto no confronto, reaparecendo se passar sem ser coletada.

Coletar a pedra concede os mesmos 30 pontos de um item e inicia uma pausa de **1,2 segundo** com raios sobre a tela inteira e o som original da transformação. Aos 0,6 segundo, o sprite muda para Raichu. Pontuação, nível, cronômetro do boss, obstáculos, projéteis, itens, pulo e vídeo ficam congelados, retomando do mesmo ponto. A pausa manual ou por aba oculta também interrompe a evolução e exige Continuar para retomar.

Raichu utiliza os três PNGs da referência em sequência 1 → 2 → 3 → 2, com 100 ms por quadro. O tamanho preserva a proporção e os pés, e a hitbox permanece igual à dos outros personagens. Após evoluir, os doces retornam e a pedra deixa de aparecer. Reiniciar volta ao Pikachu, com zero pontos; trocar para Mago mantém sua corrida, gemas e regras anteriores.

Os recursos originais do Hero Jump foram reaproveitados diretamente: GIF do Pikachu, PNGs do Raichu, folhas de doce e pedra, quatro quadros de raios e áudio de evolução. Não foram restaurados Bart, Sasuke, Sonic ou o GIF antigo do Raichu, pois não fazem parte desta seleção.

## Executar localmente

PHP com PDO MySQL e mbstring, além de MySQL/MariaDB. Node é necessário somente para os testes automatizados.

No Laragon, coloque a pasta em `www/jogosenai`, inicie PHP e MySQL e acesse `http://localhost/jogosenai/`. Alternativamente, execute na raiz:

```sh
php -S 127.0.0.1:8000
```

Configure `php/conexao.php` ou as variáveis `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD` e `DB_NAME` no ambiente do servidor PHP. O padrão usa `localhost:3306`, usuário `root`, senha vazia e **banco `mario_final_grupo`**. Esse banco separa o ranking da nova aventura dos bancos anteriores `hero_jump` e `vortex`; nenhuma pontuação antiga é apagada. O usuário configurado precisa poder criar o banco e a tabela na primeira execução.

A estrutura `ranking` é criada automaticamente com `id`, `nome`, `pontos` e `data_registro`. O frontend continua jogável se o banco estiver indisponível e informa a falha ao consultar ou salvar o ranking. Não há sincronização posterior automática de uma pontuação que falhou ao salvar.

## Arquivos

- `index.php`: interface, controles, vídeo, HUD, telas e metadados dos sprites.
- `js/script.js`: relógio da partida, estados de travessia/boss/transição/pausa, física, colisões, animações, ataques, pontos e ranking.
- `js/audio.js`: música, efeitos e preferência de silêncio.
- `css/styles.css`: interface responsiva, cabeçalho compacto do Hero Jump e exibição dos recortes.
- `assets/fonts/`: fontes locais Poppins (400, 600 e 700) e Press Start 2P (400), iguais às da referência. As licenças SIL Open Font License estão junto aos arquivos; o site não depende de pedidos ao Google Fonts.
- `assets/sprites/wizard-atlas.png`: folha transparente do mago, com recortes individuais definidos em `frames.json`. Somente as poses de corrida compõem a animação durante a partida.
- `assets/sprites/purple-gem.png`: nova gema roxa com transparência; seu recorte e tamanho são calculados pelos limites do sprite. Ela substitui o cristal desenhado por CSS, mede aproximadamente 30 px no celular e 40 px no computador e mantém o valor de 30 pontos.
- `assets/sprites/world-atlas.png`: folha reutilizada apenas nos recortes da pedra, boss e veneno. Os antigos quadros do mago roxo e de magia não possuem mais mapeamento nem uso no jogo.
- `assets/sprites/frames.json`: limites de cada sprite. O CSS exibe apenas o retângulo correspondente, com a base alinhada e sem fundos da referência. O novo mago possui âncora horizontal por quadro para evitar deslocamentos laterais entre as poses com e sem cajado.
- `assets/scenes/dungeon.mp4`: vídeo enviado, com recorte de bordas, codificação H.264 e sem a faixa sonora original. O cenário preenche a área do jogo por `object-fit: cover`, adaptando o enquadramento no celular.
- `assets/scenes/dungeon-poster.webp`: imagem de espera enquanto o vídeo carrega. O vídeo é pré-carregado, reproduzido sem áudio e repetido continuamente durante a partida.
- `assets/characters/`: Pikachu e os três quadros de corrida do Raichu.
- `assets/collectibles/`: mapeamento e folhas animadas dos doces e da Pedra do Trovão.
- `assets/effects/`: os quatro JPGs originais dos raios, cujo preto é removido visualmente por mistura de cores no CSS.
- `assets/scenes/opening.gif`: GIF azul enviado para a abertura, igual ao original do Hero Jump. O fundo aparece sem o escurecimento forte da versão anterior; também é usado com baixa opacidade ao redor do tabuleiro.
- `assets/audio/`: música, coleta, Game Over e evolução reaproveitados da base.
- `assets/brand/`: logotipo da empresa fictícia VORTEX.
- `pages/sobre-nos.php`: história da empresa, história do jogo, instruções e tabela de requisitos atualizada.
- `php/`: conexão e endpoints de consulta/salvamento do ranking.
- `tests/`: testes de interface, combate, animação e evolução em Chromium.

A organização mantém `index.php`, `css/`, `js/`, `php/`, `pages/` e `assets/`, seguindo a referência. Foram recuperados apenas os recursos usados pelo Pikachu e sua evolução; os demais personagens antigos permanecem fora desta versão. A empresa e seu fundador são fictícios. Os sprites desta versão foram preparados a partir das imagens fornecidas com uma ferramenta de edição de imagem; não representam uma extração pixel a pixel das imagens originais.

## Testes

Com o servidor PHP já iniciado:

```sh
npm ci
npx playwright install chromium
npm test
```

O endereço padrão é `http://127.0.0.1:8000`; use `ARCANE_TEST_URL` para outro endereço. Opcionalmente, indique um Chromium instalado por `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`. O jogo não depende dessas ferramentas para funcionar.

Os testes expõem o estado somente na cópia do JavaScript interceptada pelo Playwright, sem adicionar controles de depuração ao jogo publicado. As respostas do ranking são simuladas nos testes de interface e evolução, evitando gravar partidas de teste no banco.

Validação realizada em Chromium nas larguras de 1280, 390 e 320 px:

| Caso                                                                              | Resultado |
| --------------------------------------------------------------------------------- | --------- |
| Abertura, instruções, nome, seleção, consulta ao ranking e retorno à tela inicial | Aprovado  |
| Pikachu coleta doces, libera pedra aos 1.500 pontos e evolui apenas ao coletar    | Aprovado  |
| Pedra perdida reaparece; Mago não evolui                                          | Aprovado  |
| Evolução congela boss, nível, pontos, itens e pulo; pausa manual congela os raios | Aprovado  |
| Raichu anima os três PNGs, reinício volta a Pikachu e troca preserva o Mago       | Aprovado  |
| Carregamento dos atlas, da gema e do vídeo                                        | Aprovado  |
| Apenas cabeçalho e jogo, sem rolagem da página                                    | Aprovado  |
| Pedras, coleta com +30 e pulo com aterrissagem                                    | Aprovado  |
| Avisos de transição e alternância entre obstáculos e boss                         | Aprovado  |
| Boss permanece até completar 20 segundos ativos, sem disparos do jogador          | Aprovado  |
| Sobrevivência por esquiva, +300 pontos e retorno à travessia                      | Aprovado  |
| Veneno baixo evitado com salto e alto evitado permanecendo no chão                | Aprovado  |
| Três vidas, Game Over e reinício com estado zerado                                | Aprovado  |
| Pausa manual e ao ocultar a aba, sem avanço de tempo/pontos                       | Aprovado  |
| Corrida e vídeo ativos mesmo com movimento reduzido                               | Aprovado  |

O teste `tests/animation.cjs` utiliza o script publicado e o relógio real do vídeo, sem injetar estado: confirma três poses distintas de corrida, avanço do tempo e de quadros decodificados do vídeo, mudança dos pixels do cenário, repetição do vídeo, nova gema e pausa/retomada. Foram verificados os modos normal e reduzido nas três larguras.

O teste `tests/evolution.cjs` verifica o fluxo do Hero Jump e a evolução durante um confronto em 1280, 390 e 320 px. Uma verificação adicional com relógio real confirmou a reprodução do áudio de evolução (4,032 s) e a retomada do vídeo em 1280 × 900, 390 × 844, 320 × 568 e 844 × 390.

A revisão visual também conferiu as telas de 1280 × 800, 390 × 844, 320 × 568 e 844 × 390, com o novo personagem inteiro e o jogo dentro da janela.

A verificação de sintaxe foi feita com PHP e Node. Também foi executada uma partida no navegador sem interceptar o JavaScript ou o ranking: as três colisões encerraram a rodada, a pontuação foi salva no MariaDB, apareceu no ranking e o reinício funcionou. O registro exclusivo de teste foi removido depois. Confira suas credenciais ao configurar o banco no computador de apresentação.
