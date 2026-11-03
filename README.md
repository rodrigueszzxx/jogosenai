# VORTEX · Arcane Run

Nova versão do jogo acadêmico, com um mago de barba branca, masmorra em vídeo e fases alternadas de obstáculos e confronto. **Arcane Run é um título provisório.** A publicação continua em `rodrigueszzxx/jogosenai`, conforme solicitado.

## Jogar

1. Informe seu nome e entre na masmorra.
2. Na travessia, pule as pedras e colete cristais de 30 pontos.
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

Durante a partida, somente o cabeçalho (jogador, nível, vidas, pontos, som e pausa) e o jogo ocupam a tela. Não há título acima da área de jogo, indicador de etapa, barra de informações inferior, seção de jornada, ranking abaixo do jogo ou rodapé. A área se adapta à altura da janela, incluindo celular em paisagem. Os avisos escritos aparecem apenas nas trocas de etapa. As instruções ficam na abertura e no Sobre nós. O ranking está recolhido em **Ver ranking**, somente na tela de Game Over.

Ao ocultar a aba, o jogo pausa automaticamente. O retorno exige Continuar, evitando uma retomada inesperada. O vídeo e o áudio também suspendem. O áudio começa após uma interação; a preferência de silêncio é salva. Com movimento reduzido, o vídeo permanece no pôster e a animação visual do mago fica estática, preservando os controles e as colisões.

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
- `css/styles.css`: interface responsiva e exibição dos recortes.
- `assets/sprites/wizard-atlas.png`: cinco quadros transparentes do novo mago, preparados a partir da referência enviada.
- `assets/sprites/world-atlas.png`: folha reutilizada apenas nos recortes da pedra, boss e veneno. Os antigos quadros do mago roxo e de magia não possuem mais mapeamento nem uso no jogo.
- `assets/sprites/frames.json`: limites de cada sprite. O CSS exibe apenas o retângulo correspondente, com a base alinhada e sem fundos da referência. O novo mago possui âncora horizontal por quadro para evitar deslocamentos laterais entre as poses com e sem cajado.
- `assets/scenes/dungeon.mp4`: vídeo enviado, com recorte de bordas, codificação H.264 e sem a faixa sonora original. O cenário preenche a área do jogo por `object-fit: cover`, adaptando o enquadramento no celular.
- `assets/scenes/dungeon-poster.webp`: cenário estático para carregamento, pausa inicial e movimento reduzido.
- `assets/audio/`: música, coleta e Game Over reaproveitados da base.
- `assets/brand/`: logotipo da empresa fictícia VORTEX.
- `pages/sobre-nos.php`: história da empresa, história do jogo, instruções e tabela de requisitos atualizada.
- `php/`: conexão e endpoints de consulta/salvamento do ranking.
- `tests/`: testes de interface e combate em Chromium.

Os personagens, coletáveis, cenários e obstáculos da versão anterior, além do efeito e do áudio de evolução, foram retirados. A empresa e seu fundador são fictícios. Os sprites desta versão foram preparados a partir das imagens fornecidas com uma ferramenta de edição de imagem; não representam uma extração pixel a pixel das imagens originais.

## Testes

Com o servidor PHP já iniciado:

```sh
npm ci
npx playwright install chromium
npm test
```

O endereço padrão é `http://127.0.0.1:8000`; use `ARCANE_TEST_URL` para outro endereço. Opcionalmente, indique um Chromium instalado por `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`. O jogo não depende dessas ferramentas para funcionar.

Os testes expõem o estado somente na cópia do JavaScript interceptada pelo Playwright, sem adicionar controles de depuração ao jogo publicado. As respostas do ranking são simuladas nos testes de interface, evitando gravar partidas de teste no banco.

Validação realizada em Chromium nas larguras de 1280, 390 e 320 px:

| Caso                                                                     | Resultado |
| ------------------------------------------------------------------------ | --------- |
| Carregamento dos dois atlas e do vídeo                                   | Aprovado  |
| Apenas cabeçalho e jogo, sem rolagem da página                           | Aprovado  |
| Pedras, coleta com +30 e pulo com aterrissagem                           | Aprovado  |
| Avisos de transição e alternância entre obstáculos e boss                | Aprovado  |
| Boss permanece até completar 20 segundos ativos, sem disparos do jogador | Aprovado  |
| Sobrevivência por esquiva, +300 pontos e retorno à travessia             | Aprovado  |
| Veneno baixo evitado com salto e alto evitado permanecendo no chão       | Aprovado  |
| Três vidas, Game Over e reinício com estado zerado                       | Aprovado  |
| Pausa manual e ao ocultar a aba, sem avanço de tempo/pontos              | Aprovado  |
| Cenário estático com movimento reduzido                                  | Aprovado  |

A revisão visual também conferiu as telas de 1280 × 800, 390 × 844, 320 × 568 e 844 × 390, com o novo personagem inteiro e o jogo dentro da janela.

A verificação de sintaxe foi feita com PHP e Node. Também foi executada uma partida no navegador sem interceptar o JavaScript ou o ranking: as três colisões encerraram a rodada, a pontuação foi salva no MariaDB, apareceu no ranking e o reinício funcionou. O registro exclusivo de teste foi removido depois. Confira suas credenciais ao configurar o banco no computador de apresentação.
