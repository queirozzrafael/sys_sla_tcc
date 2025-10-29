# TCC - Sistema Inteligente de Chamados

Protótipo de um sistema de chamados com priorização e classificação feita pela IA, desenvolvido para TCC.

## Estrutura do Projeto

* `/frontend`: O cliente (HTML, CSS, JS)
* `/backend`: O servidor (Node.js, Express, MySQL)
* `schema.sql`: O script para criação do banco de dados MySQL.

## Como Executar (Localmente)

### 1. Banco de Dados

1.  Tenha o MySQL Server instalado.
2.  Execute o script `schema.sql` (ex: no MySQL Workbench) para criar o banco `meu_tcc_db` e popular as tabelas.

### 2. Backend

1.  Navegue até a pasta: `cd backend`
2.  Instale as dependências: `npm install`
3.  Inicie o servidor: `node server.js`

### 3. Frontend

1.  Abra a pasta `frontend` no VS Code.
2.  Use a extensão "Live Server" e abra o `index.html`.