import { NextResponse } from "next/server";
import { createSupabaseRouteClient } from "@/lib/supabaseServer";
import { runRiskCheckDryRun } from "@/lib/riskCheckRun";

/**
 * GET /api/monitoring/live-check
 * Runs risk check in dry-run mode (no alerts, no Telegram). Returns full detail for live-monitoring page.
 */
export async function GET() {
  const supabase = createSupabaseRouteClient();
  const {
    data: { user },
    error: authError
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = process.env.METATRADERAPI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "METATRADERAPI_API_KEY not set" }, { status: 500 });
  }

  const { data: accounts } = await supabase
    .from("trading_account")
    .select("metaapi_account_id")
    .eq("user_id", user.id)
    .not("metaapi_account_id", "is", null)
    .limit(1);

  const uuid = accounts?.[0]?.metaapi_account_id ?? null;
  if (!uuid) {
    return NextResponse.json({ error: "No linked account", detail: "Add an account and link it (metaapi_account_id)." }, { status: 400 });
  }

  const result = await runRiskCheckDryRun({
    userId: user.id,
    uuid,
    supabase,
    apiKey,
    includeRaw: true
  });

  if (!result.ok) {
    return NextResponse.json({
      ...result,
      humanSummary: `Error: ${result.error}. Connection: AccountSummary ${result.connection.accountSummary.ok ? "OK" : "FAIL"}, ClosedOrders ${result.connection.closedOrders.ok ? "OK" : "FAIL"}, OpenOrders ${result.connection.openOrders.ok ? "OK" : "FAIL"}.`,
      humanEvents: [
        { title: "Connection", human: JSON.stringify(result.connection), technical: JSON.stringify(result.connection, null, 2) }
      ],
      technical: { connection: result.connection, error: result.error }
    });
  }

  // Human-readable summary
  const humanSummary: string[] = [];
  humanSummary.push(`Account ${uuid.slice(0, 8)}... | Balance: ${result.balance} | Equity: ${result.equity}`);
  humanSummary.push(`Closed orders: ${result.closedOrdersCount} | Open positions: ${result.openPositionsCount}`);
  if (result.currentExposurePct != null) humanSummary.push(`Current exposure: ${result.currentExposurePct.toFixed(2)}%`);
  humanSummary.push(`Rules: daily_loss ${result.rules.daily_loss_pct}%, max_risk/trade ${result.rules.max_risk_per_trade_pct}%, max_exposure ${result.rules.max_exposure_pct}%, revenge_threshold ${result.rules.revenge_threshold_trades}`);
  humanSummary.push(`Stats: initialBalance ${result.stats.initialBalance}, worst day in dailyStats, consecutiveLossesAtEnd ${result.stats.consecutiveLossesAtEnd}`);
  if (result.findings.length > 0) {
    humanSummary.push(`Findings (${result.findings.length}):`);
    result.findings.forEach((f) => humanSummary.push(`  - [${f.level}] ${f.type}: ${f.message}`));
  } else {
    humanSummary.push("Findings: none (within limits).");
  }

  return NextResponse.json({
    ...result,
    humanSummary: humanSummary.join("\n"),
    humanEvents: buildHumanEvents(result),
    technical: {
      connection: result.connection,
      balance: result.balance,
      equity: result.equity,
      closedOrdersCount: result.closedOrdersCount,
      openPositionsCount: result.openPositionsCount,
      rules: result.rules,
      stats: result.stats,
      currentExposurePct: result.currentExposurePct,
      openPositions: result.openPositions,
      findings: result.findings
    }
  });
}

function buildHumanEvents(result: Awaited<ReturnType<typeof runRiskCheckDryRun>>): { title: string; human: string; technical: string }[] {
  const events: { title: string; human: string; technical: string }[] = [];

  events.push({
    title: "Connection (API)",
    human: [
      `AccountSummary: ${result.connection.accountSummary.ok ? "OK" : "FAIL"} ${result.connection.accountSummary.status ?? ""} ${result.connection.accountSummary.error ?? ""}`,
      `ClosedOrders: ${result.connection.closedOrders.ok ? "OK" : "FAIL"} ${result.connection.closedOrders.status ?? ""} ${result.connection.closedOrders.error ?? ""}`,
      `OpenOrders: ${result.connection.openOrders.ok ? "OK" : "FAIL"} ${result.connection.openOrders.status ?? ""} ${result.connection.openOrders.error ?? ""}`
    ].join(" | "),
    technical: JSON.stringify(result.connection, null, 2)
  });

  events.push({
    title: "Account (balance / equity)",
    human: `Balance: ${result.balance} | Equity: ${result.equity}`,
    technical: JSON.stringify({ balance: result.balance, equity: result.equity }, null, 2)
  });

  events.push({
    title: "Closed orders (used for daily loss & revenge)",
    human: `${result.closedOrdersCount} closed orders. Daily P&L by date: ${result.stats.dailyStats.map((d) => `${d.date}=${d.profit}`).join(", ") || "none"}. Consecutive losses at end: ${result.stats.consecutiveLossesAtEnd}.`,
    technical: JSON.stringify({ count: result.closedOrdersCount, dailyStats: result.stats.dailyStats, consecutiveLossesAtEnd: result.stats.consecutiveLossesAtEnd, initialBalance: result.stats.initialBalance, highestDdPct: result.stats.highestDdPct }, null, 2)
  });

  events.push({
    title: "Open positions (used for max risk/trade & exposure)",
    human:
      result.openPositions.length === 0
        ? "No open positions (or OpenOrders API not available / empty)."
        : result.openPositions.map((p) => `${p.symbol} ${p.type} vol=${p.volume} SL=${p.stopLoss ?? "none"} riskPct=${p.riskPct ?? "n/a"}%`).join(" | "),
    technical: JSON.stringify(result.openPositions, null, 2)
  });

  events.push({
    title: "Current exposure %",
    human: result.currentExposurePct == null ? "N/A (no open positions or not computed)." : `${result.currentExposurePct.toFixed(2)}% (limit ${result.rules.max_exposure_pct}%)`,
    technical: JSON.stringify({ currentExposurePct: result.currentExposurePct, limit: result.rules.max_exposure_pct }, null, 2)
  });

  events.push({
    title: "Risk findings (triggers for alert + Telegram)",
    human: result.findings.length === 0 ? "None." : result.findings.map((f) => `[${f.level}] ${f.type}: ${f.message}`).join(" | "),
    technical: JSON.stringify(result.findings, null, 2)
  });

  return events;
}
