import { getCookieConsent, hasFunctionalConsent, hasMarketingConsent } from "@/lib/cookieConsent";

export const RECENT_VIEWS_COOKIE = "tellacity_recent_views";
export const VISITOR_ID_COOKIE = "tellacity_vid";
export const UTM_COOKIE = "tellacity_utm";
/** Fired when recent-view cookies change (e.g. after a review is published). */
export const RECENT_VIEWS_UPDATED_EVENT = "tellacity_recent_views_updated";

const RECENT_VIEWS_MAX = 4;
const RECENT_VIEWS_MAX_AGE_SEC = 60 * 60 * 24 * 30;
const RECENT_REVIEW_SUPPRESS_KEY = "tellacity_recent_review_suppress";
const RECENT_REVIEW_SUPPRESS_MS = 30 * 60 * 1000;
const VISITOR_MAX_AGE_SEC = 60 * 60 * 24 * 400;
const UTM_MAX_AGE_SEC = 60 * 60 * 24 * 30;

export type RecentBusinessView = {
  slug: string;
  at: string;
};

export type UtmAttribution = {
  source?: string;
  medium?: string;
  campaign?: string;
  landedAt: string;
};

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const prefix = `${name}=`;
  const parts = document.cookie.split(";");
  for (const part of parts) {
    const trimmed = part.trim();
    if (trimmed.startsWith(prefix)) {
      return decodeURIComponent(trimmed.slice(prefix.length));
    }
  }
  return null;
}

function writeCookie(name: string, value: string, maxAgeSec: number): void {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAgeSec}; SameSite=Lax`;
}

function deleteCookie(name: string): void {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=; Path=/; Max-Age=0; SameSite=Lax`;
}

function parseRecentViews(raw: string | null): RecentBusinessView[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    const out: RecentBusinessView[] = [];
    for (const item of parsed) {
      if (!item || typeof item !== "object") continue;
      const slug = String((item as { slug?: unknown }).slug ?? "")
        .trim()
        .toLowerCase();
      const at = String((item as { at?: unknown }).at ?? "").trim();
      if (!slug || !at) continue;
      out.push({ slug, at });
    }
    return out;
  } catch {
    return [];
  }
}

export function getRecentBusinessViews(): RecentBusinessView[] {
  if (!hasFunctionalConsent()) return [];
  return parseRecentViews(readCookie(RECENT_VIEWS_COOKIE)).slice(0, RECENT_VIEWS_MAX);
}

type RecentReviewSuppress = {
  slug: string;
  at: string;
};

function readRecentReviewSuppressions(): RecentReviewSuppress[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.sessionStorage.getItem(RECENT_REVIEW_SUPPRESS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    const out: RecentReviewSuppress[] = [];
    for (const item of parsed) {
      if (!item || typeof item !== "object") continue;
      const slug = String((item as { slug?: unknown }).slug ?? "")
        .trim()
        .toLowerCase();
      const at = String((item as { at?: unknown }).at ?? "").trim();
      if (!slug || !at) continue;
      out.push({ slug, at });
    }
    return out;
  } catch {
    return [];
  }
}

function writeRecentReviewSuppressions(items: RecentReviewSuppress[]): void {
  if (typeof window === "undefined") return;
  try {
    if (items.length === 0) {
      window.sessionStorage.removeItem(RECENT_REVIEW_SUPPRESS_KEY);
      return;
    }
    window.sessionStorage.setItem(RECENT_REVIEW_SUPPRESS_KEY, JSON.stringify(items));
  } catch {
    /* ignore */
  }
}

function pruneRecentReviewSuppressions(items: RecentReviewSuppress[]): RecentReviewSuppress[] {
  const cutoff = Date.now() - RECENT_REVIEW_SUPPRESS_MS;
  return items.filter((item) => {
    const at = new Date(item.at).getTime();
    return Number.isFinite(at) && at > cutoff;
  });
}

function getActiveRecentReviewSuppressSlugs(): Set<string> {
  const pruned = pruneRecentReviewSuppressions(readRecentReviewSuppressions());
  writeRecentReviewSuppressions(pruned);
  return new Set(pruned.map((item) => item.slug));
}

function notifyRecentViewsUpdated(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(RECENT_VIEWS_UPDATED_EVENT));
}

/** Hide a business from “Pick up where you left off” for 30 minutes after a review is published. */
export function recordRecentBusinessReviewPublished(slug: string): void {
  if (!hasFunctionalConsent()) return;
  const normalized = slug.trim().toLowerCase();
  if (!normalized) return;

  const existingViews = parseRecentViews(readCookie(RECENT_VIEWS_COOKIE)).filter(
    (view) => view.slug !== normalized,
  );
  writeCookie(
    RECENT_VIEWS_COOKIE,
    JSON.stringify(existingViews),
    RECENT_VIEWS_MAX_AGE_SEC,
  );

  const now = new Date().toISOString();
  const suppressed = pruneRecentReviewSuppressions(readRecentReviewSuppressions()).filter(
    (item) => item.slug !== normalized,
  );
  writeRecentReviewSuppressions([{ slug: normalized, at: now }, ...suppressed]);
  notifyRecentViewsUpdated();
}

/** Recent profile views minus businesses reviewed in the last 30 minutes. */
export function getRecentBusinessViewsForDisplay(): RecentBusinessView[] {
  if (!hasFunctionalConsent()) return [];
  const suppressed = getActiveRecentReviewSuppressSlugs();
  return getRecentBusinessViews().filter((view) => !suppressed.has(view.slug));
}

export function recordBusinessProfileView(slug: string): void {
  if (!hasFunctionalConsent()) return;
  const normalized = slug.trim().toLowerCase();
  if (!normalized) return;
  if (getActiveRecentReviewSuppressSlugs().has(normalized)) return;

  const now = new Date().toISOString();
  const existing = parseRecentViews(readCookie(RECENT_VIEWS_COOKIE)).filter(
    (v) => v.slug !== normalized,
  );
  const next = [{ slug: normalized, at: now }, ...existing].slice(0, RECENT_VIEWS_MAX);
  writeCookie(RECENT_VIEWS_COOKIE, JSON.stringify(next), RECENT_VIEWS_MAX_AGE_SEC);
  notifyRecentViewsUpdated();
}

export function getOrCreateVisitorId(): string | null {
  if (!hasMarketingConsent()) return null;
  const existing = readCookie(VISITOR_ID_COOKIE)?.trim();
  if (existing) return existing;

  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `tc_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  writeCookie(VISITOR_ID_COOKIE, id, VISITOR_MAX_AGE_SEC);
  return id;
}

export function captureUtmFromUrl(): void {
  if (!hasMarketingConsent() || typeof window === "undefined") return;
  if (readCookie(UTM_COOKIE)) return;

  const params = new URLSearchParams(window.location.search);
  const source = params.get("utm_source")?.trim();
  const medium = params.get("utm_medium")?.trim();
  const campaign = params.get("utm_campaign")?.trim();
  if (!source && !medium && !campaign) return;

  const payload: UtmAttribution = {
    landedAt: new Date().toISOString(),
    ...(source ? { source } : {}),
    ...(medium ? { medium } : {}),
    ...(campaign ? { campaign } : {}),
  };
  writeCookie(UTM_COOKIE, JSON.stringify(payload), UTM_MAX_AGE_SEC);
}

export function getUtmAttribution(): UtmAttribution | null {
  if (!hasMarketingConsent()) return null;
  const raw = readCookie(UTM_COOKIE);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as UtmAttribution;
    if (!parsed || typeof parsed !== "object") return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearFunctionalFirstPartyCookies(): void {
  deleteCookie(RECENT_VIEWS_COOKIE);
}

export function clearMarketingFirstPartyCookies(): void {
  deleteCookie(VISITOR_ID_COOKIE);
  deleteCookie(UTM_COOKIE);
}

/** Re-apply first-party cookies after the user updates consent. */
export function syncFirstPartyCookiesAfterConsent(): void {
  const consent = getCookieConsent();
  if (!consent) {
    clearFunctionalFirstPartyCookies();
    clearMarketingFirstPartyCookies();
    return;
  }
  if (!consent.functional) clearFunctionalFirstPartyCookies();
  if (!consent.marketing) clearMarketingFirstPartyCookies();
  if (consent.marketing) {
    getOrCreateVisitorId();
    captureUtmFromUrl();
  }
}
