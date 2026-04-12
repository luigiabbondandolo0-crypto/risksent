import { AiCoachPageClient } from "@/components/ai-coach/AiCoachPageClient";
import { MOCK_MESSAGES, MOCK_REPORT_ROW } from "@/lib/ai-coach/mockReport";

export default function MockAiCoachPage() {
  return (
    <AiCoachPageClient
      isMock
      mockReport={MOCK_REPORT_ROW}
      mockMessages={MOCK_MESSAGES}
    />
  );
}
