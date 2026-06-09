export const normalizeLogoUrl = (rawUrl?: string | null): string | null => {
  if (!rawUrl || typeof rawUrl !== "string") return null;
  const trimmed = rawUrl.trim();
  return trimmed || null;
};

type Input = {
  resolved_logo_url?: string | null;
  logo_url?: string | null;
  website?: string | null;
};

function isLogoDevUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  return url.includes("img.logo.dev");
}

function isGoogleFaviconUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  return /google\.com\/s2\/favicons/i.test(url);
}

function usableStoredLogoUrl(raw: string | null | undefined): string | null {
  const normalized = normalizeLogoUrl(String(raw ?? "").trim());
  if (!normalized) return null;
  if (isLogoDevUrl(normalized)) return null;
  if (isGoogleFaviconUrl(normalized)) return null;
  return normalized;
}

/** Returns a stored logo URL only — no website favicon fallback. */
export function similarBusinessLogoUrl(row: Input): string | null {
  const fromResolved = usableStoredLogoUrl(row.resolved_logo_url);
  if (fromResolved) return fromResolved;

  return usableStoredLogoUrl(row.logo_url);
}
