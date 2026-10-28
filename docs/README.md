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

O banco `hero_jump` e a tabela `ranking` são criados automaticamente na primeira abertura (veja `config/database.php`; ajuste usuário e senha se o seu MySQL for diferente).

## Itens coletáveis

Durante a partida, aparecem itens associados ao personagem escolhido:

| Personagem | Item | Arquivo |
|---|---|---|
| Pikachu | Doce | `assets/collectibles/pikachu.png` |
| Bart | Lata | `assets/collectibles/bart.png` |
| Sasuke | Pergaminho | `assets/collectibles/sasuke.png` |
| Sonic | Anel | `assets/collectibles/sonic.gif` |

Pule para coletar. Cada item desaparece ao ser coletado e concede **50 pontos** extras, além dos pontos de sobrevivência. O painel mostra a quantidade de itens e o total de pontos em tempo real. Itens perdidos saem da tela sem penalidade. O bônus faz parte da pontuação final salva no ranking; uma nova rodada zera o contador.

Os PNGs usados no jogo estão recortados com transparência real em `assets/collectibles/`. O GIF animado do Sonic foi preservado. Todos os coletáveis ficam em `assets/collectibles/`; não há cópias na raiz. Os itens têm escala específica por formato e tamanhos menores no celular, sempre inferiores aos obstáculos. A largura real do CSS é usada pelo movimento e pela remoção do item. Para mudar o bônus, ajuste `PONTOS_POR_ITEM` em `js/script.js`.

## Controles

- **Espaço**, **seta para cima** ou **clique/toque no cenário** para pular.

## Estrutura

| Arquivo | Função |
|---|---|
| `index.php` | Página principal, lista de personagens, tela de abertura, HUD, tabuleiro e modais |
| `js/script.js` | Lógica do jogo, escolha de personagem, colisão e chamadas ao ranking |
| `css/styles.css` | Visual, cenário em camadas, seleção de personagem e responsividade |
| `config/database.php` | Conexão com o MySQL e criação automática do banco e da tabela |
| `api/salvar-ranking.php` | Grava a pontuação e devolve o TOP 10 |
| `api/obter-ranking.php` | Devolve o TOP 10 |
| `assets/` | Cenários (`cenario-*`), obstáculos (`obstaculo-*`) e `characters/` |

## Como adicionar um personagem

1. Coloque o GIF do personagem em `assets/characters/` e, em `assets/`, a imagem de cenário e a do obstáculo (de preferência o obstáculo em PNG com fundo transparente e sem espaço em volta, para ele ficar apoiado no chão).
2. Em `index.php`, inclua um item na lista `$personagens`:

```php
['id' => 'meu-heroi', 'nome' => 'Meu Herói', 'run' => 'assets/characters/meu-heroi.gif', 'dead' => 'assets/characters/meu-heroi.gif', 'cenario' => 'assets/cenario-meu-heroi.jpg', 'obstaculo' => 'assets/obstaculo-meu-heroi.png'],
```

Pronto: o card aparece na tela de início e o JavaScript já usa as imagens. Se a lista passar de 4 personagens, ajuste `grid-template-columns` em `.character-select` no CSS.

## Coletáveis animados e obstáculos

Doce, lata e pergaminho são exclusivamente coletáveis: valem 50 pontos e desaparecem ao serem coletados. Suas folhas animadas (12 quadros para Pikachu e Bart; 18 para Sasuke) ficam em `assets/collectibles/sprites/`. O mapeamento de quadros fica em `assets/collectibles/frames.json`. A folha original de Bart está em `assets/collectibles/originals/`; o jogo usa a versão com transparência. Sonic mantém seu anel animado em GIF.

Os obstáculos usam apenas as imagens `assets/obstaculo-*.png` e encerram a partida na colisão. Eles atravessam o cenário como antes, sem reproduzir as rotações dos coletáveis. A coleta e o fim da partida usam verificações separadas.

### Validação da correção

Testes no Chromium em 1280px e 390px, para os quatro personagens: referência correta ao obstáculo original, animação do coletável, coleta por pulo com bônus de 50 pontos, preservação do bônus, item perdido, colisão com obstáculo, ranking e reinício. A coleta foi isolada do obstáculo para verificar o bônus; depois, foi provocada colisão para validar Game Over. Os registros de teste foram removidos. Sintaxe PHP/JavaScript e integridade do ZIP verificadas.

## VORTEX — empresa e apresentação

`pages/sobre-nos.php` reúne história fictícia, linha do tempo, equipe, serviços, compromissos, tecnologias, personagens, conceito de próximo jogo, depoimentos ilustrativos, perguntas frequentes e contato. O nome inicial do fundador é Rafael Azevedo; altere-o em `config/company.php`. Os demais integrantes e seus textos estão na lista `team` do mesmo arquivo de configuração. A empresa e os depoimentos são explicitamente fictícios.

A contagem de partidas corresponde às linhas salvas em `ranking`, e o recorde é consultado no banco atual. Se o banco estiver indisponível, a página institucional permanece acessível e informa a indisponibilidade do ranking.

### Contato

- Ajuste os rótulos e URLs públicos em `config/company.php`.
- O e-mail inicial `contato@vortex.example` é ilustrativo; Instagram e Discord não geram links até receberem URLs HTTPS reais.
- O formulário chama `api/contato.php` e grava em `mensagens_contato`. Não há integração de e-mail, Instagram ou Discord.
- Consulte as mensagens no administrador local do MySQL, por exemplo com `SELECT id,nome,email,assunto,mensagem,data_registro FROM mensagens_contato ORDER BY id DESC;`. Não há endpoint público de leitura.
- Campos têm validação no navegador e no servidor. Há token por sessão, consentimento obrigatório, campo antispam e limite de um envio por sessão a cada 30 segundos. Esse limite básico não substitui proteção de infraestrutura em uma publicação pública.
- O PHP precisa de diretório de sessões configurado e gravável; Laragon normalmente fornece esse diretório. Na instalação local da nuvem ele fica fora do repositório.

### Organização

A raiz mantém `index.php` e o `README.md` de entrada. Páginas em `pages/`, endpoints em `api/`, configurações em `config/`, estrutura SQL em `database/` e documentação em `docs/`. CSS e JavaScript continuam nas pastas próprias. Atualize a pasta inteira; os endpoints antigos da raiz foram removidos.

### Validação da página e da reorganização

Chromium em 1280px, 390px e 320px: links, navegação por teclado, carregamento de imagens, ausência de rolagem horizontal, recorde consultado do banco, FAQ, contato persistido, limite de reenvio, preservação do texto em erro e partida com salvamento no novo endpoint. A API recusou token inválido (403), falta de consentimento, nome de tipo inválido e mensagem curta (422). Foram confirmadas três mensagens de teste no banco antes da limpeza. Coleta animada e coleta em GIF também passaram após a mudança de pastas. Dados temporários foram removidos. Sintaxe PHP/JavaScript verificada.
