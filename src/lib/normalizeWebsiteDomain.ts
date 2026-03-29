/**
 * Canonical website host for storage and duplicate checks:
 * trim, lowercase, strip http(s)://, strip leading www., first path segment only.
 *
 * @example
 * normalizeWebsiteDomain("https://haregon.com") // "haregon.com"
 * normalizeWebsiteDomain("http://www.haregon.com") // "haregon.com"
 * normalizeWebsiteDomain("haregon.com") // "haregon.com"
 */
export function normalizeWebsiteDomain(input: string): string {
  if (!input) return "";

  let value = input.trim().toLowerCase();

  while (/^https?:\/\//.test(value)) {
    value = value.replace(/^https?:\/\//, "");
  }

  value = value.replace(/\/+$/, "");
  value = value.split("/")[0] ?? value;

  while (value.startsWith("www.")) {
    value = value.slice(4);
  }

  return value;
}
