import { NextResponse } from "next/server";
import { normalizeIanaTimeZone } from "@/lib/journal/calendarBounds";
import { requireRouteUser } from "@/lib/supabase/requireRouteUser";
import {
  fetchRiskLiveSnapshot,
  resolveTradingAccountForUser,
  tradingAccountLabel
} from "@/lib/risk/resolveTradingAccount";
import { buildLiveStatsFromJournal } from "@/lib/risk/liveStatsFromJournal";
import { persistRiskViolations } from "@/lib/risk/persistViolations";
import { loadMergedRiskRules } from "@/lib/risk/loadMergedRiskRules";
import { resolveJournalAccountForTradingRow } from "@/lib/risk/resolveJournalForTrading";
import type { RiskRulesDTO } from "@/lib/risk/riskTypes";
import { accountSelectColumns, type TradingAccountRow } from "@/lib/tradingApi";

function accountLabelFromRow(a: TradingAccountRow): string {
  const n = a.account_number ?? "";
  const tail = n.length > 4 ? `••••${n.slice(-4)}` : n || "Account";
  return `${a.broker_type ?? "MT"} ${tail}`;
}

export async function POST(request: Request) {
  const auth = await requireRouteUser(request);
  if (auth instanceof NextResponse) return auth;
  const { supabase, user } = auth;

  const { data: auTz } = await supabase
    .from("app_user")
    .select("preference_timezone")
    .eq("id", user.id)
    .maybeSingle();
  const timeZone = normalizeIanaTimeZone(auTz?.preference_timezone ?? null);

  let accountIdBody: string | undefined;
  try {
    const raw = await request.json().catch(() => null);
    if (raw && typeof raw === "object" && raw !== null && "account_id" in raw) {
      const v = (raw as { account_id?: unknown }).account_id;
      if (typeof v === "string" && v.trim()) accountIdBody = v.trim();
    }
  } catch {
    /* empty body */
  }

  let account: TradingAccountRow | null = null;
  let journalCtx: Awaited<ReturnType<typeof resolveJournalAccountForTradingRow>> = null;

  if (accountIdBody) {
    const { data: j } = await supabase
      .from("journal_account")
      .select("id, nickname, broker_server, account_number, currency")
      .eq("id", accountIdBody)
      .eq("user_id", user.id)
      .maybeSingle();

    if (j?.account_number) {
      const { data: t } = await supabase
        .from("trading_account")
        .select(accountSelectColumns())
        .eq("user_id", user.id)
        .eq("account_number", String(j.account_number))
        .limit(1)
        .maybeSingle();
      const row =
        t && typeof t === "object" && "metaapi_account_id" in t
          ? (t as unknown as TradingAccountRow)
          : null;
      if (row?.metaapi_account_id) {
        account = row;
        journalCtx = {
          id: String(j.id),
          nickname: String(j.nickname ?? "Account"),
          broker_server: j.broker_server != null ? String(j.broker_server) : null,
          account_number: String(j.account_number),
          currency: String(j.currency ?? "USD")
        };
      }
    }
  }

  if (!account) {
    account = await resolveTradingAccountForUser(supabase, user.id, null);
    if (account) {
      journalCtx = await resolveJournalAccountForTradingRow(supabase, user.id, account);
    }
  }

  if (!account) {
    return NextResponse.json({ violations: [], warning: "No linked trading account" });
  }

  const snap = await fetchRiskLiveSnapshot(account, timeZone);
  const journalLive =
    !snap && journalCtx?.id
      ? await buildLiveStatsFromJournal(supabase, user.id, journalCtx.id, timeZone)
      : null;
  if (!snap && !journalLive) {
    return NextResponse.json({ error: "Failed to load account data" }, { status: 502 });
  }

  const rules: RiskRulesDTO = await loadMergedRiskRules(
    supabase,
    user.id,
    journalCtx?.id ?? null
  );

  const live = snap
    ? {
        dailyDdPct: snap.dailyDdPct,
        currentExposurePct: snap.currentExposurePct,
        maxOpenRiskPct: snap.maxOpenRiskPct,
        consecutiveLossesAtEnd: snap.consecutiveLossesAtEnd,
        todayTrades: snap.todayTrades,
        avgTradesPerDay: snap.avgTradesPerDay
      }
    : {
        dailyDdPct: journalLive!.dailyDdPct,
        currentExposurePct: journalLive!.currentExposurePct,
        maxOpenRiskPct: journalLive!.maxOpenRiskPct,
        consecutiveLossesAtEnd: journalLive!.consecutiveLossesAtEnd,
        todayTrades: journalLive!.todayTrades,
        avgTradesPerDay: journalLive!.avgTradesPerDay
      };

  const { candidates } = await persistRiskViolations({
    userId: user.id,
    supabase,
    rules,
    live,
    journalAccountId: journalCtx?.id ?? null,
    accountNickname: journalCtx?.nickname ?? tradingAccountLabel(snap?.account ?? account),
    brokerServer: journalCtx?.broker_server ?? null,
    timeZone
  });

  const violations = candidates.map((v) => ({
    rule_type: v.rule_type,
    value_at_violation: v.value_at_violation,
    limit_value: v.limit_value,
    message: v.message,
    severity: v.severity
  }));

  return NextResponse.json({
    violations,
    account_label: journalCtx?.nickname ?? accountLabelFromRow(account)
  });
}
