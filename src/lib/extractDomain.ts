import { normalizeBusinessDomain } from "@/lib/normalizeBusinessDomain";

export function extractDomain(url: string): string {
  return normalizeBusinessDomain(url);
}

/** Single https:// prefix; host matches `normalizeBusinessDomain`. */
export function normalizeSignupWebsiteInput(raw: string): string {
  const host = normalizeBusinessDomain(raw);
  if (!host) return "";
  return `https://${host}`;
}
