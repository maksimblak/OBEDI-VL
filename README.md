<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1ZXOnH0tCap8945EdVxDQggFmkyXg1hVn

## Run Locally

**Prerequisites:** Node.js + Python 3.12+ + Poetry


1. Install dependencies:
   `npm install`
2. Copy `.env.example` to `.env.local` and set env vars in `.env.local`:
   - `GEMINI_API_KEY=...` (required for AI features)
   - `EVOTOR_CLOUD_TOKEN=...` (or legacy `EVOTOR_TOKEN=...`) and `STORE_UUID=...` (optional, for Evotor menu sync)
   - Optional: verify Evotor webhook calls to `POST /api/v1/user/token` via either:
     - `EVOTOR_WEBHOOK_AUTH_TOKEN=...` (token in `Authorization`, supports both raw and `Bearer ...`)
     - `EVOTOR_WEBHOOK_BASIC_USER=...` + `EVOTOR_WEBHOOK_BASIC_PASS=...` (Basic Auth)
   - Optional: `EVOTOR_TOKEN_STORE_PATH=...` (defaults to `./.evotor/tokens.json`) to persist received Evotor tokens per `userId`
   - `SMS_PROVIDER=console` (default) prints OTP codes to the API server console (dev)
   - `SMS_PROVIDER=smsru` + `SMS_RU_API_ID=...` to send real SMS via sms.ru
3. Run the API server (handles auth/orders/delivery and keeps keys off the client):
   - Python (FastAPI + SQLite + SQLAlchemy): `npm run api` (or `npm run api:py`)
   - Legacy Node (optional): `npm run api:node`
   - DB migrations are applied automatically on API start; if you already have an old `backend/app.db`, run `npm run db:migrate` once (it will stamp it as migrated).
4. Run the app:
   `npm run dev`

Open: `http://localhost:3000` (API: `http://localhost:3001/api/health`).

## Run with Docker (recommended if you hate multiple terminals)

**Dev (2 services: Vite + FastAPI):**

- `docker compose up --build`
- Open: `http://localhost:3000`

**Prod (1 service: Python serves `dist/`):**

- `docker compose -f docker-compose.prod.yml up --build`
- Open: `http://localhost:3001`

## Evotor token webhook + Cloud API proxy

- Webhook endpoint: `POST http://localhost:3001/api/v1/user/token` (deploy behind HTTPS as `https://<yourserver.ru>/api/v1/user/token`)
- Cloud API proxy endpoints (require the same `Authorization` header as the webhook if you configured webhook auth):
  - `GET http://localhost:3001/api/evotor/cloud/stores`
  - `GET http://localhost:3001/api/evotor/cloud/stores/<STORE_ID>/products?cursor=...&since=...`

### Production (single server)

1. Build: `npm run build`
2. Start API + static web (Python): `npm start` (legacy Node: `npm run start:node`)
3. Open: `http://localhost:3001`
