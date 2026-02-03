/**
 * Ensure Logo.dev URLs have token and fallback so they load in <img>.
 * RPC returns https://img.logo.dev/domain without token; Logo.dev requires ?token= for image requests.
 */
export const normalizeLogoUrl = (
  rawUrl?: string | null
): string | null => {
  if (!rawUrl) {
    return null;
  }

  if (rawUrl.includes("img.logo.dev")) {
    try {
      const parsed = new URL(rawUrl);
      parsed.searchParams.set("fallback", "404");
      if (!parsed.searchParams.has("token")) {
        const token =
          typeof process !== "undefined" && process.env?.NEXT_PUBLIC_LOGO_DEV_TOKEN?.trim();
        if (token) parsed.searchParams.set("token", token);
      }
      return parsed.toString();
    } catch {
      return rawUrl;
    }
  }

  return rawUrl;
};

const EDGE_FUNCTION_NAME = "resolve-business-logo";

/**
 * Extract hostname/domain from a URL or website string (e.g. "https://example.com" -> "example.com").
 */
export function domainFromWebsite(website: string | null | undefined): string | null {
  if (!website || typeof website !== "string") return null;
  const trimmed = website.trim();
  if (!trimmed) return null;
  try {
    const url = trimmed.startsWith("http") ? new URL(trimmed) : new URL(`https://${trimmed}`);
    const host = url.hostname.replace(/^www\./, "");
    return host || null;
  } catch {
    return trimmed.replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0] || null;
  }
}

/**
 * Build Logo.dev image URL for a domain (client-side fallback when edge function is unavailable).
 * Requires NEXT_PUBLIC_LOGO_DEV_TOKEN. Returns null if token missing.
 */
export function getLogoDevUrl(domain: string | null | undefined): string | null {
  if (!domain || typeof domain !== "string" || !domain.trim()) return null;
  const token =
    typeof process !== "undefined" && process.env?.NEXT_PUBLIC_LOGO_DEV_TOKEN?.trim();
  if (!token) return null;
  const normalized = domainFromWebsite(domain) ?? domain.trim().replace(/^www\./, "");
  if (!normalized) return null;
  try {
    const url = `https://img.logo.dev/${encodeURIComponent(normalized)}?token=${encodeURIComponent(token)}&fallback=404`;
    return normalizeLogoUrl(url) ?? url;
  } catch {
    return null;
  }
}

/** Supabase client type for invoke (avoid hard dependency on full type). */
type SupabaseClientLike = {
  functions: {
    invoke: (
      name: string,
      options: { body?: Record<string, unknown> }
    ) => Promise<{ data: unknown; error: unknown }>;
  };
};

/**
 * Call resolve-business-logo edge function (Logo.dev); token lives in Supabase secrets.
 * Uses the same auth/headers as other Supabase calls. Returns logo URL or null.
 * Always sends a clean domain (e.g. aurecongroup.com), not a full URL.
 * Falls back to client getLogoDevUrl only when the edge function fails.
 */
export async function resolveBusinessLogoViaClient(
  supabase: SupabaseClientLike,
  domainOrUrl: string
): Promise<string | null> {
  if (!domainOrUrl || typeof domainOrUrl !== "string" || !domainOrUrl.trim()) return null;
  const d =
    domainFromWebsite(domainOrUrl.trim()) ??
    (domainOrUrl.trim().replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0] || null);
  if (!d) return null;
  try {
    const { data, error } = await supabase.functions.invoke(EDGE_FUNCTION_NAME, {
      body: { domain: d },
    });
    if (!error && data) {
      const obj = data as { url?: string; logoUrl?: string } | null;
      const url = (obj?.url ?? obj?.logoUrl ?? "").toString().trim();
      if (url) return normalizeLogoUrl(url) ?? url;
    }
    return getLogoDevUrl(d);
  } catch {
    return getLogoDevUrl(d);
  }
}

/**
 * Call Supabase Edge Function resolve-business-logo via raw fetch (fallback).
 * Prefer resolveBusinessLogoViaClient when you have a Supabase client.
 */
export async function resolveBusinessLogo(domain: string): Promise<string | null> {
  if (!domain || typeof domain !== "string" || !domain.trim()) return null;
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!baseUrl || !anonKey) return getLogoDevUrl(domain);
  try {
    const res = await fetch(`${baseUrl}/functions/v1/${EDGE_FUNCTION_NAME}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
      },
      body: JSON.stringify({ domain: domain.trim() }),
    });
    if (res.ok) {
      const data = (await res.json().catch(() => null)) as { url?: string; logoUrl?: string } | null;
      if (data) {
        const url = data.url ?? data.logoUrl ?? null;
        if (typeof url === "string" && url.trim()) return normalizeLogoUrl(url) ?? url;
      }
    }
    return getLogoDevUrl(domain);
  } catch {
    return getLogoDevUrl(domain);
  }
}
