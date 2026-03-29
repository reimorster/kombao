# Kombão

Dead simple self-hosted kanban, no cluttering no dates no cargo cult.

Side project that began with vibecoding and then I turned it into something I actually use on a daily basis.

## Estado atual
- Depois uns dias de desenvolvimento, não tive mais interesse em prosseguir.
- O aplicativo já me atende para o que foi criado (organizar as tarefas basicas de forma visual e em vários workspaces)
- Nunca pretendi implementar datas, vinculações ou automações severas. Tenho tdah e nunca consegui usar ferramentas de produtividade por muito tempo.


## Recursos existentes
- autenticação com usuário bootstrap definido em `backend/.env`
- persistência de usuários e sessões em PostgreSQL
- troca obrigatória de senha no primeiro login do administrador bootstrap
- perfil do usuário autenticado com `username` imutável, `display_name` editável e e-mail opcional
- migration runtime simples no backend para adicionar `display_name` em bases já existentes
- namespaces com criação, renomeação e exclusão
- board com três colunas operacionais: `To do`, `Doing` e `Done`
- criação, edição, exclusão e drag and drop de cards
- modal de detalhes da atividade com contrato draft de domínio no frontend
- preferências locais de tema (`light`, `dark`, `system`), cor principal e exibição de descrições
- layout autenticado refatorado em hooks semânticos no frontend

Limitações relevantes no estado atual:

- não existe cadastro de múltiplos usuários pela interface
- namespaces ainda não são compartilháveis entre usuários
- permissões por namespace ainda não foram implementadas
- histórico de atividades ainda é derivado no frontend, não persistido no backend
- o backend ainda persiste apenas os estados `do`, `doing` e `done`
- não existem testes automatizados no repositório

## Stack
- Frontend: React 18, TypeScript e Vite
- Backend: FastAPI, SQLAlchemy e Pydantic
- Banco de dados: PostgreSQL
- Desenvolvimento local: Docker Compose opcional

## Estrutura do repositório

```text
.
|-- README.md
|-- README_en-US.md
|-- DEPLOY.md
|-- docker-compose.yml
|-- backend/
|   |-- app/
|   |   |-- auth.py
|   |   |-- database.py
|   |   |-- main.py
|   |   |-- migrations.py
|   |   |-- models.py
|   |   `-- schemas.py
|   |-- requirements.txt
|   `-- Dockerfile
|-- frontend/
|   |-- src/
|   |   |-- components/
|   |   |-- constants/
|   |   |-- hooks/
|   |   |-- types/
|   |   |-- utils/
|   |   |-- App.tsx
|   |   |-- main.tsx
|   |   `-- styles.css
|   |-- package.json
|   |-- Dockerfile
|   `-- Dockerfile.dev
|-- docs/
|   |-- CONTRATO.md
|   |-- ESTRATEGIA.md
|   `-- README.md
`-- scripts/
    `-- reset_admin_password.py
```

## Requisitos

- Python 3.12 ou compatível
- Node.js 22 ou compatível
- npm
- PostgreSQL 17 local ou via Docker Compose

## Execução local

### 1. Banco

Se for rodar sem Docker Compose, suba um PostgreSQL e configure:

```bash
export DATABASE_URL=postgresql+psycopg://admin:admin123kanban@localhost:5847/kanban
```

### 2. Backend

Crie um ambiente virtual e instale as dependências:

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt
```

Crie `backend/.env`:

```bash
cat <<'EOF' > backend/.env
APP_USERNAME=admin
APP_PASSWORD=admin
APP_EMAIL=
EOF
```

O backend lê esse arquivo em `backend/.env`.

Suba a API:

```bash
uvicorn app.main:app --reload --app-dir backend
```

API disponível em `http://127.0.0.1:8000`.

### 3. Frontend

Instale as dependências:

```bash
npm install --prefix frontend
```

Suba a interface:

```bash
npm run dev --prefix frontend
```

Frontend disponível em `http://127.0.0.1:5173`.

Para apontar para outra API:

```bash
VITE_API_URL=http://127.0.0.1:8000/api npm run dev --prefix frontend
```

## Execução com Docker Compose

Este fluxo é voltado para desenvolvimento local com containers.

Garanta que `backend/.env` exista e rode:

```bash
docker compose up --build
```

Serviços:

- Frontend (Vite dev server): `http://localhost:5679`
- Backend: `http://localhost:8391`
- PostgreSQL: `localhost:5847`

O PostgreSQL fica persistido em `backend/postgres/`.

Notas:

- o serviço `frontend` do Compose usa `frontend/Dockerfile.dev`
- `frontend/Dockerfile` é para build estático, não para rodar o frontend de deploy como container permanente
- instruções de deploy estão em `DEPLOY.md`

## Variáveis de ambiente

### Backend

- `APP_USERNAME`: username do administrador bootstrap
- `APP_PASSWORD`: senha inicial do administrador bootstrap
- `APP_EMAIL`: e-mail inicial opcional do administrador bootstrap
- `DATABASE_URL`: conexão com PostgreSQL
- `DB_NAME`: nome do banco usado no `docker-compose.yml` quando `DATABASE_URL` não for montada externamente
- `DB_USER`: usuário do PostgreSQL no `docker-compose.yml`
- `DB_PASSWORD`: senha do PostgreSQL no `docker-compose.yml`

### Frontend

- `VITE_API_URL`: URL base do backend já com prefixo `/api`

## Endpoints principais

- `POST api/auth/login`
- `GET api/auth/me`
- `PATCH api/auth/me`
- `POST api/auth/change-password`
- `GET api/health`
- `GET api/namespaces`
- `POST api/namespaces`
- `PATCH api/namespaces/{namespace_id}`
- `DELETE api/namespaces/{namespace_id}`
- `POST api/namespaces/{namespace_id}/cards`
- `PATCH api/cards/{card_id}`
- `DELETE api/cards/{card_id}`

## Script utilitário

Existe um script para resetar a senha do administrador diretamente no banco (mas voce deve lembrar a senha do banco)

```bash
python3 scripts/reset_admin_password.py --password nova-senha
```

Exemplo com opções adicionais:

```bash
python3 scripts/reset_admin_password.py \
  --username admin \
  --password nova-senha-segura \
  --must-change-password
```

## Documentação e ideias futuras (não implementarei agora)

- [DEPLOY.md](DEPLOY.md): deploy do backend em container e frontend estático
- [docs/README.md](docs/README.md): índice da documentação
- [docs/CONTRATO.md](docs/CONTRATO.md): contrato draft de produto e integração
- [docs/ESTRATEGIA.md](docs/ESTRATEGIA.md): estratégia incremental baseada no contrato
