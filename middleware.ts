import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const ALLOWED_COUNTRIES = ["US", "ZA", "GB", "AU", "CA", "NZ", "IE"];

function normalizeCountry(raw: string | null | undefined): string | null {
  const upper = String(raw ?? "").trim().toUpperCase();
  if (!upper) return null;
  const normalized = upper === "UK" ? "GB" : upper;
  return ALLOWED_COUNTRIES.includes(normalized) ? normalized : null;
}

/**
 * Internal admin app only: `/admin` and `/admin/*`.
 * Does not match `/administrator` or other prefixes.
 */
function isAdminPathname(pathname: string): boolean {
  return pathname === "/admin" || pathname.startsWith("/admin/");
}

export async function middleware(request: NextRequest) {
  const url = request.nextUrl;
  const pathname = url.pathname;

  // Skip static files + API routes (unchanged)
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // -------------------------------------------------------------------------
  // Admin: isolated from consumer country redirects and any dashboard routing.
  // Session refresh only; layout + RequireAdmin handle access control.
  // -------------------------------------------------------------------------
  if (isAdminPathname(pathname)) {
    let response = NextResponse.next({ request });
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
            response = NextResponse.next({ request });
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            );
          },
        },
      }
    );
    await supabase.auth.getUser();
    return response;
  }

  // -------------------------------------------------------------------------
  // Consumer / marketing country handling (unchanged for non-admin routes)
  // -------------------------------------------------------------------------

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
