# Python backend (FastAPI + SQLite + SQLAlchemy)

## Prereqs

- Python 3.12+
- Poetry (`poetry --version`)

## Install (Poetry)

```bash
cd backend
poetry install
```

## Run (dev)

Runs on `http://localhost:3001` to match the Vite proxy in `vite.config.ts`.

```bash
poetry run uvicorn app.main:app --reload --port 3001
```

## Run (production, single server)

Build the frontend into `dist/` (from repo root), then run the Python server; it will serve `dist/index.html` for all non-`/api` routes.

```bash
cd ..
npm run build
cd backend
poetry run uvicorn app.main:app --host 0.0.0.0 --port 3001
```

## Notes

- SQLite DB file: `backend/app.db` (ignored by git).
- Env is loaded from `.env.local` / `.env` in the repo root. You can override DB via `DATABASE_URL`.
