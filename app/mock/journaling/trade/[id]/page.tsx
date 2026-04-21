import { JournalTradeDetailClient } from "@/components/journal/JournalTradeDetailClient";

export default async function MockJournalingTradeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <JournalTradeDetailClient tradeId={id} linkBase="/mock/journaling" />;
}
