const TELLACITY_HOSTS = new Set(["tellacity.com", "www.tellacity.com"]);

const URL_IN_TEXT_RE = /https?:\/\/[^\s<>"')\]]+/gi;

export function extractUrlsFromPlainText(text: string | null | undefined): string[] {
  if (!text?.trim()) return [];
  return [...text.matchAll(URL_IN_TEXT_RE)].map((m) => m[0].replace(/[.,;:!?)]+$/, ""));
}

export function normalizeHostname(hostname: string): string {
  return hostname.trim().toLowerCase().replace(/^www\./, "");
}

export function hostnameFromWebsiteField(raw: string | null | undefined): string | null {
  if (!raw?.trim()) return null;
  const value = raw.trim();
  try {
    const withProto = /^https?:\/\//i.test(value) ? value : `https://${value}`;
    return normalizeHostname(new URL(withProto).hostname);
  } catch {
    const cleaned = value.replace(/^https?:\/\//i, "").split("/")[0]?.split("?")[0];
    return cleaned ? normalizeHostname(cleaned) : null;
  }
}

export function parseHttpUrl(raw: string): URL | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  try {
    if (trimmed.startsWith("/")) return null;
    const withProto = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    const url = new URL(withProto);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url;
  } catch {
    return null;
  }
}

export function normalizeUrlForComparison(url: URL): string {
  const host = normalizeHostname(url.hostname);
  let path = url.pathname.replace(/\/+$/, "") || "";
  const search = url.search
    ? [...url.searchParams.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([k, v]) => `${k}=${v}`)
        .join("&")
    : "";
  return `${host}${path}${search ? `?${search}` : ""}`.toLowerCase();
}

export function isTellacityInternalLink(raw: string): boolean {
  const trimmed = raw.trim();
  if (!trimmed) return true;
  if (trimmed.startsWith("/")) return true;
  if (trimmed.startsWith("#")) return true;

  const url = parseHttpUrl(trimmed);
  if (!url) return trimmed.startsWith("/");

  const host = normalizeHostname(url.hostname);
  if (TELLACITY_HOSTS.has(host) || host.endsWith(".tellacity.com")) return true;
  return false;
}

export function isBusinessWebsiteLink(raw: string, businessWebsite: string | null | undefined): boolean {
  const businessHost = hostnameFromWebsiteField(businessWebsite);
  if (!businessHost) return false;

  const url = parseHttpUrl(raw);
  if (!url) return false;

  const linkHost = normalizeHostname(url.hostname);
  return linkHost === businessHost || linkHost.endsWith(`.${businessHost}`);
}

export function isExternalCountedLink(
  raw: string,
  businessWebsite: string | null | undefined,
): boolean {
  if (!raw.trim()) return false;
  if (isTellacityInternalLink(raw)) return false;
  if (isBusinessWebsiteLink(raw, businessWebsite)) return false;
  return parseHttpUrl(raw) !== null || raw.trim().startsWith("http");
}
