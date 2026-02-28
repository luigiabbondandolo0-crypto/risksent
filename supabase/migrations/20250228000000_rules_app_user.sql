-- Rules page: ensure app_user has risk rule columns (for /rules and dashboard pill).
-- Run in Supabase SQL Editor if you already have app_user without these.

alter table public.app_user add column if not exists daily_loss_pct numeric(5,2) not null default 5.00;
alter table public.app_user add column if not exists max_risk_per_trade_pct numeric(5,2) not null default 1.00;
alter table public.app_user add column if not exists max_exposure_pct numeric(5,2) not null default 6.00;
alter table public.app_user add column if not exists revenge_threshold_trades integer not null default 3;
alter table public.app_user add column if not exists telegram_chat_id text;

-- Constraints (ignore errors if they already exist)
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
