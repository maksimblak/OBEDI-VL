<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1ZXOnH0tCap8945EdVxDQggFmkyXg1hVn

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Copy `.env.example` to `.env.local` and set env vars in `.env.local`:
   - `GEMINI_API_KEY=...` (required for AI features)
   - `EVOTOR_TOKEN=...` and `STORE_UUID=...` (optional, for Evotor menu sync)
   - `SMS_PROVIDER=console` (default) prints OTP codes to the API server console (dev)
   - `SMS_PROVIDER=smsru` + `SMS_RU_API_ID=...` to send real SMS via sms.ru
3. Run the API server (handles auth/orders/delivery and keeps keys off the client):
   `npm run api`
4. Run the app:
   `npm run dev`

Open: `http://localhost:3000` (API: `http://localhost:3001/api/health`).

### Production (single server)

1. Build: `npm run build`
2. Start API + static web: `npm start`
3. Open: `http://localhost:3001`
