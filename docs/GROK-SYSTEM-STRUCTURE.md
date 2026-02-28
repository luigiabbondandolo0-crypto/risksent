# RiskSent – Struttura informatica del sistema (per Bot Telegram)

Documento di riferimento per integrare un bot Telegram con RiskSent. Descrive stack, database, API, autenticazione e variabili d’ambiente.

---

## 1. Panoramica

- **Prodotto**: RiskSent – dashboard di risk per trader MT4/MT5.
- **URL produzione**: https://risksent.com
- **Deploy**: Next.js su Vercel; database e auth su Supabase.
- **Scopo**: Collegare account MetaTrader, visualizzare statistiche, regole di risk, simulatore challenge (FTMO/Simplified), alert e (futuro) feedback AI. Il bot Telegram dovrà interagire con le stesse entità (utenti, account, regole, alert) tramite API o backend dedicato.

---

## 2. Stack tecnologico

| Componente | Tecnologia |
|------------|------------|
| Frontend | Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS |
| Backend API | Next.js Route Handlers (`app/api/*/route.ts`) |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth (email/password) |
| Client Supabase (browser) | `@supabase/auth-helpers-nextjs` (createPagesBrowserClient) |
| Server Supabase (API) | `createRouteHandlerClient({ cookies })` da `@supabase/auth-helpers-nextjs` |
| Admin / bypass RLS | `createClient(url, serviceRoleKey)` in `lib/supabaseAdmin.ts` |
| Cifratura password account | Node `crypto` AES-256-GCM in `lib/encrypt.ts` |
| Dati trading (ordini/saldo) | API esterne MetaTrader (metatraderapi.dev) |

---

## 3. Variabili d’ambiente

Tutte da impostare in Vercel (e in `.env.local` in locale). **Mai** committare valori reali.

| Variabile | Obbligatoria | Uso |
|-----------|----------------|-----|
| `NEXT_PUBLIC_SUPABASE_URL` | Sì | URL progetto Supabase (pubblico) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Sì | Chiave anonima Supabase (frontend) |
| `SUPABASE_SERVICE_ROLE_KEY` | Sì | Chiave service role (solo server; admin e operazioni bypass RLS) |
| `METATRADERAPI_API_KEY` | Sì | API key per metatraderapi.dev (trades, account summary, register/delete account) |
| `ENCRYPTION_KEY` | Sì | Stringa ≥ 32 caratteri per cifrare le password investitore in DB |
| `TELEGRAM_BOT_TOKEN` | Sì (per alert) | Token da BotFather per il bot unico (es. @RiskSentAlertsBot) |
| `TELEGRAM_BOT_USERNAME` | No | Username del bot per il link (es. RiskSentAlertsBot); default RiskSentAlertsBot |
| `BOT_INTERNAL_SECRET` | No | Se impostato, POST /api/bot/send-alert richiede header `x-bot-secret` o body `secret` |
| `METATRADERAPI_UUID` | No | Eventuale UUID predefinito (citato in readme) |
| `DEBUG_ACCOUNTS` | No | Se `1`, le API accounts loggano in console |

Webhook Telegram: su BotFather impostare `/setwebhook` con URL `https://risksent.com/api/telegram-webhook`.

---

## 4. Autenticazione

- **Provider**: Supabase Auth.
- **Flusso**: Login/signup via email e password; sessione in cookie gestita da `@supabase/auth-helpers-nextjs`.
- **Verifica lato API**: ogni route protetta chiama `createSupabaseRouteClient()` e poi `supabase.auth.getUser()`. Se `authError || !user` si risponde con `401 Unauthorized`.
- **Middleware**: `middleware.ts` reindirizza a `/login` se la path è protetta e non c’è sessione. Path protette: `/dashboard`, `/rules`, `/trades`, `/simulator`, `/ai-coach`, `/add-account`, `/accounts`, `/admin`.
- **Identificativo utente**: `user.id` (UUID) da Supabase Auth = chiave primaria di `public.app_user` e riferimento in tutte le tabelle utente (trading_account, alert, insight).

Per il bot: o si associa un utente Telegram a un utente RiskSent (es. tramite `telegram_chat_id` in `app_user`) e si usa un backend che con il service role legge/scrive per quell’utente, oppure si espongono endpoint server-to-server protetti da API key che accettano un identificativo utente (es. `user_id` o `telegram_chat_id`).

---

## 5. Schema database (Supabase / PostgreSQL)

### 5.1 `auth.users` (Supabase Auth)
- Gestita da Supabase. Campi rilevanti: `id` (UUID), `email`, `created_at`, ecc.

### 5.2 `public.app_user`
- Un record per utente autenticato (creato dal trigger su `auth.users`).
- Colonne principali:
  - `id` uuid PK, riferimento `auth.users(id)` ON DELETE CASCADE
  - `created_at`, `updated_at` timestamptz
  - `daily_loss_pct` numeric(5,2) default 5.00  — limite perdita giornaliera %
  - `max_risk_per_trade_pct` numeric(5,2) default 1.00  — rischio max per trade %
  - `max_exposure_pct` numeric(5,2) default 6.00  — esposizione max %
  - `revenge_threshold_trades` integer default 3  — soglia “revenge trading”
  - `telegram_chat_id` text  — **campo per collegare l’utente al bot Telegram**
  - `role` text default 'customer' check (role in ('admin', 'trader', 'customer'))
- RLS: utente può leggere/aggiornare solo la propria riga (`auth.uid() = id`).

### 5.3 `public.trading_account`
- Un conto MT per riga; collegato a MetaAPI tramite `metaapi_account_id`.
- Colonne:
  - `id` uuid PK
  - `created_at`, `updated_at` timestamptz
  - `user_id` uuid NOT NULL → `app_user(id)` ON DELETE CASCADE
  - `broker_type` text check in ('MT4', 'MT5', 'cTrader', 'Tradelocker')
  - `account_number` text NOT NULL
  - `investor_password_encrypted` text NOT NULL  — password cifrata con `lib/encrypt`
  - `metaapi_account_id` text  — ID restituito da metatraderapi.dev
  - `account_name` text (opzionale)
  - unique (user_id, broker_type, account_number)
- RLS: utente vede/solo i propri account (`user_id = auth.uid()`).

### 5.4 `public.trade`
- Singoli trade (attualmente più usati da logica lato API che da inserimenti diretti; i dati “live” vengono da MetaAPI).
- Colonne: `id`, `created_at`, `account_id` → trading_account, `trade_date`, `asset`, `direction` ('LONG'|'SHORT'), `entry_price`, `exit_price`, `volume_lots`, `pl`, `sanity_score`, `sanity_explanation`.
- Indice: `(account_id, trade_date desc)`.
- RLS: accesso solo ai trade degli account dell’utente.

### 5.5 `public.alert`
- Alert per l’utente (es. da regole di risk o da futuro motore AI).
- Colonne: `id`, `created_at`, `user_id` → app_user, `message` text, `severity` ('medium'|'high'), `solution` text, `alert_date`, `read` boolean default false.
- RLS: `user_id = auth.uid()`.

### 5.6 `public.insight`
- Insight/testi per utente (futuro uso AI).
- Colonne: `id`, `created_at`, `user_id`, `content`, `insight_type`, `insight_date`.
- RLS: `user_id = auth.uid()`.

### 5.7 `public.telegram_link_token`
- Token one-time per collegare la chat Telegram all’utente (deep link /start TOKEN).
- Colonne: `token` uuid PK, `user_id` → app_user, `created_at`. RLS: l’utente può solo inserire con `user_id = auth.uid()`. Il webhook usa service role per leggere per token e cancellare dopo l’uso.

### 5.8 Trigger
- `on_auth_user_created`: dopo INSERT su `auth.users` inserisce una riga in `public.app_user` con `id = new.id` e `role = 'customer'` (on conflict do nothing).

---

## 6. API (Next.js Route Handlers)

Base URL in produzione: `https://risksent.com`. Tutte le API sotto richiedono **sessione Supabase valida** (cookie) tranne dove indicato. Il bot dovrà usare un meccanismo alternativo (es. API key + `user_id` o `telegram_chat_id`).

### 6.1 `GET /api/accounts`
- **Auth**: sessione utente.
- **Risposta**: `{ accounts: Array<{ id, broker_type, account_number, account_name, metaapi_account_id, created_at }> }`.
- Ordine: `created_at` desc. Usato da dashboard, simulator, add-account (lista account).

### 6.2 `DELETE /api/accounts/[id]`
- **Auth**: sessione utente.
- **Param**: `id` = UUID del `trading_account`.
- Comportamento: verifica che l’account sia dell’utente; opzionalmente chiama MetaAPI `DeleteAccount?id=...`; elimina la riga da `trading_account`.
- Risposta: `{ ok: true }` o errore 403/404/500.

### 6.3 `POST /api/add-account`
- **Auth**: sessione utente.
- **Body** (JSON): `brokerType` ('MT4'|'MT5'), `server`, `accountNumber`, `investorPassword` (o `password`), `name` (opzionale).
- Flusso: chiamata a MetaAPI `RegisterAccount` (GET con query params); poi inserimento in `trading_account` con password cifrata e `metaapi_account_id` restituito. Upsert su `app_user` per garantire che esista la riga.
- Risposta: `{ ok: true, message, accountId }` o `{ ok: false, message, problems }` con status 4xx/5xx.

### 6.4 `GET /api/trades`
- **Auth**: sessione utente.
- **Query**: `uuid` (opzionale) = `metaapi_account_id`. Se assente si usa il primo account dell’utente.
- Chiama MetaAPI: `ClosedOrders?id=...` e `AccountSummary?id=...`. Normalizza gli ordini in una lista di trade con `ticket`, `openTime`, `closeTime`, `type`, `symbol`, `lots`, `openPrice`, `closePrice`, `profit`, `comment`.
- Risposta: `{ trades: TradeRow[], currency: string, balance?: number }` o `{ error, trades: [] }`.

### 6.5 `GET /api/dashboard-stats`
- **Auth**: sessione utente.
- **Query**: `uuid` (opzionale) = `metaapi_account_id`.
- Chiama MetaAPI: `AccountSummary`, `ClosedOrders`. Calcola win rate, max drawdown, curva equity, daily stats, total profit, initial balance, balancePct, equityPct, avgRiskReward.
- Risposta: `{ balance, equity, currency, winRate, maxDd, highestDdPct, avgRiskReward, balancePct, equityPct, equityCurve, dailyStats, totalProfit, initialBalance, updatedAt }` o `{ error }`.

### 6.6 `GET /api/rules`
- **Auth**: sessione utente.
- Legge da `app_user` i campi: `daily_loss_pct`, `max_risk_per_trade_pct`, `max_exposure_pct`, `revenge_threshold_trades`, `telegram_chat_id`.
- Risposta: `{ daily_loss_pct, max_risk_per_trade_pct, max_exposure_pct, revenge_threshold_trades, telegram_chat_id }`. Se la riga non esiste (PGRST116) restituisce valori default (2, 1, 15, 2, null).

### 6.7 `PATCH /api/rules`
- **Auth**: sessione utente.
- **Body** (JSON): qualsiasi sottoinsieme di `daily_loss_pct`, `max_risk_per_trade_pct`, `max_exposure_pct`, `revenge_threshold_trades`, `telegram_chat_id` (numero o null/string per telegram).
- Aggiorna `app_user` e restituisce l’oggetto aggiornato (stessi campi di GET). Se la riga non esiste fa upsert con i valori inviati.

### 6.8 `GET /api/alerts`
- **Auth**: sessione utente.
- Risposta: `{ alerts: Array<{ id, message, severity, solution, alert_date, read }> }`, ordinati per `alert_date` desc, max 50. Usato dalla UI per mostrare alert.

### 6.9 `POST /api/alerts`
- **Auth**: sessione utente.
- **Body**: `{ message: string, severity?: 'medium' | 'high', solution?: string }`.
- Crea una riga in `alert` per l’utente corrente e invia l’alert su Telegram (se `telegram_chat_id` è impostato) tramite `sendAlertToTelegram`. Risposta: `{ alert: { id, message, severity, alert_date } }`.

### 6.10 `POST /api/bot/link-telegram`
- **Auth**: sessione utente.
- Crea un token one-time in `telegram_link_token` e restituisce il link per collegare la chat: `https://t.me/{TELEGRAM_BOT_USERNAME}?start={token}`. L’utente apre il link, invia /start; il webhook associa `chat_id` a `app_user.telegram_chat_id`. Risposta: `{ token, link, message }`.

### 6.11 `POST /api/telegram-webhook`
- **Auth**: nessuna (chiamato da Telegram).
- Riceve gli update del bot. Se `message.text` è `/start TOKEN`, cerca `telegram_link_token` per quel token, aggiorna `app_user.telegram_chat_id` con `message.chat.id`, elimina il token e invia messaggio di conferma. Impostare come webhook su BotFather.

### 6.12 `POST /api/bot/send-alert`
- **Auth**: opzionale `BOT_INTERNAL_SECRET` (header `x-bot-secret` o body `secret`). Se la variabile è impostata e il secret non coincide, 401.
- **Body**: `{ user_id, message, severity?, solution? }`. Invia l’alert su Telegram all’utente (legge `telegram_chat_id` da `app_user`). Usato da cron/backend per inviare alert senza creare riga in `alert`, o in combinazione con logica che crea l’alert altrove.

### 6.13 Admin (solo se email = admin)
- **GET /api/admin/users**: richiede utente loggato con `user.email === ADMIN_EMAIL` (hardcoded). Usa `createSupabaseAdmin()` per listare utenti Auth e join con `app_user` e conteggio account. Risposta: `{ users: Array<{ id, email, role, createdAt, accountsCount }> }`.
- **GET /api/admin/stats**: stesso check admin. Restituisce `{ users, tradingAccounts, trades }` (conteggi su app_user, trading_account, trade).

---

## 7. Servizio esterno: MetaAPI (metatraderapi.dev)

- **Base URL**: `https://api.metatraderapi.dev`.
- **Header**: `x-api-key: METATRADERAPI_API_KEY`, `Accept: application/json`.

Endpoint usati dall’app:

| Metodo | Endpoint | Uso |
|--------|----------|-----|
| GET | `/RegisterAccount?type=Metatrader 4|5&server=...&user=...&password=...&name=...` | Aggiunta account (add-account) |
| GET | `/DeleteAccount?id={metaapi_account_id}` | Rimozione account |
| GET | `/AccountSummary?id={metaapi_account_id}` | Saldo, equity, currency |
| GET | `/ClosedOrders?id={metaapi_account_id}` | Ordini chiusi (per trades e dashboard stats) |

L’app non espone queste chiavi al frontend; le chiamate sono solo lato server (Route Handlers). Il bot, se dovrà leggere trade/saldo, dovrà usare le stesse API interne (`/api/trades`, `/api/dashboard-stats`) con un meccanismo di autenticazione server-to-server, oppure riusare la stessa logica in un backend del bot con `METATRADERAPI_API_KEY` e `metaapi_account_id` letti da DB.

---

## 8. Struttura cartelle app (Next.js App Router)

```
app/
  layout.tsx          # Root layout
  page.tsx            # Landing / redirect
  login/page.tsx
  signup/page.tsx
  dashboard/page.tsx  # Dashboard principale (stats, pill regole)
  rules/page.tsx      # Regole risk + telegram_chat_id
  trades/page.tsx     # Lista trade (da /api/trades)
  simulator/page.tsx  # Simulator FTMO + Simplified
  ai-coach/page.tsx   # Placeholder AI coach
  add-account/page.tsx
  accounts/page.tsx   # Gestione account (lista, delete)
  admin/page.tsx      # Solo admin: utenti e statistiche
  api/
    accounts/route.ts
    accounts/[id]/route.ts  # DELETE
    add-account/route.ts   # POST
    trades/route.ts        # GET
    dashboard-stats/route.ts # GET
    rules/route.ts         # GET, PATCH
    alerts/route.ts        # GET
    admin/users/route.ts   # GET
    admin/stats/route.ts   # GET
  globals.css
components/
  AppShell.tsx
  Sidebar.tsx
  Topbar.tsx
lib/
  supabaseClient.ts   # Browser client
  supabaseServer.ts   # Route handler client (cookies)
  supabaseAdmin.ts    # Service role client
  encrypt.ts         # encrypt/decrypt password
middleware.ts        # Protezione path + redirect login
supabase/
  full-schema.sql
  schema.sql
  migrations/
  roles.sql
  accounts-and-admin.sql
```

---

## 9. Dati utili per il bot Telegram

- **Collegamento utente ↔ Telegram**: in `app_user.telegram_chat_id` si può salvare il chat_id di Telegram. Aggiornamento via `PATCH /api/rules` con body `{ telegram_chat_id: "123456789" }` (o null per scollegare). La pagina Rules espone già la possibilità di impostare questo valore.
- **Lettura regole**: `GET /api/rules` (con auth utente) restituisce le soglie e `telegram_chat_id`.
- **Alert**: tabella `alert` e `GET /api/alerts`; il bot può inviare messaggi quando vengono creati nuovi alert (creazione alert oggi è solo da backend/DB, non esposta in questa doc).
- **Account e trade**: l’utente è identificato da `user.id` (UUID). Per mostrare nel bot “i tuoi account” o “i tuoi ultimi trade” serve un backend che, dato `telegram_chat_id` (o user_id), chiami le stesse logiche di `/api/accounts`, `/api/trades`, `/api/dashboard-stats` con quel utente. Questo richiederà o un endpoint server-to-server protetto da API key che accetti `telegram_chat_id` o `user_id`, oppure un servizio bot che usi direttamente Supabase (con service role) e MetaAPI con le stesse chiavi.
- **Admin**: attualmente l’admin è identificato per email (`luigiabbondandolo0@gmail.com`). Per un bot admin si potrebbe introdurre un ruolo o un flag in `app_user` o una whitelist di telegram_chat_id admin.

---

## 10. Sicurezza e RLS

- Le policy RLS assicurano che ogni utente veda solo i propri dati (app_user, trading_account, trade, alert, insight).
- Le API usano la sessione (cookie) per ottenere `auth.uid()` e non espongono dati di altri utenti.
- Le password degli account MT sono salvate cifrate; la chiave `ENCRYPTION_KEY` deve restare solo sul server.
- Per il bot: non usare mai la chiave anonima Supabase con dati sensibili da fuori; usare un backend che usi service role o sessioni utente in modo controllato (es. link Telegram ↔ user_id una tantum, poi le chiamate sono per quel user_id).

---

## 11. Checklist integrazione Bot Telegram

- [ ] Definire come il bot conosce l’utente: link `telegram_chat_id` ↔ `app_user.id` (es. comando /link con token una tantum generato dalla webapp).
- [ ] Backend bot: chiamare `PATCH /api/rules` con sessione utente non è possibile da bot; servono endpoint server-to-server (es. `POST /api/bot/telegram-link`) che accettino API key + telegram_chat_id e aggiornino `app_user.telegram_chat_id` e magari restituiscano un token di associazione.
- [ ] Lettura dati per utente da bot: nuovo endpoint tipo `GET /api/bot/me?telegram_chat_id=...` con API key, che restituisca account, ultimi trade, regole, alert (opzionale uso service role in un microservizio bot invece di estendere Next.js).
- [ ] Invio notifiche: quando si creano alert (o eventi risk), un job che legge `app_user.telegram_chat_id` e invia messaggi via Bot API Telegram.
- [ ] Ambiente: token Bot Telegram, eventuale `BOT_API_KEY` per autenticare le richieste tra bot e RiskSent.

---

*Documento generato per supportare lo sviluppo del bot Telegram RiskSent. Ultima revisione: febbraio 2025.*
