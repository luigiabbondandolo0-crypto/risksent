-- Bootstrap public.app_user (one row per auth user). Safe to re-run: IF NOT EXISTS / duplicate-safe constraints.
-- Run via Supabase SQL Editor if the table was never created, or use `supabase db push` on a fresh project.

create table if not exists public.app_user (
  id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  role text not null default 'customer' check (role in ('admin', 'trader', 'customer')),
  daily_loss_pct numeric(5,2) not null default 5.00,
  max_risk_per_trade_pct numeric(5,2) not null default 1.00,
  max_exposure_pct numeric(5,2) not null default 6.00,
  revenge_threshold_trades integer not null default 3,
  telegram_chat_id text,
  full_name text,
  phone text,
  company text,
  preference_timezone text,
  preference_currency text
);

do $$
begin
  alter table public.app_user add constraint daily_loss_pct_non_negative check (daily_loss_pct >= 0);
exception when duplicate_object then null;
end $$;
do $$
begin
  alter table public.app_user add constraint max_risk_per_trade_pct_non_negative check (max_risk_per_trade_pct >= 0);
exception when duplicate_object then null;
end $$;
do $$
begin
  alter table public.app_user add constraint max_exposure_pct_non_negative check (max_exposure_pct >= 0);
exception when duplicate_object then null;
end $$;
do $$
begin
  alter table public.app_user add constraint revenge_threshold_trades_positive check (revenge_threshold_trades >= 0);
exception when duplicate_object then null;
end $$;

alter table public.app_user enable row level security;

drop policy if exists "Users can access their own profile" on public.app_user;
create policy "Users can access their own profile" on public.app_user
  for all using (auth.uid() = id) with check (auth.uid() = id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.app_user (id, role)
  values (new.id, 'customer')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- Existing accounts (signup before this trigger): backfill rows
insert into public.app_user (id, role)
select u.id, 'customer'
from auth.users u
where not exists (select 1 from public.app_user au where au.id = u.id);
