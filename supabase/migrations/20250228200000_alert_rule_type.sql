-- Add rule_type to alert for deduplication (same rule breach = one alert in time window)
alter table public.alert add column if not exists rule_type text;
comment on column public.alert.rule_type is 'Risk rule that triggered: daily_loss, max_drawdown, max_risk_per_trade, revenge_trading';
create index if not exists idx_alert_user_rule_date on public.alert (user_id, rule_type, alert_date desc);
