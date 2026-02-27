-- RiskSent core schema for Supabase (Postgres)
-- Run this in the Supabase SQL editor.

-- We reference auth.users as the identity source.

create table if not exists app_user (
  id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- risk rules
  daily_loss_pct numeric(5,2) not null default 5.00,
  max_risk_per_trade_pct numeric(5,2) not null default 1.00,
  max_exposure_pct numeric(5,2) not null default 6.00,
  revenge_threshold_trades integer not null default 3,

  -- integrations
  telegram_chat_id text,

  constraint daily_loss_pct_non_negative check (daily_loss_pct >= 0),
  constraint max_risk_per_trade_pct_non_negative check (max_risk_per_trade_pct >= 0),
  constraint max_exposure_pct_non_negative check (max_exposure_pct >= 0),
  constraint revenge_threshold_trades_positive check (revenge_threshold_trades >= 0)
);

create table if not exists trading_account (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  user_id uuid not null references app_user (id) on delete cascade,

  broker_type text not null check (broker_type in ('MT4', 'MT5', 'cTrader', 'Tradelocker')),
  account_number text not null,

  -- encrypted investor password; encryption is handled at application level
  investor_password_encrypted text not null,

  metaapi_account_id text, -- optional mapping to MetaApi account

  unique (user_id, broker_type, account_number)
);

create table if not exists trade (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),

  account_id uuid not null references trading_account (id) on delete cascade,

  trade_date timestamptz not null,
  asset text not null,
  direction text not null check (direction in ('LONG', 'SHORT')),
  entry_price numeric(18,6) not null,
  exit_price numeric(18,6),
  volume_lots numeric(18,4) not null,
  pl numeric(18,4), -- P/L in account currency

  -- optional sanity score fields
  sanity_score text, -- 'GREEN' | 'YELLOW' | 'RED'
  sanity_explanation text
);

create index if not exists idx_trade_account_date
  on trade (account_id, trade_date desc);

create table if not exists alert (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),

  user_id uuid not null references app_user (id) on delete cascade,

  message text not null,
  severity text not null check (severity in ('medium', 'high')),
  solution text,
  alert_date timestamptz not null default now(),
  read boolean not null default false
);

create index if not exists idx_alert_user_date
  on alert (user_id, alert_date desc);

create table if not exists insight (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),

  user_id uuid not null references app_user (id) on delete cascade,

  content text not null,
  insight_type text not null, -- e.g. 'weekly', 'pattern', 'sizing'
  insight_date timestamptz not null default now()
);

create index if not exists idx_insight_user_date
  on insight (user_id, insight_date desc);

-- Basic RLS setup (optional starter)
alter table app_user enable row level security;
alter table trading_account enable row level security;
alter table trade enable row level security;
alter table alert enable row level security;
alter table insight enable row level security;

create policy "Users can access their own profile"
  on app_user
  for all
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "Users can access their own accounts"
  on trading_account
  for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Users can access their own trades"
  on trade
  for all
  using (account_id in (
    select id from trading_account where user_id = auth.uid()
  ))
  with check (account_id in (
    select id from trading_account where user_id = auth.uid()
  ));

create policy "Users can access their own alerts"
  on alert
  for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Users can access their own insights"
  on insight
  for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

