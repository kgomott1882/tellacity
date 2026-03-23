import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();

  // Force redirect for business pages with ?country.
  if (url.pathname.startsWith("/b/") && url.searchParams.has("country")) {
    url.searchParams.delete("country");
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/b/:path*"],
};
