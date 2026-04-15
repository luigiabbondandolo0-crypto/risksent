import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Changelog",
  description: "What's new in RiskSent — feature releases, improvements, and bug fixes.",
  alternates: { canonical: "https://risksent.com/changelog" },
};

export default function ChangelogLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
