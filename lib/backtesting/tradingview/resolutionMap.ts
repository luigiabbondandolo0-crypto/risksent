import type { BtTimeframe } from "@/lib/backtesting/btTypes";

/** TradingView Charting Library resolution strings supported by our datafeed. */
export const TV_RESOLUTIONS = ["1", "5", "15", "30", "60", "240", "1D"] as const;

export type TvResolution = (typeof TV_RESOLUTIONS)[number];

const TV_TO_BT: Record<TvResolution, BtTimeframe> = {
  "1": "M1",
  "5": "M5",
  "15": "M15",
  "30": "M30",
  "60": "H1",
  "240": "H4",
  "1D": "D1"
};

const BT_TO_TV: Record<BtTimeframe, TvResolution> = {
  M1: "1",
  M5: "5",
  M15: "15",
  M30: "30",
  H1: "60",
  H4: "240",
  D1: "1D"
};

export function tvResolutionToBtTimeframe(resolution: string): BtTimeframe | null {
  return TV_TO_BT[resolution as TvResolution] ?? null;
}

export function btTimeframeToTvResolution(tf: BtTimeframe): TvResolution {
  return BT_TO_TV[tf];
}

/** Approximate bar duration in seconds for framing the visible range around a timestamp. */
export function secondsPerBarForResolution(resolution: string): number {
  switch (resolution) {
    case "1":
      return 60;
    case "5":
      return 300;
    case "15":
      return 900;
    case "30":
      return 1800;
    case "60":
      return 3600;
    case "240":
      return 14400;
    case "1D":
      return 86400;
    default:
      return 3600;
  }
}
