import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();

  // ----------------------------------------
  // KEEP EXISTING: Canonical cleanup
  // ----------------------------------------
  if (url.pathname.startsWith("/b/") && url.searchParams.has("country")) {
    url.searchParams.delete("country");
    return NextResponse.redirect(url);
  }

  // ----------------------------------------
  // PROTECT BUSINESS ROUTES: cookie session presence only (no DB / ownership checks here).
  // ----------------------------------------
  if (url.pathname.startsWith("/business")) {
    const publicRoutes = [
      "/business/signup",
      "/business/login",
      "/business/forgot-password",
      "/business/reset-password",
    ];

    if (publicRoutes.some((route) => url.pathname.startsWith(route))) {
      return NextResponse.next();
    }

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name) {
            return request.cookies.get(name)?.value;
          },
          set() {},
          remove() {},
        },
      }
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      const loginUrl = new URL("/business/login", request.url);
      const returnTo = `${url.pathname}${url.search || ""}`;
      if (returnTo && returnTo !== "/business/login") {
        loginUrl.searchParams.set("next", returnTo);
      }
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/b/:path*", "/business/:path*"],
};
