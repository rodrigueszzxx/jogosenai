# Hero Jump

Jogo de pulo com ranking em MySQL, baseado no projeto **Mario Jump**. A mecânica é a mesma: digite seu nome, desvie dos obstáculos pulando e dispute o TOP 10. As diferenças são:

- **Tela inicial** com fundo animado (`assets/fundo-inicio.gif`), o nome do jogo, o recorde e o botão **Iniciar jogo**. Aparece ao entrar no site e ao clicar em **Voltar à tela inicial** no Game Over.
- **Velocidade progressiva** no estilo do Dino Runner do Chrome: o jogo começa em 1.0x e acelera continuamente até cerca de 2.17x (em ~2 minutos). A pontuação cresce junto com a velocidade. Os valores ficam no começo do `js/script.js` (`VELOCIDADE_INICIAL`, `VELOCIDADE_MAXIMA`, `ACELERACAO`).
- **Como jogar**: ao clicar em Iniciar jogo abre uma tela com as instruções e o botão OK, que leva para a escolha de nome e personagem.
- **4 personagens para escolher** na tela inicial (Pikachu, Bart, Sasuke e Sonic), cada um com o seu **cenário** e o seu **obstáculo**: ao escolher o personagem, o fundo e o obstáculo do jogo mudam junto.

## Tecnologias

HTML, CSS e JavaScript puro no front-end; PHP com PDO e MySQL no back-end.

## Como rodar (Laragon)

1. Copie a pasta do projeto para `C:\laragon\www\hero-jump`.
2. Inicie o Apache e o MySQL no Laragon.
3. Abra `http://localhost/hero-jump/` no navegador.

O banco `hero_jump` e a tabela `ranking` são criados automaticamente na primeira abertura (veja `conexao.php`; ajuste usuário e senha se o seu MySQL for diferente).

## Controles

- **Espaço**, **seta para cima** ou **clique/toque no cenário** para pular.

## Estrutura

| Arquivo | Função |
|---|---|
| `index.php` | Página principal, lista de personagens, tela de abertura, HUD, tabuleiro e modais |
| `js/script.js` | Lógica do jogo, escolha de personagem, colisão e chamadas ao ranking |
| `css/styles.css` | Visual, cenário em camadas, seleção de personagem e responsividade |
| `conexao.php` | Conexão com o MySQL e criação automática do banco e da tabela |
| `salvar_ranking.php` | Grava a pontuação e devolve o TOP 10 |
| `obter_ranking.php` | Devolve o TOP 10 |
| `assets/` | Cenários (`cenario-*`), obstáculos (`obstaculo-*`) e `characters/` |

## Como adicionar um personagem

1. Coloque o GIF do personagem em `assets/characters/` e, em `assets/`, a imagem de cenário e a do obstáculo (de preferência o obstáculo em PNG com fundo transparente e sem espaço em volta, para ele ficar apoiado no chão).
2. Em `index.php`, inclua um item na lista `$personagens`:

```php
['id' => 'meu-heroi', 'nome' => 'Meu Herói', 'run' => 'assets/characters/meu-heroi.gif', 'dead' => 'assets/characters/meu-heroi.gif', 'cenario' => 'assets/cenario-meu-heroi.jpg', 'obstaculo' => 'assets/obstaculo-meu-heroi.png'],
```

Pronto: o card aparece na tela de início e o JavaScript já usa as imagens. Se a lista passar de 4 personagens, ajuste `grid-template-columns` em `.character-select` no CSS.
