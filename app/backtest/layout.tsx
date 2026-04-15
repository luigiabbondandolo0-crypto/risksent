import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Backtesting Lab",
  description:
    "Validate trading strategies on real historical data before risking a single dollar. Know your edge — win rate, RR, max drawdown — before the market does.",
  alternates: { canonical: "https://risksent.com/backtest" },
  openGraph: {
    title: "Backtesting Lab – RiskSent",
    description: "Test every strategy on historical data. Know your edge before you bet.",
    url: "https://risksent.com/backtest",
  },
};

export default function BacktestLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
