import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Exchange OAuth PKCE `?code=` on /auth/callback and attach session cookies to the
 * redirect response. Server Components cannot set cookies; middleware can.
 */
export async function handleAuthCallbackCodeExchange(
  request: NextRequest,
): Promise<NextResponse | null> {
  if (request.nextUrl.pathname !== "/auth/callback") {
    return null;
  }

  const code = request.nextUrl.searchParams.get("code");
  if (!code) {
    return null;
  }

  const redirectUrl = request.nextUrl.clone();
  redirectUrl.searchParams.delete("code");
  const response = NextResponse.redirect(redirectUrl);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    return response;
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(
        cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[],
      ) {
        for (const { name, value, options } of cookiesToSet) {
          request.cookies.set(name, value);
          response.cookies.set(
            name,
            value,
            options as Parameters<typeof response.cookies.set>[2],
          );
        }
      },
    },
  });

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    console.error("[auth/callback middleware] exchangeCodeForSession:", error.message);
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/auth/login";
    loginUrl.searchParams.delete("code");
    loginUrl.searchParams.set("error", error.message);
    const next = redirectUrl.searchParams.get("next");
    if (next) {
      loginUrl.searchParams.set("next", next);
    }
    return NextResponse.redirect(loginUrl);
  }

  return response;
}
