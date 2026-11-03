# VORTEX · Arcane Run

Nova versão do jogo acadêmico, com um mago de roxo, masmorra em vídeo e fases alternadas de obstáculos e confronto. **Arcane Run é um título provisório.** A publicação continua em `rodrigueszzxx/jogosenai`, conforme solicitado.

## Jogar

1. Informe seu nome e entre na masmorra.
2. Na travessia, pule as pedras e colete cristais de 30 pontos.
3. Após 24 segundos ativos, o jogo muda para a batalha. Há um aviso três segundos antes e uma transição sem perigos de 2,4 segundos.
4. Contra o Rei do Lodo, pule os projéteis baixos e permaneça no chão contra os altos. Os ataques são anunciados com antecedência. O aviso de pulo considera a aproximação do projétil.
5. Lance feitiços para retirar vida do boss. A primeira batalha exige 12 acertos; as seguintes acrescentam dois, até 20. Há um intervalo de 0,8 segundo entre feitiços.
6. Derrotar o boss concede 300 pontos e inicia outra travessia. Não há limite de salas.

São três vidas por partida e 1,4 segundo de proteção após sofrer dano. O jogo também concede dez pontos por segundo ativo. Não há pontuação durante pausa ou transição. Os níveis mudam aos 20 e 45 segundos ativos; a velocidade dos obstáculos aumenta e os ataques do boss ficam mais frequentes nas salas seguintes.

| Ação                    | Computador                                  | Celular                         |
| ----------------------- | ------------------------------------------- | ------------------------------- |
| Pular                   | Espaço, seta para cima ou clique no cenário | Botão Pular ou toque no cenário |
| Feitiço, durante o boss | J ou X                                      | Botão Feitiço                   |
| Pausar                  | P, Esc ou botão Pausar                      | Botão Pausar                    |
| Continuar               | Botão Continuar                             | Botão Continuar                 |

Ao ocultar a aba, o jogo pausa automaticamente. O retorno exige Continuar, evitando uma retomada inesperada. O vídeo e o áudio também suspendem. O áudio começa após uma interação; a preferência de silêncio é salva. Com movimento reduzido, o vídeo permanece no pôster e a levitação visual fica estática, preservando os controles e as colisões.

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
- `assets/sprites/arcane-atlas.png`: folha transparente preparada a partir das referências fornecidas; seis poses de levitação, duas de feitiço, pedra, boss, veneno e magia.
- `assets/sprites/frames.json`: limites de cada sprite. O CSS exibe apenas o retângulo correspondente, com a base alinhada e sem fundos ou textos da referência.
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

| Caso                                                               | Resultado |
| ------------------------------------------------------------------ | --------- |
| Carregamento dos sprites, vídeo e interface sem rolagem horizontal | Aprovado  |
| Pedras, coleta com +30 e pulo com aterrissagem                     | Aprovado  |
| Aviso, transição, entrada do boss e retorno após vitória           | Aprovado  |
| Feitiço: preparação, lançamento, dano e derrota do boss            | Aprovado  |
| Veneno baixo atinge no chão e é evitado com salto                  | Aprovado  |
| Veneno alto passa sobre o mago no chão e atinge durante salto      | Aprovado  |
| Três vidas, Game Over e reinício com estado zerado                 | Aprovado  |
| Pausa manual e ao ocultar a aba, sem avanço de tempo/pontos        | Aprovado  |
| Atalho J e cenário estático com movimento reduzido                 | Aprovado  |

A verificação de sintaxe foi feita com PHP e Node. Também foi executada uma partida no navegador sem interceptar o JavaScript ou o ranking: as três colisões encerraram a rodada, a pontuação foi salva no MariaDB, apareceu no ranking e o reinício funcionou. O registro exclusivo de teste foi removido depois. Confira suas credenciais ao configurar o banco no computador de apresentação.
