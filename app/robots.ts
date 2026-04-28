import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "https://risksent.com";
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/app/",
          "/admin/",
          "/api/",
          "/auth/",
          "/onboarding/",
          "/add-account/",
          "/dashboard/",
          "/orders/",
          "/profile/",
          "/rules/",
          "/trades/",
        ],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
