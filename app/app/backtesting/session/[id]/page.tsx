import { SessionSummaryView } from "@/components/backtesting/SessionSummaryView";

export default async function AppBacktestingSessionSummaryPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <SessionSummaryView sessionId={id} basePath="/app/backtesting" />;
}
