# Deploy

Este arquivo separa o fluxo de deploy do fluxo de desenvolvimento local.

## Resumo

- backend: roda em container
- frontend: gerar arquivos estáticos e servir fora do Compose de desenvolvimento
- banco: PostgreSQL separado, com `DATABASE_URL` explícita no backend

## Backend

Build da imagem:

```bash
docker build -t kombao-backend ./backend
```

Execução exemplo:

```bash
docker run --rm \
  -p 8391:8000 \
  --env-file backend/.env \
  -e DATABASE_URL='postgresql+psycopg://admin:admin123kanban@seu-host:5432/kanban' \
  kombao-backend
```

Notas:

- o container expõe a aplicação em `8000`
- a porta pública sugerida aqui é `8391`, alinhada com o `docker-compose.yml`
- em produção, prefira colocar um proxy reverso na frente

## Frontend estático

Gere o build:

```bash
npm install --prefix frontend
VITE_API_URL=http://localhost:8391/api npm run build --prefix frontend
```

Os arquivos gerados ficam em `frontend/dist/`.

Opções simples para servir o diretório estático:

### 1. `npx serve`

```bash
npx serve frontend/dist -l 5679
```

### 2. `http-server`

```bash
npx http-server frontend/dist -p 5679
```

### 3. `python -m http.server`

```bash
cd frontend/dist
python3 -m http.server 5679
```

## Observações importantes

- o frontend precisa apontar para o backend com o prefixo `/api`
- para deploy real, ajuste `VITE_API_URL` para a URL pública correta do backend
- `frontend/Dockerfile.dev` é exclusivo para desenvolvimento com Vite
- `frontend/Dockerfile` é para build estático, não para manter um container de frontend em produção
