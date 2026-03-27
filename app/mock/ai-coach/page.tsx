import { AICoachPanels } from "@/components/ai-coach/AICoachPanels";
import { MOCK_AI_COACH } from "@/lib/mock/siteMockData";

export default function MockAICoachPage() {
  return <AICoachPanels variant="mock" data={MOCK_AI_COACH} />;
}
