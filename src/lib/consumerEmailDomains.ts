/**
 * Domains treated as personal / webmail for admin user buckets.
 * Auth users whose email domain is NOT in this set (and not @tellacity.auth) count as
 * "business domain" accounts for overview Business users + Business users list.
 */
const RAW_CONSUMER_DOMAINS = [
  "gmail.com",
  "googlemail.com",
  "yahoo.com",
  "yahoo.co.uk",
  "yahoo.fr",
  "yahoo.de",
  "yahoo.ca",
  "yahoo.com.au",
  "yahoo.co.jp",
  "hotmail.com",
  "hotmail.co.uk",
  "outlook.com",
  "outlook.co.uk",
  "live.com",
  "live.co.uk",
  "msn.com",
  "icloud.com",
  "me.com",
  "mac.com",
  "aol.com",
  "protonmail.com",
  "proton.me",
  "pm.me",
  "gmx.com",
  "gmx.net",
  "gmx.de",
  "mail.com",
  "yandex.com",
  "yandex.ru",
  "fastmail.com",
  "hey.com",
  "tutanota.com",
  "tutamail.com",
  "mailbox.org",
  "163.com",
  "qq.com",
  "126.com",
  "sina.com",
  "naver.com",
  "daum.net",
  "hanmail.net",
  "bluewin.ch",
  "web.de",
  "online.de",
  "t-online.de",
  "rocketmail.com",
  "ymail.com",
  "bellsouth.net",
  "comcast.net",
  "verizon.net",
  "att.net",
  "sbcglobal.net",
  "cox.net",
  "charter.net",
  "earthlink.net",
  "juno.com",
  "btinternet.com",
  "virginmedia.com",
  "orange.fr",
  "wanadoo.fr",
  "free.fr",
  "laposte.net",
  "libero.it",
  "virgilio.it",
  "alice.it",
  "tin.it",
  "ziggo.nl",
  "xs4all.nl",
  "hetnet.nl",
  "home.nl",
  "telus.net",
  "shaw.ca",
  "rogers.com",
  "bell.net",
  "videotron.ca",
  "sky.com",
  "talktalk.net",
  "ntlworld.com",
  "blueyonder.co.uk",
] as const;

const CONSUMER_SET = new Set<string>(RAW_CONSUMER_DOMAINS.map((d) => d.toLowerCase()));

export function emailDomainLower(email: string | null | undefined): string | null {
  if (!email) return null;
  const t = email.trim().toLowerCase();
  const i = t.lastIndexOf("@");
  if (i < 0 || i === t.length - 1) return null;
  const d = t.slice(i + 1).trim();
  return d || null;
}

/** True when the address uses a known personal/webmail domain (e.g. gmail.com). */
export function isLikelyConsumerWebmailEmail(email: string | null | undefined): boolean {
  const d = emailDomainLower(email);
  if (!d) return false;
  return CONSUMER_SET.has(d);
}

/**
 * Custom / org domain on auth email: not Tellacity placeholder, not webmail list.
 * Used to fold addresses like admin@capitaldigitizing.com into the business bucket.
 */
export function isLikelyCustomBusinessDomainEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const t = email.trim().toLowerCase();
  if (!t.includes("@")) return false;
  if (t.includes("@tellacity.auth")) return false;
  return !isLikelyConsumerWebmailEmail(email);
}
