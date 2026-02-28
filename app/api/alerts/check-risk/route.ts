import { NextRequest, NextResponse } from "next/server";
import { createSupabaseRouteClient } from "@/lib/supabaseServer";
import { createSupabaseAdmin } from "@/lib/supabaseAdmin";
import { getRiskFindings, type RiskRules, type StatsForRisk } from "@/lib/riskCheck";
import { sendAlertToTelegram } from "@/lib/telegramAlert";

const METAAPI_BASE = "https://api.metatraderapi.dev";

type ClosedOrder = { closeTime?: string; profit?: number };

function parseOrders(orders: unknown): ClosedOrder[] {
  if (!Array.isArray(orders)) return [];
  return orders.filter(
    (o): o is ClosedOrder =>
      o != null &&
      typeof (o as ClosedOrder).closeTime === "string" &&
      typeof (o as ClosedOrder).profit === "number"
  ) as ClosedOrder[];
}

function buildStatsForRisk(
  balance: number,
  orders: ClosedOrder[]
): StatsForRisk {
  const valid = orders.filter(
    (o) => o.closeTime && typeof o.profit === "number"
  ) as { closeTime: string; profit: number }[];
  if (valid.length === 0) {
    return {
      initialBalance: balance,
      dailyStats: [],
      highestDdPct: null,
      consecutiveLossesAtEnd: 0
    };
  }
  const totalProfit = valid.reduce((s, o) => s + o.profit, 0);
  const initialBalance = balance - totalProfit;
  const sorted = [...valid].sort(
    (a, b) => new Date(a.closeTime).getTime() - new Date(b.closeTime).getTime()
  );

  const dayMap = new Map<string, number>();
  let running = initialBalance;
  const curve: number[] = [initialBalance];
  for (const o of sorted) {
    running += o.profit;
    curve.push(running);
    const dateStr = o.closeTime.slice(0, 10);
    dayMap.set(dateStr, (dayMap.get(dateStr) ?? 0) + o.profit);
  }
  const dailyStats = Array.from(dayMap.entries()).map(([date, profit]) => ({
    date,
    profit
  }));

  let peak = curve[0] ?? initialBalance;
  let maxDdPct = 0;
  for (let i = 1; i < curve.length; i++) {
    const v = curve[i] ?? 0;
    if (v > peak) peak = v;
    const dd = peak > 0 ? ((peak - v) / peak) * 100 : 0;
    if (dd > maxDdPct) maxDdPct = dd;
  }
  const highestDdPct = maxDdPct > 0 ? maxDdPct : null;

  const byCloseDesc = [...sorted].sort(
    (a, b) => new Date(b.closeTime).getTime() - new Date(a.closeTime).getTime()
  );
  let consecutiveLossesAtEnd = 0;
  for (const o of byCloseDesc) {
    if (o.profit < 0) consecutiveLossesAtEnd++;
    else break;
  }

  return {
    initialBalance: initialBalance > 0 ? initialBalance : balance,
    dailyStats,
    highestDdPct,
    consecutiveLossesAtEnd
  };
}

/**
 * POST /api/alerts/check-risk
 * Legge regole utente e statistiche dell'account (uuid in body o query),
 * calcola eventuali violazioni/avvicinamenti e crea alert + invio Telegram.
 * Body: { uuid?: string }
 */
export async function POST(req: NextRequest) {
  const supabase = createSupabaseRouteClient();
  const {
    data: { user },
    error: authError
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let uuid: string | null = null;
  try {
    const body = await req.json().catch(() => ({}));
    uuid = body?.uuid ?? null;
  } catch {
    // no body
  }
  if (!uuid) {
    const { data: accounts } = await supabase
      .from("trading_account")
      .select("metaapi_account_id")
      .eq("user_id", user.id)
      .limit(1);
    uuid = accounts?.[0]?.metaapi_account_id ?? null;
  }
  if (!uuid) {
    return NextResponse.json(
      { error: "No account selected or linked", findings: [] },
      { status: 200 }
    );
  }

  const apiKey = process.env.METATRADERAPI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "METATRADERAPI_API_KEY not set", findings: [] },
      { status: 500 }
    );
  }

  const headers = { "x-api-key": apiKey, Accept: "application/json" };
  let balance = 0;
  let orders: ClosedOrder[] = [];

  try {
    const [summaryRes, closedRes] = await Promise.all([
      fetch(`${METAAPI_BASE}/AccountSummary?id=${encodeURIComponent(uuid)}`, { headers }),
      fetch(`${METAAPI_BASE}/ClosedOrders?id=${encodeURIComponent(uuid)}`, { headers })
    ]);
    if (summaryRes.ok) {
      const summary = await summaryRes.json();
      balance = Number(summary.balance) ?? 0;
    }
    if (closedRes.ok) {
      const raw = await closedRes.json();
      orders = parseOrders(Array.isArray(raw) ? raw : raw?.orders ?? raw ?? []);
    }
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to fetch account", findings: [] },
      { status: 502 }
    );
  }

  const admin = createSupabaseAdmin();
  const { data: appUser } = await admin
    .from("app_user")
    .select("daily_loss_pct, max_risk_per_trade_pct, max_exposure_pct, revenge_threshold_trades")
    .eq("id", user.id)
    .single();

  const rules: RiskRules = {
    daily_loss_pct: Number(appUser?.daily_loss_pct) ?? 5,
    max_risk_per_trade_pct: Number(appUser?.max_risk_per_trade_pct) ?? 1,
    max_exposure_pct: Number(appUser?.max_exposure_pct) ?? 6,
    revenge_threshold_trades: Number(appUser?.revenge_threshold_trades) ?? 3
  };

  const stats = buildStatsForRisk(balance, orders);
  const findings = getRiskFindings(rules, stats);

  const routeSupabase = createSupabaseRouteClient();
  for (const f of findings) {
    const { data: alertRow } = await routeSupabase
      .from("alert")
      .insert({
        user_id: user.id,
        message: f.message,
        severity: f.severity,
        solution: f.advice
      })
      .select("id")
      .single();

    if (alertRow) {
      await sendAlertToTelegram({
        user_id: user.id,
        message: `[${f.level.toUpperCase()}] ${f.message}`,
        severity: f.severity,
        solution: f.advice
      });
    }
  }

  return NextResponse.json({
    findings: findings.map((f) => ({
      type: f.type,
      level: f.level,
      message: f.message,
      advice: f.advice
    }))
  });
}
