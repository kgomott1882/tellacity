import { normalizeWebsiteDomain } from "@/lib/normalizeWebsiteDomain";

/** Same rules as {@link normalizeWebsiteDomain} (email host or website host). */
export function normalizeBusinessDomain(input: string): string {
  return normalizeWebsiteDomain(input);
}
