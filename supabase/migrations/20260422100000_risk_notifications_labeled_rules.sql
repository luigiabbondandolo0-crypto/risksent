-- Risk Manager: "Per rule" toggles expanded to the explicit 7-rule set:
-- Daily DD, Max DD, Position Size, Consec Losses, Weekly Loss, Overtrading, Revenge Trading.
-- Old columns (notify_exposure, notify_risk_per_trade) are kept for backward compat and
-- mirrored into notify_position_size.

alter table public.risk_notifications
  add column if not exists notify_max_dd boolean default true,
  add column if not exists notify_position_size boolean default true,
  add column if not exists notify_weekly_loss boolean default true;

-- Backfill notify_position_size from the legacy per-trade / exposure toggles:
-- if EITHER was previously off the user clearly did not want these alerts.
update public.risk_notifications
  set notify_position_size = (coalesce(notify_risk_per_trade, true)
                              and coalesce(notify_exposure, true));
