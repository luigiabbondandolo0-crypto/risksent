import type {
  ChallengeResult,
  CoachAdaptation,
  CoachError,
  CoachInsight,
  CoachPrediction,
  CoachReport,
  ErrorSeverity,
  ErrorType,
  TradingSession,
} from "@/lib/ai-coach/coachTypes";

const ERROR_TYPES: ErrorType[] = [
  "revenge_trading",
  "overtrading",
  "poor_rr",
  "size_error",
  "tilt",
  "fomo",
  "early_exit",
  "late_exit",
  "news_trading",
  "overexposure",
];

const SEVERITIES: ErrorSeverity[] = ["critical", "high", "medium", "low"];
const PRIORITIES: Array<CoachAdaptation["priority"]> = ["high", "medium", "low"];
const SESSIONS: TradingSession[] = ["London", "NY", "Asia", "Other"];

function stripCodeFences(text: string): string {
  const t = text.trim();
  const block = /```(?:json)?\s*([\s\S]*?)```/;
  const m = t.match(block);
  if (m?.[1]) return m[1].trim();
  return t;
}

/** First complete `{ ... }` object, respecting strings (avoids greedy lastIndexOf bugs). */
export function extractBalancedJsonObject(text: string): string | null {
  const cleaned = stripCodeFences(text);
  const start = cleaned.indexOf("{");
  if (start === -1) return null;
  let depth = 0;
  let inString = false;
  let escape = false;
  for (let i = start; i < cleaned.length; i++) {
    const c = cleaned[i]!;
    if (escape) {
      escape = false;
      continue;
    }
    if (c === "\\" && inString) {
      escape = true;
      continue;
    }
    if (c === '"') {
      inString = !inString;
      continue;
    }
    if (inString) continue;
    if (c === "{") depth++;
    else if (c === "}") {
      depth--;
      if (depth === 0) return cleaned.slice(start, i + 1);
    }
  }
  return null;
}

function stripTrailingCommas(json: string): string {
  return json.replace(/,\s*([}\]])/g, "$1");
}

function num(n: unknown, fallback: number): number {
  const x = typeof n === "number" ? n : Number(n);
  return Number.isFinite(x) ? x : fallback;
}

function str(v: unknown, fallback = ""): string {
  return v == null ? fallback : String(v);
}

function asErrorType(v: unknown): ErrorType {
  const s = String(v ?? "");
  return ERROR_TYPES.includes(s as ErrorType) ? (s as ErrorType) : "tilt";
}

function asSeverity(v: unknown): ErrorSeverity {
  const s = String(v ?? "");
  return SEVERITIES.includes(s as ErrorSeverity) ? (s as ErrorSeverity) : "medium";
}

function asSession(v: unknown): TradingSession {
  const s = String(v ?? "");
  return SESSIONS.includes(s as TradingSession) ? (s as TradingSession) : "Other";
}

function emptyChallenge(): ChallengeResult {
  return {
    would_pass: false,
    pass_probability: 0,
    reason: "",
    critical_issues: [],
    estimated_days_to_fail: null,
  };
}

function normalizeChallenge(raw: unknown): ChallengeResult {
  if (!raw || typeof raw !== "object") return emptyChallenge();
  const o = raw as Record<string, unknown>;
  const issues = o.critical_issues;
  return {
    would_pass: Boolean(o.would_pass),
    pass_probability: Math.min(100, Math.max(0, num(o.pass_probability, 0))),
    reason: str(o.reason),
    critical_issues: Array.isArray(issues)
      ? issues.map((x) => str(x)).filter(Boolean)
      : [],
    estimated_days_to_fail: (() => {
      const v = o.estimated_days_to_fail;
      if (v == null) return null;
      const n = num(v, NaN);
      return Number.isFinite(n) ? Math.round(n) : null;
    })(),
  };
}

export function normalizeCoachReport(raw: Record<string, unknown>): CoachReport {
  const cs = raw.challenge_simulation;
  let ftmo_phase1 = emptyChallenge();
  let ftmo_simplified = emptyChallenge();
  if (cs && typeof cs === "object") {
    const c = cs as Record<string, unknown>;
    ftmo_phase1 = normalizeChallenge(c.ftmo_phase1);
    ftmo_simplified = normalizeChallenge(c.ftmo_simplified);
  }

  const errors: CoachError[] = Array.isArray(raw.errors)
    ? (raw.errors as unknown[]).map((e) => {
        const o = (e && typeof e === "object" ? e : {}) as Record<string, unknown>;
        return {
          type: asErrorType(o.type),
          severity: asSeverity(o.severity),
          description: str(o.description),
          estimated_cost_usd: num(o.estimated_cost_usd, 0),
          trades_affected: Math.max(0, Math.round(num(o.trades_affected, 0))),
          occurrences: Math.max(0, Math.round(num(o.occurrences, 0))),
        };
      })
    : [];

  const predictions: CoachPrediction[] = Array.isArray(raw.predictions)
    ? (raw.predictions as unknown[]).map((p) => {
        const o = (p && typeof p === "object" ? p : {}) as Record<string, unknown>;
        return {
          risk: str(o.risk),
          probability: Math.min(100, Math.max(0, num(o.probability, 0))),
          description: str(o.description),
          trigger: str(o.trigger),
        };
      })
    : [];

  const insights: CoachInsight[] = Array.isArray(raw.insights)
    ? (raw.insights as unknown[]).map((p) => {
        const o = (p && typeof p === "object" ? p : {}) as Record<string, unknown>;
        return {
          category: str(o.category),
          title: str(o.title),
          description: str(o.description),
          recommendation: str(o.recommendation),
          estimated_impact: str(o.estimated_impact),
        };
      })
    : [];

  const adaptations: CoachAdaptation[] = Array.isArray(raw.adaptations)
    ? (raw.adaptations as unknown[]).map((p) => {
        const o = (p && typeof p === "object" ? p : {}) as Record<string, unknown>;
        const pr = str(o.priority);
        const priority = PRIORITIES.includes(pr as CoachAdaptation["priority"])
          ? (pr as CoachAdaptation["priority"])
          : "medium";
        return {
          rule: str(o.rule),
          reason: str(o.reason),
          priority,
          implementation: str(o.implementation),
        };
      })
    : [];

  const stringArr = (v: unknown): string[] =>
    Array.isArray(v) ? v.map((x) => str(x)).filter(Boolean) : [];

  return {
    summary: str(raw.summary),
    emotional_score: Math.min(100, Math.max(0, num(raw.emotional_score, 50))),
    performance_score: Math.min(100, Math.max(0, num(raw.performance_score, 50))),
    discipline_score: Math.min(100, Math.max(0, num(raw.discipline_score, 50))),
    risk_consistency_score: Math.min(100, Math.max(0, num(raw.risk_consistency_score, 50))),
    strategy_adherence_score: Math.min(100, Math.max(0, num(raw.strategy_adherence_score, 50))),
    errors,
    predictions,
    insights,
    adaptations,
    challenge_simulation: {
      ftmo_phase1,
      ftmo_simplified,
    },
    best_trading_hours: stringArr(raw.best_trading_hours),
    worst_trading_hours: stringArr(raw.worst_trading_hours),
    best_symbols: stringArr(raw.best_symbols),
    worst_symbols: stringArr(raw.worst_symbols),
    best_session: asSession(raw.best_session),
    worst_session: asSession(raw.worst_session),
    weekly_summary: str(raw.weekly_summary),
    worst_pattern: str(raw.worst_pattern),
    one_thing_to_fix_this_week: str(raw.one_thing_to_fix_this_week),
  };
}

export type ParseCoachOutcome =
  | { ok: true; report: CoachReport }
  | { ok: false; error: string; detail?: string };

export function parseCoachReportFromModelText(
  rawContent: string,
  opts?: { stopReason?: string | null }
): ParseCoachOutcome {
  if (opts?.stopReason === "max_tokens") {
    return {
      ok: false,
      error:
        "La risposta dell'AI è stata troncata. Prova un intervallo più breve (meno giorni) o riprova.",
      detail: "stop_reason=max_tokens",
    };
  }

  const extracted = extractBalancedJsonObject(rawContent);
  if (!extracted) {
    return {
      ok: false,
      error: "Nessun oggetto JSON trovato nella risposta. Riprova.",
      detail: rawContent.slice(0, 400),
    };
  }

  const attempts = [extracted, stripTrailingCommas(extracted)];
  for (const slice of attempts) {
    try {
      const parsed = JSON.parse(slice) as unknown;
      if (!parsed || typeof parsed !== "object") continue;
      return { ok: true, report: normalizeCoachReport(parsed as Record<string, unknown>) };
    } catch {
      /* try next */
    }
  }

  return {
    ok: false,
    error: "Risposta AI non valida (JSON). Riprova tra un attimo.",
    detail: extracted.slice(0, 500),
  };
}
