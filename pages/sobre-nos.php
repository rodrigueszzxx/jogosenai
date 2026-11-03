<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Sobre nós · VORTEX</title>
    <link rel="stylesheet" href="../css/styles.css?v=gem-run-3" />
  </head>
  <body>
    <main class="story">
      <a class="back" href="../index.php">← Voltar ao jogo</a
      ><img
        class="story-logo"
        src="../assets/brand/vortex.jpg"
        alt="Logotipo VORTEX"
      />
      <p class="eyebrow">PEQUENAS IDEIAS, GRANDES AVENTURAS</p>
      <h1>Uma nova jornada.</h1>
      <h2>A história da VORTEX</h2>
      <p>
        A VORTEX é uma empresa fictícia de jogos web criada em 2026 por Rafael
        Azevedo, fundador fictício apaixonado por aventuras de partidas rápidas.
        Nosso objetivo é transformar controles simples em experiências
        envolventes, acessíveis no computador e no celular.
      </p>
      <h2>Do Hero Jump ao Arcane Run</h2>
      <p>
        O projeto começou com uma corrida de obstáculos. Nesta nova versão do
        grupo, um mago de barba branca explora uma masmorra e alterna entre
        saltar ruínas e enfrentar o Rei do Lodo. Os avisos de transição e de
        ataques fazem parte do desafio: observar o cenário é tão importante
        quanto reagir.
      </p>
      <p>
        Arcane Run é o título provisório desta adaptação. O projeto está no
        repositório jogosenai e utiliza HTML, CSS, JavaScript, PHP e MySQL. A
        empresa e sua história são fictícias e fazem parte de um trabalho
        acadêmico.
      </p>
      <h2>Como jogar</h2>
      <p>
        Pule com Espaço, seta para cima ou toque no cenário. Durante o
        confronto, sobreviva por 20 segundos aos ataques do boss. Salte sobre o
        veneno baixo e permaneça no chão para evitar o alto. Os cristais valem
        30 pontos e cada confronto superado concede 300 pontos.
      </p>
      <p>
        O jogo oferece três vidas por partida, pausa manual e pausa automática
        ao sair da aba. A corrida e o vídeo continuam animados; o movimento
        reduzido afeta apenas os efeitos decorativos secundários. O ranking
        registra as dez maiores pontuações deste projeto.
      </p>
      <section id="requisitos">
        <h2>Requisitos do projeto</h2>
        <div class="requirements-wrap">
          <table>
            <caption>
              Requisitos da versão Arcane Run
            </caption>
            <thead>
              <tr>
                <th scope="col">Código</th>
                <th scope="col">Descrição</th>
                <th scope="col">Tipo</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <th scope="row">RF01</th>
                <td>Solicitar o nome do jogador antes da partida.</td>
                <td>Funcional</td>
              </tr>
              <tr>
                <th scope="row">RF02</th>
                <td>
                  Animar os quadros de corrida do mago com transparência e pés
                  alinhados.
                </td>
                <td>Funcional</td>
              </tr>
              <tr>
                <th scope="row">RF03</th>
                <td>
                  Permitir saltar com teclado e clique ou toque no cenário.
                </td>
                <td>Funcional</td>
              </tr>
              <tr>
                <th scope="row">RF04</th>
                <td>
                  Coletar gemas roxas, removê-las e acrescentar 30 pontos por
                  unidade.
                </td>
                <td>Funcional</td>
              </tr>
              <tr>
                <th scope="row">RF05</th>
                <td>
                  Apresentar três níveis de dificuldade e exibir o nível atual.
                </td>
                <td>Funcional</td>
              </tr>
              <tr>
                <th scope="row">RF06</th>
                <td>
                  Alternar travessias de 24 segundos com batalhas contra o boss.
                </td>
                <td>Funcional</td>
              </tr>
              <tr>
                <th scope="row">RF07</th>
                <td>
                  Avisar a mudança de etapa antes da entrada do boss e após o
                  confronto.
                </td>
                <td>Funcional</td>
              </tr>
              <tr>
                <th scope="row">RF08</th>
                <td>
                  Sinalizar visualmente e lançar ataques baixos e altos do boss.
                </td>
                <td>Funcional</td>
              </tr>
              <tr>
                <th scope="row">RF09</th>
                <td>
                  Superar o boss sobrevivendo por 20 segundos e receber 300
                  pontos, sem ataques do jogador.
                </td>
                <td>Funcional</td>
              </tr>
              <tr>
                <th scope="row">RF10</th>
                <td>
                  Controlar três vidas, colisões, proteção após dano e Game
                  Over.
                </td>
                <td>Funcional</td>
              </tr>
              <tr>
                <th scope="row">RF11</th>
                <td>
                  Atualizar pontos durante a partida e permitir reiniciar sem
                  recarregar a página.
                </td>
                <td>Funcional</td>
              </tr>
              <tr>
                <th scope="row">RF12</th>
                <td>
                  Salvar a pontuação em MySQL e consultar as dez maiores
                  pontuações.
                </td>
                <td>Funcional</td>
              </tr>
              <tr>
                <th scope="row">RF13</th>
                <td>
                  Pausar manualmente ou ao ocultar a aba, retomando por
                  confirmação do jogador.
                </td>
                <td>Funcional</td>
              </tr>
              <tr>
                <th scope="row">RF14</th>
                <td>
                  Oferecer música, sons de coleta e Game Over e controle de
                  áudio.
                </td>
                <td>Funcional</td>
              </tr>
              <tr>
                <th scope="row">RNF01</th>
                <td>Adaptar a interface para computador e celular.</td>
                <td>Não funcional</td>
              </tr>
              <tr>
                <th scope="row">RNF02</th>
                <td>
                  Reduzir efeitos decorativos opcionais sem congelar a corrida e
                  o vídeo.
                </td>
                <td>Não funcional</td>
              </tr>
              <tr>
                <th scope="row">RNF03</th>
                <td>Utilizar HTML, CSS, JavaScript, PHP e MySQL.</td>
                <td>Não funcional</td>
              </tr>
              <tr>
                <th scope="row">RNF04</th>
                <td>
                  Organizar sprites, vídeo, áudio e testes em pastas próprias.
                </td>
                <td>Não funcional</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </main>
  </body>
</html>
