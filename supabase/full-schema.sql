-- RiskSent: full schema (run once in Supabase SQL Editor)
-- Fixes "Could not find the table 'public.trading_account'" by creating all tables and RLS.

-- 1) app_user (depends on auth.users)
create table if not exists public.app_user (
  id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  daily_loss_pct numeric(5,2) not null default 5.00,
  max_risk_per_trade_pct numeric(5,2) not null default 1.00,
  max_exposure_pct numeric(5,2) not null default 6.00,
  revenge_threshold_trades integer not null default 3,
  telegram_chat_id text,
  constraint daily_loss_pct_non_negative check (daily_loss_pct >= 0),
  constraint max_risk_per_trade_pct_non_negative check (max_risk_per_trade_pct >= 0),
  constraint max_exposure_pct_non_negative check (max_exposure_pct >= 0),
  constraint revenge_threshold_trades_positive check (revenge_threshold_trades >= 0)
);

alter table public.app_user add column if not exists role text not null default 'customer'
  check (role in ('admin', 'trader', 'customer'));

-- 2) trading_account (one MT account per row; UUID from MetatraderApi stored in metaapi_account_id)
create table if not exists public.trading_account (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  user_id uuid not null references public.app_user (id) on delete cascade,
  broker_type text not null check (broker_type in ('MT4', 'MT5', 'cTrader', 'Tradelocker')),
  account_number text not null,
  investor_password_encrypted text not null,
  metaapi_account_id text,
  unique (user_id, broker_type, account_number)
);

alter table public.trading_account add column if not exists account_name text;

-- 3) trade
create table if not exists public.trade (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  account_id uuid not null references public.trading_account (id) on delete cascade,
  trade_date timestamptz not null,
  asset text not null,
  direction text not null check (direction in ('LONG', 'SHORT')),
  entry_price numeric(18,6) not null,
  exit_price numeric(18,6),
  volume_lots numeric(18,4) not null,
  pl numeric(18,4),
  sanity_score text,
  sanity_explanation text
);

create index if not exists idx_trade_account_date on public.trade (account_id, trade_date desc);

-- 4) alert
create table if not exists public.alert (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  user_id uuid not null references public.app_user (id) on delete cascade,
  message text not null,
  severity text not null check (severity in ('medium', 'high')),
  solution text,
  alert_date timestamptz not null default now(),
  read boolean not null default false
);

create index if not exists idx_alert_user_date on public.alert (user_id, alert_date desc);

-- 5) insight
create table if not exists public.insight (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  user_id uuid not null references public.app_user (id) on delete cascade,
  content text not null,
  insight_type text not null,
  insight_date timestamptz not null default now()
);

create index if not exists idx_insight_user_date on public.insight (user_id, insight_date desc);

-- 5b) telegram_link_token (one-time token per collegare chat Telegram)
create table if not exists public.telegram_link_token (
  token uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.app_user (id) on delete cascade,
  created_at timestamptz not null default now()
);
create index if not exists idx_telegram_link_token_user_created on public.telegram_link_token (user_id, created_at desc);
alter table public.telegram_link_token enable row level security;
drop policy if exists "Users can create link token for themselves" on public.telegram_link_token;
create policy "Users can create link token for themselves" on public.telegram_link_token for insert with check (user_id = auth.uid());

-- 6) RLS
alter table public.app_user enable row level security;
alter table public.trading_account enable row level security;
alter table public.trade enable row level security;
alter table public.alert enable row level security;
alter table public.insight enable row level security;

drop policy if exists "Users can access their own profile" on public.app_user;
create policy "Users can access their own profile" on public.app_user for all using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "Users can access their own accounts" on public.trading_account;
create policy "Users can access their own accounts" on public.trading_account for all using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "Users can access their own trades" on public.trade;
create policy "Users can access their own trades" on public.trade for all
  using (account_id in (select id from public.trading_account where user_id = auth.uid()))
  with check (account_id in (select id from public.trading_account where user_id = auth.uid()));

drop policy if exists "Users can access their own alerts" on public.alert;
create policy "Users can access their own alerts" on public.alert for all using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "Users can access their own insights" on public.insight;
create policy "Users can access their own insights" on public.insight for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- 7) Trigger: create app_user on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.app_user (id, role) values (new.id, 'customer')
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- 8) Optional: set admin role for your email (run after first login so app_user row exists)
-- update public.app_user set role = 'admin' where id = (select id from auth.users where email = 'luigiabbondandolo0@gmail.com');
