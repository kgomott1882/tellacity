import type { MetadataRoute } from "next";

/**
 * Crawl budget: review forms are linked from every profile but canonicalise to
 * `/b/[slug]`. Block crawling the form URLs so Google focuses on profiles.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/write-review/",
        "/write-review?",
        "/business/dashboard/",
        "/admin/",
        "/dashboard/",
        "/auth/",
        "/api/",
      ],
    },
    sitemap: "https://tellacity.com/sitemap.xml",
  };
}
