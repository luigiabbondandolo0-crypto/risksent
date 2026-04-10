-- Run in Supabase SQL editor (journal module)
-- Broker accounts connected by user
create table if not exists public.journal_account (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  nickname text not null,
  broker_server text not null,
  account_number text not null,
  account_password text not null,
  platform text not null default 'MT5',
  currency text not null default 'USD',
  initial_balance numeric not null default 0,
  current_balance numeric not null default 0,
  status text not null default 'active',
  last_synced_at timestamptz,
  created_at timestamptz default now()
);

-- Individual trades from broker
create table if not exists public.journal_trade (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  account_id uuid references public.journal_account(id) on delete cascade not null,
  ticket text not null,
  symbol text not null,
  direction text not null check (direction in ('BUY', 'SELL')),
  open_time timestamptz not null,
  close_time timestamptz,
  open_price numeric not null,
  close_price numeric,
  lot_size numeric not null,
  stop_loss numeric,
  take_profit numeric,
  pl numeric,
  commission numeric default 0,
  swap numeric default 0,
  pips numeric,
  risk_reward numeric,
  setup_tags text[] default '{}',
  notes text,
  screenshot_url text,
  status text not null default 'open',
  created_at timestamptz default now()
);

alter table public.journal_account enable row level security;
alter table public.journal_trade enable row level security;

drop policy if exists "Users manage own accounts" on public.journal_account;
create policy "Users manage own accounts" on public.journal_account
  for all using (auth.uid() = user_id);

drop policy if exists "Users manage own trades" on public.journal_trade;
create policy "Users manage own trades" on public.journal_trade
  for all using (auth.uid() = user_id);
