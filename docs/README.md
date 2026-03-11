# Kanban

Aplicacao de kanban simples com frontend em React + Vite, backend em FastAPI e persistencia local em PostgreSQL.

## Estado atual

O sistema implementado hoje cobre o fluxo basico de quadro kanban:

- bootstrap de administrador a partir de variaveis de ambiente no primeiro acesso
- usuarios e sessoes persistidos em PostgreSQL
- troca obrigatoria de senha no primeiro login do administrador bootstrap
- namespaces para separar projetos
- tres colunas fixas no quadro: `To do`, `Doing` e `Done`
- criacao, edicao, exclusao e movimentacao de cards
- painel lateral para editar detalhes da atividade
- tema `light`, `dark` e `system`

## Stack

- Frontend: React 18 + TypeScript + Vite
- Backend: FastAPI + SQLAlchemy
- Banco de dados: PostgreSQL
- Infra local: Docker Compose opcional

## Documentacao

- [README.md](/Users/reimor/kanban/README.md): fotografia do sistema atual e instrucoes de execucao
- [CONTRATO.md](/Users/reimor/kanban/CONTRATO.md): contrato funcional draft e plano de evolucao
- [ESTRATEGIA.md](/Users/reimor/kanban/ESTRATEGIA.md): ordem de execucao para as proximas fases

## Estrutura do repositorio

```text
.
|-- backend/
|   |-- app/
|   |   |-- auth.py
|   |   |-- database.py
|   |   |-- main.py
|   |   |-- models.py
|   |   `-- schemas.py
|   |-- data/
|   |-- requirements.txt
|   `-- Dockerfile
|-- frontend/
|   |-- src/
|   |   |-- components/
|   |   |-- constants/
|   |   |-- types/
|   |   |-- utils/
|   |   |-- App.tsx
|   |   |-- main.tsx
|   |   `-- styles.css
|   |-- package.json
|   `-- Dockerfile
|-- CONTRATO.md
`-- docker-compose.yml
```

## Requisitos

- Python 3.12 ou compativel
- Node.js 22 ou compativel
- npm

## Executando localmente

### 1. Backend

Crie um ambiente virtual e instale as dependencias:

```bash
python -m venv backend/.venv
source backend/.venv/bin/activate
pip install -r backend/requirements.txt
```

Crie o arquivo `backend/.env`:

```bash
cat <<'EOF' > backend/.env
APP_USERNAME=admin
APP_PASSWORD=admin
EOF
```

Suba a API:

```bash
uvicorn app.main:app --reload --app-dir backend
```

API disponivel em `http://127.0.0.1:8000`.

### 2. Frontend

Instale as dependencias:

```bash
npm install --prefix frontend
```

Suba a interface:

```bash
npm run dev --prefix frontend
```

Frontend disponivel em `http://127.0.0.1:5173`.

Para usar outro endpoint da API:

```bash
VITE_API_URL=http://127.0.0.1:8000 npm run dev --prefix frontend
```

## Executando com Docker

Garanta que `backend/.env` exista e depois rode:

```bash
docker compose up --build
```

Servicos:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:8000`
- PostgreSQL: `localhost:5432`

O PostgreSQL fica persistido localmente em `backend/postgres/`.

## Testes E2E com Playwright

Os testes end-to-end ficam em `e2e/` e foram desenhados para rodar em um container temporario, sem instalar Playwright localmente e sem adicionar servicos ao `docker-compose`.

Exemplo:

```bash
docker run --rm -it \
  --add-host=host.docker.internal:host-gateway \
  -e PLAYWRIGHT_BASE_URL=http://host.docker.internal:5173 \
  -e PLAYWRIGHT_USERNAME=admin \
  -e PLAYWRIGHT_PASSWORD=admin \
  -e PLAYWRIGHT_NEW_PASSWORD=admin12345 \
  -v "$PWD:/work" \
  -w /work/e2e \
  mcr.microsoft.com/playwright:v1.54.2-noble \
  bash -lc "npx -y @playwright/test test"
```

Mais detalhes em `e2e/README.md`.

## Variaveis de ambiente

### Backend

- `APP_USERNAME`: usuario aceito no login
- `APP_PASSWORD`: senha aceita no login
- `DATABASE_URL`: opcional; por padrao usa `postgresql+psycopg://kanban:kanban@localhost:5432/kanban`

### Frontend

- `VITE_API_URL`: URL base da API; por padrao `http://127.0.0.1:8000`

## Endpoints principais

- `POST /auth/login`
- `GET /auth/me`
- `POST /auth/change-password`
- `PATCH /auth/me`
- `GET /health`
- `GET /namespaces`
- `POST /namespaces`
- `PATCH /namespaces/{namespace_id}`
- `DELETE /namespaces/{namespace_id}`
- `POST /namespaces/{namespace_id}/cards`
- `PATCH /cards/{card_id}`
- `DELETE /cards/{card_id}`

## Notas de implementacao

- O backend cria um namespace inicial automaticamente quando o banco esta vazio.
- O ambiente de desenvolvimento assume PostgreSQL como unico banco suportado.
- O frontend recarrega a lista de namespaces apos a maior parte das alteracoes em cards.
- Ainda nao existem testes automatizados.
