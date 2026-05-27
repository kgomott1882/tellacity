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

function domainFromWebsite(website: string | null | undefined): string | null {
  if (!website || typeof website !== "string") return null;
  let s = website.trim();
  if (!s) return null;
  try {
    if (!/^https?:\/\//i.test(s)) s = `https://${s}`;
    const u = new URL(s);
    const host = u.hostname.replace(/^www\./i, "");
    return host || null;
  } catch {
    const host = s
      .replace(/^https?:\/\//i, "")
      .split("/")[0]
      ?.replace(/^www\./i, "")
      ?.trim();
    return host || null;
  }
}

function isLogoDevUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  return url.includes("img.logo.dev");
}

/** Free favicon fallback when stored logo is missing (avoids Logo.dev rate limits in the browser). */
export function googleFaviconLogoUrl(
  domain: string,
  size: 128 | 256 = 128,
): string {
  return `https://www.google.com/s2/favicons?sz=${size}&domain=${encodeURIComponent(domain)}`;
}

export function similarBusinessLogoUrl(row: Input): string | null {
  const fromResolved = normalizeLogoUrl(
    String(row.resolved_logo_url ?? "").trim(),
  );
  if (fromResolved && !isLogoDevUrl(fromResolved)) return fromResolved;

  const fromLogo = normalizeLogoUrl(String(row.logo_url ?? "").trim());
  if (fromLogo && !isLogoDevUrl(fromLogo)) return fromLogo;

  const domain = domainFromWebsite(row.website);
  if (!domain) return null;

  return googleFaviconLogoUrl(domain);
}
