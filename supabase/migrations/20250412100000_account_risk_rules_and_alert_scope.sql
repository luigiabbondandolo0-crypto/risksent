-- Per-account risk rules; scope violations and alerts to journal accounts

create table if not exists public.account_risk_rules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  account_id uuid not null references public.journal_account (id) on delete cascade,
  daily_loss_pct numeric not null default 5,
  max_risk_per_trade_pct numeric not null default 1,
  max_exposure_pct numeric not null default 6,
  revenge_threshold_trades int not null default 3,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (user_id, account_id)
);

create index if not exists account_risk_rules_user_idx on public.account_risk_rules (user_id);

alter table public.account_risk_rules enable row level security;

drop policy if exists "account_risk_rules_own" on public.account_risk_rules;
create policy "account_risk_rules_own" on public.account_risk_rules
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

alter table public.risk_violations
  add column if not exists account_id uuid references public.journal_account (id) on delete set null,
  add column if not exists account_nickname text,
  add column if not exists broker_server text;

alter table public.alert
  add column if not exists account_id uuid references public.journal_account (id) on delete set null,
  add column if not exists account_nickname text;

alter table public.app_user
  add column if not exists preference_timezone text,
  add column if not exists preference_currency text;

create index if not exists risk_violations_user_account_created_idx
  on public.risk_violations (user_id, account_id, created_at desc);
