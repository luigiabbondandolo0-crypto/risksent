-- Risk Manager: Telegram notification toggles for new rule types
-- (consecutive_losses, overtrading) so Per-rule settings mirror violation history.

alter table public.risk_notifications
  add column if not exists notify_consecutive_losses boolean default true,
  add column if not exists notify_overtrading boolean default true;
