/**
 * Generic pass probability (0–100) for a challenge rule set.
 * If already breached → 0. Else combine progress toward target and buffer on DD.
 */
export function estimatePassProbability(
  stats: { profit_pct: number; worst_daily_pct: number; max_drawdown_pct: number; daily_loss_breach?: boolean; max_loss_breach?: boolean } | null,
  rule: { profit_target_pct: number; daily_loss_limit_pct: number; max_loss_pct: number }
): number {
  if (!stats) return 50;
  const breach = (stats.daily_loss_breach ?? stats.worst_daily_pct < -rule.daily_loss_limit_pct) ||
    (stats.max_loss_breach ?? stats.max_drawdown_pct > rule.max_loss_pct);
  if (breach) return 0;
  const progress = Math.min(1, stats.profit_pct / rule.profit_target_pct);
  const dailyBuffer = Math.max(0, (rule.daily_loss_limit_pct + stats.worst_daily_pct) / rule.daily_loss_limit_pct);
  const ddBuffer = Math.max(0, (rule.max_loss_pct - stats.max_drawdown_pct) / rule.max_loss_pct);
  return Math.round(progress * 40 + dailyBuffer * 30 + ddBuffer * 30);
}
