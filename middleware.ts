import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { COUNTRY_COOKIE_NAME, normalizeCountryCode } from "@/lib/country";

/**
 * If the user has a country preference cookie but the URL has no `country`
 * query param, add it before SSR so listings and copy match the navbar
 * without a second client round-trip.
 */
export function middleware(request: NextRequest) {
  const countryParam = request.nextUrl.searchParams.get("country");
  if (countryParam && countryParam.trim() !== "") {
    return NextResponse.next();
  }

  const raw = request.cookies.get(COUNTRY_COOKIE_NAME)?.value;
  if (!raw || !String(raw).trim()) {
    return NextResponse.next();
  }

  const normalized = normalizeCountryCode(raw);
  const url = request.nextUrl.clone();
  url.searchParams.set("country", normalized);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/categories/:path*", "/tags/:path*"],
};
