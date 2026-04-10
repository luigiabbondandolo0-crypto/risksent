import { SessionReplayView } from "@/components/backtesting/SessionReplayView";

export default async function AppBacktestingSessionReplayPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <SessionReplayView sessionId={id} basePath="/app/backtesting" />;
}
