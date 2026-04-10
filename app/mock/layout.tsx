import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "RiskSent — Mock preview",
  description: "Demo with fake data. Not connected to real accounts.",
  robots: { index: false, follow: false },
};

export default function MockSegmentLayout({ children }: { children: React.ReactNode }) {
  return children;
}
