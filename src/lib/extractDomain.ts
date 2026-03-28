export function extractDomain(url: string): string {
  if (!url) return "";

  try {
    let cleaned = url.trim().toLowerCase();

    // Remove protocol
    cleaned = cleaned.replace(/^https?:\/\//, "");

    // Remove www
    cleaned = cleaned.replace(/^www\./, "");

    // Remove path
    cleaned = cleaned.split("/")[0];

    return cleaned;
  } catch {
    return "";
  }
}
