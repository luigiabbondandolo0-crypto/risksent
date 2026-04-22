-- Backfill the `alert` table from `risk_violations` so the Dashboard Live
-- Alerts panel and the Topbar bell surface every violation that already
-- exists in the Risk Manager history.
--
-- Historically, `persistRiskViolations` only wrote to `risk_violations`. The
-- new dual-write (mirror into `alert`) only catches violations created from
-- now on. This migration fills in the gap so the three surfaces (Risk Manager
-- history, Dashboard Live Alerts, headbar bell) share the same list.

insert into public.alert (
  user_id,
  message,
  severity,
  solution,
  rule_type,
  account_id,
  account_nickname,
  alert_date
)
select
  rv.user_id,
  rv.message,
  case
    when lower(rv.rule_type) in (
      'daily_dd', 'daily_loss', 'daily_drawdown',
      'max_dd', 'max_drawdown',
      'revenge', 'revenge_trading',
      'consecutive_losses'
    ) then 'high'
    else 'medium'
  end as severity,
  case
    when lower(rv.rule_type) in ('daily_dd','daily_loss','daily_drawdown')
      then 'Stop trading today and review your daily loss limit. Resume tomorrow.'
    when lower(rv.rule_type) in ('max_dd','max_drawdown')
      then 'Review open exposure and reduce risk until the account recovers.'
    when lower(rv.rule_type) in ('exposure','risk_per_trade','position_size','max_risk_per_trade','current_exposure')
      then 'Reduce open exposure or position size to respect your limits.'
    when lower(rv.rule_type) in ('revenge','revenge_trading')
      then 'Step away from the charts. Revenge trading locked in — take a break before reopening.'
    when lower(rv.rule_type) = 'consecutive_losses'
      then 'Pause trading after consecutive losses. Review the last setups before taking the next trade.'
    when lower(rv.rule_type) = 'overtrading'
      then 'You''re trading above your average pace. Slow down and focus on quality setups.'
    else 'Review Risk Manager and adjust your current risk.'
  end as solution,
  rv.rule_type,
  rv.account_id,
  rv.account_nickname,
  rv.created_at as alert_date
from public.risk_violations rv
where not exists (
  select 1 from public.alert a
  where a.user_id = rv.user_id
    and a.rule_type = rv.rule_type
    and a.message = rv.message
    and coalesce(a.account_id::text, '') = coalesce(rv.account_id::text, '')
);
