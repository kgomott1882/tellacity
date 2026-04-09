/** Trim whitespace and strip trailing slashes so Supabase redirect_to never gets a leading %20. */
function normalizeSiteBase(value: string): string {
  return value.trim().replace(/\/+$/, "");
}

export function getBaseUrl() {
  if (typeof window !== "undefined") {
    return normalizeSiteBase(window.location.origin);
  }

  if (process.env.NEXT_PUBLIC_SITE_URL) {
    const fromEnv = normalizeSiteBase(process.env.NEXT_PUBLIC_SITE_URL);
    if (fromEnv) return fromEnv;
  }

  return "http://localhost:3000";
}

/** Absolute app URL for Supabase `redirectTo` (password recovery, OAuth). `path` must start with `/`. */
export function authRedirectTo(path: string): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${getBaseUrl()}${p}`;
}
