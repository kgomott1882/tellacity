import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const ALLOWED_COUNTRIES = ["US", "ZA", "GB", "AU", "CA", "NZ", "IE"];

function normalizeCountry(raw: string | null | undefined): string | null {
  const upper = String(raw ?? "").trim().toUpperCase();
  if (!upper) return null;
  const normalized = upper === "UK" ? "GB" : upper;
  return ALLOWED_COUNTRIES.includes(normalized) ? normalized : null;
}

export function middleware(request: NextRequest) {
  const url = request.nextUrl;

  // Skip static files + API routes
  if (
    url.pathname.startsWith("/_next") ||
    url.pathname.startsWith("/api") ||
    url.pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // If country already in URL -> respect it
  const countryParam = url.searchParams.get("country");
  if (countryParam) {
    return NextResponse.next();
  }

  // Preserve already-selected country during internal navigation.
  const referer = request.headers.get("referer");
  if (referer) {
    try {
      const refererUrl = new URL(referer);
      if (refererUrl.origin === url.origin) {
        const refererCountry = normalizeCountry(refererUrl.searchParams.get("country"));
        if (refererCountry) {
          url.searchParams.set("country", refererCountry);
          return NextResponse.redirect(url);
        }
      }
    } catch {
      // Ignore malformed referer and fall back to geo detection.
    }
  }

  // Detect country from Vercel
  const detected = request.headers.get("x-vercel-ip-country");

  // Normalize to supported countries
  const country = normalizeCountry(detected) || "US";

  // Append to URL
  url.searchParams.set("country", country);

  return NextResponse.redirect(url);
}
