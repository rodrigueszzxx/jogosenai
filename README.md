# VORTEX · Hero Jump

Jogo arcade em HTML, CSS, JavaScript, PHP e MySQL/MariaDB. Abra `index.php` por um servidor PHP com banco ativo. No Laragon, copie a pasta `jogosenai` para `www`, inicie os serviços e acesse o projeto pelo navegador.

- **Jogo:** `index.php`.
- **Sobre nós e contato:** `pages/sobre-nos.php`.
- **Configuração do banco:** `config/database.php` (preserve seus ajustes locais ao atualizar).
- **Fundador e contatos editáveis:** `config/company.php`.
- **API de ranking e contato:** `api/`.
- **SQL da estrutura:** `database/jogosenai.sql`.
- **Documentação:** `docs/README.md`.
- **Imagens:** `assets/`, com subpastas para marca, personagens e coletáveis.

O banco `hero_jump` e a tabela `ranking` são criados na primeira conexão; `mensagens_contato` é criada no primeiro envio válido do formulário. O SQL permite criar ambas manualmente. PHP precisa de PDO MySQL e mbstring.

A empresa, equipe, depoimentos e conceito de próximo jogo são fictícios. Os números de partidas e o recorde são consultados no banco atual, sem estatísticas inventadas. Os contatos iniciais são ilustrativos. O formulário grava em `mensagens_contato`; não envia e-mail. Consulte as mensagens pelo administrador local do MySQL. Não há painel público de leitura de mensagens.

Atualize a pasta inteira: os antigos endpoints da raiz foram movidos para `api/`. Não misture JavaScript antigo com esta estrutura nova. Credenciais podem ser configuradas em `config/database.php` ou nas variáveis DB_HOST, DB_PORT, DB_USER, DB_PASSWORD e DB_NAME.
