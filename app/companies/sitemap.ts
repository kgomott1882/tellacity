import type { MetadataRoute } from "next";
import {
  SUPPORTED_COUNTRY_CODES,
  countryPathSegment,
} from "@/lib/seoCountries";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://tellacity.com";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const entries: MetadataRoute.Sitemap = [
    {
      url: `${BASE_URL}/companies`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.8,
    },
  ];

  for (const code of SUPPORTED_COUNTRY_CODES) {
    const segment = countryPathSegment(code);
    entries.push({
      url: `${BASE_URL}/companies/${segment}`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.7,
    });
  }

  return entries;
}

