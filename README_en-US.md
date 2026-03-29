# Kombão

Dead simple self-hosted kanban, no cluttering no dates no cargo cult.

Side project that began with vibecoding and then I turned it into something I actually use on a daily basis.

## Current state
- After a few days of development, I lost interest in pushing it further.
- The app already does what it was created for (organizing basic tasks visually and across multiple workspaces)
- I never intended to implement dates, links, or heavy automations. I have ADHD and never managed to stick with productivity tools for long.

## Existing features
- authentication with a bootstrap user defined in `backend/.env`
- persistence for users and sessions in PostgreSQL
- mandatory password change on the bootstrap admin's first login
- authenticated user profile with immutable `username`, editable `display_name`, and optional email
- simple runtime migration in the backend to add `display_name` to existing databases
- namespaces with create, rename, and delete
- board with three operational columns: `To do`, `Doing`, and `Done`
- card creation, editing, deletion, and drag and drop
- activity details modal with a draft domain contract in the frontend
- local preferences for theme (`light`, `dark`, `system`), accent color, and description visibility
- authenticated layout refactored into semantic hooks in the frontend

Relevant limitations in the current state:

- there is no multi-user signup flow in the interface
- namespaces still cannot be shared between users
- namespace-level permissions have not been implemented yet
- activity history is still derived in the frontend, not persisted in the backend
- the backend still only persists the `do`, `doing`, and `done` states
- there are no automated tests in the repository

## Stack
- Frontend: React 18, TypeScript, and Vite
- Backend: FastAPI, SQLAlchemy, and Pydantic
- Database: PostgreSQL
- Local development: optional Docker Compose

## Repository structure

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

## Requirements

- Python 3.12 or compatible
- Node.js 22 or compatible
- npm
- PostgreSQL 17 locally or through Docker Compose

## Local run

### 1. Database

If you want to run it without Docker Compose, start a PostgreSQL instance and configure:

```bash
export DATABASE_URL=postgresql+psycopg://admin:admin123kanban@localhost:5847/kanban
```

### 2. Backend

Create a virtual environment and install dependencies:

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt
```

Create `backend/.env`:

```bash
cat <<'EOF' > backend/.env
APP_USERNAME=admin
APP_PASSWORD=admin
APP_EMAIL=
EOF
```

The backend reads this file from `backend/.env`.

Start the API:

```bash
uvicorn app.main:app --reload --app-dir backend
```

API available at `http://127.0.0.1:8000`.

### 3. Frontend

Install dependencies:

```bash
npm install --prefix frontend
```

Start the interface:

```bash
npm run dev --prefix frontend
```

Frontend available at `http://127.0.0.1:5173`.

To point it to another API:

```bash
VITE_API_URL=http://127.0.0.1:8000/api npm run dev --prefix frontend
```

## Run with Docker Compose

This flow is intended for local containerized development.

Make sure `backend/.env` exists and run:

```bash
docker compose up --build
```

Services:

- Frontend (Vite dev server): `http://localhost:5679`
- Backend: `http://localhost:8391`
- PostgreSQL: `localhost:5847`

PostgreSQL data is persisted in `backend/postgres/`.

Notes:

- the Compose `frontend` service uses `frontend/Dockerfile.dev`
- `frontend/Dockerfile` is for static builds, not for a permanent frontend deployment container
- deployment instructions are in `DEPLOY.md`

## Environment variables

### Backend

- `APP_USERNAME`: bootstrap admin username
- `APP_PASSWORD`: bootstrap admin initial password
- `APP_EMAIL`: optional bootstrap admin initial email
- `DATABASE_URL`: PostgreSQL connection string
- `DB_NAME`: database name used by `docker-compose.yml` when `DATABASE_URL` is not injected externally
- `DB_USER`: PostgreSQL user in `docker-compose.yml`
- `DB_PASSWORD`: PostgreSQL password in `docker-compose.yml`

### Frontend

- `VITE_API_URL`: backend base URL including the `/api` prefix

## Main endpoints

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

## Utility script

There is a script to reset the administrator password directly in the database (but you must remember the database password)

```bash
python3 scripts/reset_admin_password.py --password new-password
```

Example with additional options:

```bash
python3 scripts/reset_admin_password.py \
  --username admin \
  --password new-secure-password \
  --must-change-password
```

## Documentation and future ideas (I will not implement them now)

- [DEPLOY.md](DEPLOY.md): backend container deployment and static frontend hosting
- [docs/README.md](docs/README.md): documentation index
- [docs/CONTRATO.md](docs/CONTRATO.md): draft product and integration contract
- [docs/ESTRATEGIA.md](docs/ESTRATEGIA.md): incremental strategy based on the contract
