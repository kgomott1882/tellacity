/**
 * Common consumer / free email hosts , no business name hint from these domains.
 */
const GENERIC_EMAIL_HOSTS = new Set([
  "gmail.com",
  "googlemail.com",
  "yahoo.com",
  "yahoo.co.uk",
  "yahoo.co.za",
  "hotmail.com",
  "hotmail.co.uk",
  "outlook.com",
  "live.com",
  "live.co.uk",
  "msn.com",
  "icloud.com",
  "me.com",
  "mac.com",
  "protonmail.com",
  "proton.me",
  "aol.com",
  "mail.com",
  "zoho.com",
  "yandex.com",
  "gmx.com",
  "gmx.net",
  "hey.com",
  "fastmail.com",
  "tutanota.com",
  "inbox.com",
  "pm.me",
  "duck.com",
  "email.com",
]);

/**
 * Derives a short search hint from a work email (e.g. `kwena@haregon.com` → `Haregon`).
 * Uses the first label of the domain (before the first dot). Returns `""` for generic
 * providers or invalid input so we do not pre-fill junk.
 */
export function emailDomainToBusinessSearchHint(email: string): string {
  const raw = email.trim().toLowerCase();
  const at = raw.indexOf("@");
  if (at < 1) return "";
  let host = raw.slice(at + 1).replace(/^www\./, "").trim();
  if (!host || !host.includes(".")) return "";
  if (GENERIC_EMAIL_HOSTS.has(host)) return "";

  const firstLabel = host.split(".")[0] ?? "";
  if (!firstLabel || firstLabel.length < 2) return "";
  if (/^\d+$/.test(firstLabel)) return "";

  return (
    firstLabel.charAt(0).toUpperCase() + firstLabel.slice(1).toLowerCase()
  );
}
