RiskSent – trading risk dashboard
=================================

This repository contains the RiskSent web application, a minimal dark fintech dashboard for MT4/MT5/cTrader/Tradelocker traders.

## Tech stack

- Next.js (App Router, TypeScript)
- Tailwind CSS
- Supabase (auth + Postgres database)
- Deployed on Vercel

## Environment variables

All secrets (API keys, MetaApi credentials, Supabase keys, etc.) must be stored in environment variables and **never** committed to git.

Create a `.env.local` file (not committed) with values like:

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
METATRADERAPI_API_KEY=...
METATRADERAPI_UUID=...
ENCRYPTION_KEY=...   # 32+ chars for encrypting stored passwords
TELEGRAM_BOT_TOKEN=...   # Bot token from BotFather for alert notifications
TELEGRAM_BOT_USERNAME=... # e.g. RiskSentAlertsBot (for link in Collega Telegram)
TELEGRAM_ALERT_CHANNEL_ID=... # optional; channel chat_id (e.g. -1001234567890) to receive all alerts aggregated
BOT_INTERNAL_SECRET=...  # optional; if set, POST /api/bot/send-alert requires header x-bot-secret or body secret
CRON_SECRET=...          # optional; if set, GET/POST /api/cron/check-risk-all requires header x-cron-secret or ?secret=...
```
Set Telegram webhook to `https://your-domain.com/api/telegram-webhook` (BotFather: /setwebhook).

**Live risk alerts:** A Vercel Cron job calls `/api/cron/check-risk-all` every 2 minutes (`vercel.json`; requires Vercel Pro for sub-daily cron). Set `CRON_SECRET` in Vercel so only the cron invoker can call it.

Then, mirror these values in your Vercel project settings under **Environment Variables**.

## Getting started (local)

```bash
npm install
npm run dev
```

The app will be available at `http://localhost:3000`.

## Database

RiskSent uses Supabase (Postgres). Database schema lives under `supabase/schema.sql` and can be applied via the Supabase SQL editor.
