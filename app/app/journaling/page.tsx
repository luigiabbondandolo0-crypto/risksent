import { Suspense } from "react";
import { JournalingPageClient } from "@/components/journal/JournalingPageClient";

export default function JournalingPage() {
  return (
    <Suspense fallback={<p className="font-mono text-sm text-slate-500">Loading…</p>}>
      <JournalingPageClient />
    </Suspense>
  );
}
