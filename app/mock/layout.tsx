import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "RiskSent — Mock preview",
  description: "Dimostrazione con dati finti. Non collegata agli account reali.",
  robots: { index: false, follow: false },
};

export default function MockSegmentLayout({ children }: { children: React.ReactNode }) {
  return children;
}
