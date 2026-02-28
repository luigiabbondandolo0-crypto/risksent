/**
 * Risk check: confronta statistiche di trading con le regole utente e produce
 * findings (avvicinamento o superamento limiti) con livello lieve/medio/alto e consiglio.
 */

export type RiskRules = {
  daily_loss_pct: number;
  max_risk_per_trade_pct: number;
  max_exposure_pct: number;
  revenge_threshold_trades: number;
};

export type StatsForRisk = {
  initialBalance: number;
  dailyStats: { date: string; profit: number }[];
  highestDdPct: number | null;
  consecutiveLossesAtEnd: number;
};

export type RiskLevel = "lieve" | "medio" | "alto";

export type RiskFinding = {
  type: "daily_loss" | "max_drawdown" | "max_risk_per_trade" | "revenge_trading";
  level: RiskLevel;
  message: string;
  advice: string;
  severity: "medium" | "high";
};

/** Open position with optional stop loss for max risk per trade check. riskPct = risk if SL hits as % of equity (caller should set). */
export type OpenPositionForRisk = {
  symbol: string;
  volume: number;
  openPrice: number;
  stopLoss?: number | null;
  type?: "buy" | "sell";
  riskPct?: number | null;
};

const APPROACH_THRESHOLD = 0.8; // consideriamo "in avvicinamento" a 80% del limite

export type RiskCheckOptions = {
  openPositions?: OpenPositionForRisk[];
  equity?: number;
  /** Current exposure as % of equity (from open positions). If set, checked against max_exposure_pct. */
  currentExposurePct?: number | null;
};

export function getRiskFindings(
  rules: RiskRules,
  stats: StatsForRisk,
  options?: RiskCheckOptions
): RiskFinding[] {
  const findings: RiskFinding[] = [];
  const { initialBalance, dailyStats, highestDdPct, consecutiveLossesAtEnd } = stats;
  const { openPositions = [], equity, currentExposurePct } = options ?? {};

  // --- Perdita giornaliera ---
  if (initialBalance > 0 && dailyStats.length > 0) {
    const worstDayPct = Math.min(
      ...dailyStats.map((d) => (d.profit / initialBalance) * 100)
    );
    const limit = rules.daily_loss_pct;
    const approachLimit = -limit * APPROACH_THRESHOLD; // es. -4% se limit 5%

    if (worstDayPct <= -limit) {
      const ratio = Math.abs(worstDayPct / limit);
      const level: RiskLevel = ratio >= 1.5 ? "alto" : ratio >= 1.1 ? "medio" : "medio";
      findings.push({
        type: "daily_loss",
        level,
        message: `Perdita giornaliera: ${worstDayPct.toFixed(2)}% (limite ${limit}%).`,
        advice: getDailyLossAdvice(level, worstDayPct, limit),
        severity: level === "alto" ? "high" : "medium"
      });
    } else if (worstDayPct < approachLimit) {
      findings.push({
        type: "daily_loss",
        level: "lieve",
        message: `Ti stai avvicinando al limite di perdita giornaliera: peggior giorno ${worstDayPct.toFixed(2)}% (limite ${limit}%).`,
        advice: getDailyLossAdvice("lieve", worstDayPct, limit),
        severity: "medium"
      });
    }
  }

  // --- Max risk per trade (da posizioni aperte con SL) ---
  if (rules.max_risk_per_trade_pct > 0 && openPositions.length > 0) {
    const limit = rules.max_risk_per_trade_pct;
    for (const pos of openPositions) {
      const riskPct = pos.riskPct;
      if (riskPct != null && riskPct > limit) {
        const ratio = riskPct / limit;
        const level: RiskLevel = ratio >= 1.5 ? "alto" : ratio >= 1.1 ? "medio" : "medio";
        findings.push({
          type: "max_risk_per_trade",
          level,
          message: `Rischio sul trade ${pos.symbol}: ${riskPct.toFixed(2)}% (limite ${limit}%). Riduci lo stop loss o il lot size.`,
          advice: "Chiudi o ridimensiona la posizione per rispettare il rischio massimo per trade. Controlla le regole in RiskSent → Rules.",
          severity: level === "alto" ? "high" : "medium"
        });
      }
    }
  }

  // --- Esposizione attuale (da posizioni aperte) ---
  if (currentExposurePct != null && rules.max_exposure_pct > 0) {
    const limit = rules.max_exposure_pct;
    const approachLimit = limit * APPROACH_THRESHOLD;
    if (currentExposurePct >= limit) {
      const ratio = currentExposurePct / limit;
      const level: RiskLevel = ratio >= 1.5 ? "alto" : ratio >= 1.1 ? "medio" : "medio";
      findings.push({
        type: "max_drawdown",
        level,
        message: `Esposizione attuale: ${currentExposurePct.toFixed(2)}% (limite ${limit}%).`,
        advice: getDrawdownAdvice(level, currentExposurePct, limit),
        severity: level === "alto" ? "high" : "medium"
      });
    } else if (currentExposurePct >= approachLimit) {
      findings.push({
        type: "max_drawdown",
        level: "lieve",
        message: `Esposizione in avvicinamento al limite: ${currentExposurePct.toFixed(2)}% (limite ${limit}%).`,
        advice: getDrawdownAdvice("lieve", currentExposurePct, limit),
        severity: "medium"
      });
    }
  }

  // --- Drawdown massimo (storico da curve) ---
  if (highestDdPct != null && rules.max_exposure_pct > 0) {
    const limit = rules.max_exposure_pct;
    const approachLimit = limit * APPROACH_THRESHOLD;

    if (highestDdPct >= limit) {
      const ratio = highestDdPct / limit;
      const level: RiskLevel = ratio >= 1.5 ? "alto" : ratio >= 1.1 ? "medio" : "medio";
      findings.push({
        type: "max_drawdown",
        level,
        message: `Drawdown massimo: ${highestDdPct.toFixed(2)}% (limite esposizione ${limit}%).`,
        advice: getDrawdownAdvice(level, highestDdPct, limit),
        severity: level === "alto" ? "high" : "medium"
      });
    } else if (highestDdPct >= approachLimit) {
      findings.push({
        type: "max_drawdown",
        level: "lieve",
        message: `Drawdown in avvicinamento al limite: ${highestDdPct.toFixed(2)}% (limite ${limit}%).`,
        advice: getDrawdownAdvice("lieve", highestDdPct, limit),
        severity: "medium"
      });
    }
  }

  // --- Revenge trading (perdite consecutive) ---
  const threshold = rules.revenge_threshold_trades;
  if (threshold > 0 && consecutiveLossesAtEnd >= threshold) {
    const level: RiskLevel =
      consecutiveLossesAtEnd >= threshold + 2 ? "alto" : consecutiveLossesAtEnd > threshold ? "medio" : "medio";
    findings.push({
      type: "revenge_trading",
      level,
      message: `${consecutiveLossesAtEnd} perdite consecutive (soglia ${threshold}). Possibile revenge trading.`,
      advice: getRevengeAdvice(level, consecutiveLossesAtEnd, threshold),
      severity: level === "alto" ? "high" : "medium"
    });
  } else if (threshold > 0 && consecutiveLossesAtEnd === threshold - 1 && consecutiveLossesAtEnd > 0) {
    findings.push({
      type: "revenge_trading",
      level: "lieve",
      message: `${consecutiveLossesAtEnd} perdite consecutive: una in più e raggiungi la soglia (${threshold}).`,
      advice: getRevengeAdvice("lieve", consecutiveLossesAtEnd, threshold),
      severity: "medium"
    });
  }

  return findings;
}

function getDailyLossAdvice(level: RiskLevel, currentPct: number, limit: number): string {
  switch (level) {
    case "lieve":
      return "Riduci la dimensione delle posizioni o evita nuovi ingressi fino a domani. Controlla le regole in RiskSent → Rules.";
    case "medio":
      return "Hai superato il limite di perdita giornaliera. Sospendi il trading per oggi, chiudi eventuali posizioni a rischio e rivedi le regole domani.";
    case "alto":
      return "Perdita giornaliera molto oltre il limite. Non aprire nuovi trade; chiudi le posizioni a rischio e considera una pausa di un giorno per rivedere la strategia.";
    default:
      return "Rivedi le regole in RiskSent → Rules e adatta il rischio.";
  }
}

function getDrawdownAdvice(level: RiskLevel, currentPct: number, limit: number): string {
  switch (level) {
    case "lieve":
      return "L'esposizione si sta avvicinando al massimo. Riduci le dimensioni delle posizioni aperte o chiudi parte dell'esposizione.";
    case "medio":
      return "Hai superato il limite di esposizione/drawdown. Riduci subito le posizioni aperte e non aprire nuovi trade fino a rientrare sotto il limite.";
    case "alto":
      return "Drawdown molto oltre il limite. Riduci immediatamente l'esposizione, chiudi le posizioni più in perdita e sospendi nuovi ingressi.";
    default:
      return "Controlla l'esposizione in RiskSent → Dashboard e riduci il rischio.";
  }
}

function getRevengeAdvice(level: RiskLevel, consecutive: number, threshold: number): string {
  switch (level) {
    case "lieve":
      return "Stai vicino alla soglia di revenge trading. Fai una pausa di almeno 30 minuti prima del prossimo trade e rispetta la tua dimensione di posizione.";
    case "medio":
      return "Possibile revenge trading: troppe perdite consecutive. Fermati per oggi, non cercare di recuperare con trade impulsivi. Riprendi domani con le regole chiare.";
    case "alto":
      return "Pattern da revenge trading evidente. Sospendi il trading per oggi e domani. Rivedi il piano e le regole in RiskSent → Rules prima di riprendere.";
    default:
      return "Rispetta la soglia di perdite consecutive impostata in Rules e fai pause tra una serie di loss e l'altra.";
  }
}
