import { parseHttpUrl, normalizeHostname } from "./urlUtils";

/** Extensible affiliate query parameter names (case-insensitive). */
export const AFFILIATE_QUERY_PARAM_PATTERNS: RegExp[] = [
  /^ref$/i,
  /^affiliate$/i,
  /^aff_id$/i,
  /^affiliate_id$/i,
  /^partner$/i,
  /^partner_id$/i,
  /^utm_affiliate$/i,
  /^tag$/i,
  /^assoc/i,
  /^ascsubtag$/i,
  /^camp$/i,
  /^click_?id$/i,
  /^anclid$/i,
  /^referral$/i,
  /^referrer$/i,
  /^aff$/i,
  /^affsub/i,
  /^subid$/i,
  /^sub_id$/i,
];

/** Host/path hints commonly used by affiliate networks. */
export const AFFILIATE_HOST_OR_PATH_PATTERNS: RegExp[] = [
  /(^|\.)shareasale\.com$/i,
  /(^|\.)clickbank\.(com|net)$/i,
  /(^|\.)rakuten\.com$/i,
  /(^|\.)impact\.com$/i,
  /(^|\.)cj\.com$/i,
  /(^|\.)awin1\.com$/i,
  /(^|\.)partnerstack\.com$/i,
  /(^|\.)amzn\.to$/i,
  /\/affiliate/i,
  /\/referral/i,
  /\/ref\/[a-z0-9_-]+/i,
];

export const URL_SHORTENER_DOMAINS = new Set([
  "bit.ly",
  "bitly.com",
  "tinyurl.com",
  "t.co",
  "goo.gl",
  "shorturl.at",
  "ow.ly",
  "buff.ly",
  "tiny.cc",
  "rebrand.ly",
  "is.gd",
  "v.gd",
  "cutt.ly",
  "short.link",
  "rb.gy",
  "soo.gd",
  "bl.ink",
  "clck.ru",
  "t.ly",
  "qr.ae",
  "adf.ly",
  "lnkd.in",
  "tiny.one",
  "s.id",
  "shorte.st",
  "bc.vc",
  "j.mp",
  "gg.gg",
  "u.to",
  "yourls.org",
  "hyperurl.co",
  "trib.al",
  "dlvr.it",
]);

export const GAMBLING_HOST_KEYWORDS = [
  "casino",
  "betting",
  "sportsbook",
  "poker",
  "gambling",
  "wager",
  "jackpot",
  "slot",
  "baccarat",
  "roulette",
  "draftkings",
  "fanduel",
  "bet365",
  "bwin",
  "unibet",
  "pinnacle",
  "888casino",
  "williamhill",
];

export const ADULT_HOST_KEYWORDS = [
  "porn",
  "xxx",
  "sex",
  "adult",
  "escort",
  "camgirl",
  "onlyfans",
  "xhamster",
  "pornhub",
  "redtube",
  "youporn",
  "chaturbate",
  "stripchat",
  "brazzers",
  "hentai",
  "nsfw",
];

export const UNSAFE_DOWNLOAD_EXTENSIONS = [
  ".exe",
  ".apk",
  ".msi",
  ".bat",
  ".cmd",
  ".scr",
  ".dll",
  ".dmg",
  ".pkg",
  ".jar",
  ".vbs",
  ".ps1",
  ".reg",
  ".hta",
];

export const SUSPICIOUS_DOWNLOAD_HOST_KEYWORDS = [
  "download",
  "warez",
  "crack",
  "keygen",
  "serial",
  "torrent",
  "nulled",
  "malware",
];

function hostAndPath(url: URL): string {
  return `${normalizeHostname(url.hostname)}${url.pathname}`.toLowerCase();
}

export function isAffiliateLink(raw: string): boolean {
  const url = parseHttpUrl(raw);
  if (!url) return false;

  for (const [key] of url.searchParams.entries()) {
    if (AFFILIATE_QUERY_PARAM_PATTERNS.some((pattern) => pattern.test(key))) {
      return true;
    }
  }

  const host = normalizeHostname(url.hostname);
  const blob = `${host}${url.pathname}${url.search}`.toLowerCase();

  if (/amazon\.(com|[a-z]{2}|co\.uk|de|fr|it|es|ca|com\.au)/i.test(host) && url.searchParams.has("tag")) {
    return true;
  }

  return AFFILIATE_HOST_OR_PATH_PATTERNS.some((pattern) => pattern.test(blob));
}

export function isUrlShortener(raw: string): boolean {
  const url = parseHttpUrl(raw);
  if (!url) return false;

  const host = normalizeHostname(url.hostname);
  if (URL_SHORTENER_DOMAINS.has(host)) return true;

  if (/^[a-z0-9-]{2,12}\.(ly|gd|cc|at|io|me|link|click)$/i.test(host) && url.pathname.length <= 12) {
    return true;
  }

  return false;
}

export function isGamblingLink(raw: string): boolean {
  const url = parseHttpUrl(raw);
  if (!url) return false;
  const blob = hostAndPath(url);
  return GAMBLING_HOST_KEYWORDS.some((kw) => blob.includes(kw));
}

export function isAdultLink(raw: string): boolean {
  const url = parseHttpUrl(raw);
  if (!url) return false;
  const blob = hostAndPath(url);
  return ADULT_HOST_KEYWORDS.some((kw) => blob.includes(kw));
}

export function isUnsafeDownloadLink(raw: string): boolean {
  const url = parseHttpUrl(raw);
  if (!url) return false;

  const path = url.pathname.toLowerCase();
  const ext = path.includes(".") ? path.slice(path.lastIndexOf(".")) : "";
  if (ext && UNSAFE_DOWNLOAD_EXTENSIONS.includes(ext)) {
    return true;
  }

  const blob = hostAndPath(url);
  if (SUSPICIOUS_DOWNLOAD_HOST_KEYWORDS.some((kw) => blob.includes(kw)) && ext) {
    return true;
  }

  return false;
}
