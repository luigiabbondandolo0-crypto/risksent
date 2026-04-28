import type { MetadataRoute } from "next";

const base = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "https://risksent.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: `${base}/`,            lastModified: now, changeFrequency: "weekly",  priority: 1.0 },
    { url: `${base}/pricing`,     lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${base}/backtest`,    lastModified: now, changeFrequency: "weekly",  priority: 0.8 },
    { url: `${base}/journaling`,  lastModified: now, changeFrequency: "weekly",  priority: 0.8 },
    { url: `${base}/risk-manager`,lastModified: now, changeFrequency: "weekly",  priority: 0.8 },
    { url: `${base}/ai-coach`,    lastModified: now, changeFrequency: "weekly",  priority: 0.8 },
    { url: `${base}/live-alerts`, lastModified: now, changeFrequency: "weekly",  priority: 0.7 },
    { url: `${base}/mission`,     lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/changelog`,   lastModified: now, changeFrequency: "weekly",  priority: 0.6 },
    { url: `${base}/contact`,     lastModified: now, changeFrequency: "yearly",  priority: 0.4 },
    { url: `${base}/support`,     lastModified: now, changeFrequency: "yearly",  priority: 0.4 },
    { url: `${base}/privacy`,     lastModified: now, changeFrequency: "yearly",  priority: 0.3 },
    { url: `${base}/terms`,       lastModified: now, changeFrequency: "yearly",  priority: 0.3 },
    { url: `${base}/cookies`,     lastModified: now, changeFrequency: "yearly",  priority: 0.2 },
  ];
}
