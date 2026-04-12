-- Risk Manager: Telegram notification settings + rule violation history

create table if not exists public.risk_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete cascade not null unique,
  telegram_chat_id text,
  telegram_enabled boolean default false,
  notify_daily_dd boolean default true,
  notify_exposure boolean default true,
  notify_revenge boolean default true,
  notify_risk_per_trade boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.risk_violations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete cascade not null,
  rule_type text not null,
  value_at_violation numeric not null,
  limit_value numeric not null,
  message text not null,
  notified_telegram boolean default false,
  created_at timestamptz default now()
);

alter table public.risk_notifications enable row level security;
alter table public.risk_violations enable row level security;

drop policy if exists "Users own notifications" on public.risk_notifications;
drop policy if exists "risk_notifications_select_own" on public.risk_notifications;
drop policy if exists "risk_notifications_insert_own" on public.risk_notifications;
drop policy if exists "risk_notifications_update_own" on public.risk_notifications;
drop policy if exists "risk_notifications_delete_own" on public.risk_notifications;

create policy "risk_notifications_select_own" on public.risk_notifications
  for select using (auth.uid() = user_id);
create policy "risk_notifications_insert_own" on public.risk_notifications
  for insert with check (auth.uid() = user_id);
create policy "risk_notifications_update_own" on public.risk_notifications
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "risk_notifications_delete_own" on public.risk_notifications
  for delete using (auth.uid() = user_id);

drop policy if exists "Users own violations" on public.risk_violations;
drop policy if exists "risk_violations_select_own" on public.risk_violations;
drop policy if exists "risk_violations_insert_own" on public.risk_violations;
drop policy if exists "risk_violations_delete_own" on public.risk_violations;

create policy "risk_violations_select_own" on public.risk_violations
  for select using (auth.uid() = user_id);
create policy "risk_violations_insert_own" on public.risk_violations
  for insert with check (auth.uid() = user_id);
create policy "risk_violations_delete_own" on public.risk_violations
  for delete using (auth.uid() = user_id);

create index if not exists risk_violations_user_created_idx
  on public.risk_violations (user_id, created_at desc);
