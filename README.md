# Kanban Simples

Frontend em React e backend em FastAPI com SQLite local.

## Backend

1. Crie um ambiente virtual e instale as dependencias:
   `pip install -r backend/requirements.txt`
2. Copie `backend/.env.example` para `backend/.env`.
3. Defina `APP_USERNAME` e `APP_PASSWORD`.
4. Suba a API:
   `uvicorn app.main:app --reload --app-dir backend`

## Frontend

1. Instale as dependencias:
   `npm install --prefix frontend`
2. Se quiser outro endpoint:
   `VITE_API_URL=http://127.0.0.1:8000 npm run dev`
3. Rode:
   `npm run dev --prefix frontend`

## Docker

1. Copie `backend/.env.example` para `backend/.env`.
2. Suba tudo:
   `docker compose up --build`
3. Acesse:
   frontend em `http://localhost:5173`
   backend em `http://localhost:8000`

O banco SQLite fica persistido em `./backend/data/kanban.db`.

## Recursos

- Login com usuario/senha definidos no environment
- Namespaces em barra inferior com menu de contexto
- Tres colunas fixas: Do, Doing e Done
- Drag and drop nativo
- Sidebar de detalhes da atividade
- Tema neutro com suporte a dark mode
