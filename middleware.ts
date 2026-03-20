import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const ALLOWED_COUNTRIES = ["US", "ZA", "GB", "AU", "CA", "NZ", "IE"];

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

  // Detect country from Vercel
  const detected = request.headers.get("x-vercel-ip-country") || "US";

  // Normalize to supported countries
  const country = ALLOWED_COUNTRIES.includes(detected) ? detected : "US";

  // Append to URL
  url.searchParams.set("country", country);

  return NextResponse.redirect(url);
}
