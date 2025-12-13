# Python backend (FastAPI + SQLite + SQLAlchemy)

## Prereqs

- Python 3.12+

## Install

```bash
python -m pip install -r backend/requirements.txt
```

## Run (dev)

Runs on `http://localhost:3001` to match the Vite proxy in `vite.config.ts`.

```bash
python -m uvicorn backend.app.main:app --reload --port 3001
```

## Notes

- SQLite DB file: `backend/app.db` (ignored by git).
- Env is loaded from `.env.local` / `.env` in the repo root. You can override DB via `DATABASE_URL`.

