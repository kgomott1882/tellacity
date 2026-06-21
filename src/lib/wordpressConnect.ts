import axios from "axios";

/**
 * Normalize WordPress site base URL.
 * Allows http only for localhost-style hosts.
 */
export function normalizeWordPressSiteUrl(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  let withProtocol = trimmed;
  if (!/^https?:\/\//i.test(withProtocol)) {
    withProtocol = `https://${withProtocol}`;
  }
  let url: URL;
  try {
    url = new URL(withProtocol);
  } catch {
    return null;
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return null;
  const host = url.hostname.toLowerCase();
  const isLocal =
    host === "localhost" ||
    host === "127.0.0.1" ||
    host.endsWith(".local");
  if (url.protocol === "http:" && !isLocal) return null;
  return `${url.protocol}//${url.host}`.replace(/\/$/, "");
}

type WordPressDiscovery = {
  name?: string;
  namespaces?: string[];
};

/** Verify the site exposes the WordPress REST API (wp-json). */
export async function verifyWordPressSite(
  siteUrl: string,
): Promise<
  | { ok: true; site_name: string | null }
  | { ok: false; message: string }
> {
  const base = siteUrl.replace(/\/$/, "");

  try {
    const res = await axios.get(`${base}/wp-json/`, {
      timeout: 20_000,
      validateStatus: () => true,
      headers: { Accept: "application/json" },
    });

    if (res.status === 200 && res.data && typeof res.data === "object") {
      const data = res.data as WordPressDiscovery;
      if (Array.isArray(data.namespaces) && data.namespaces.length > 0) {
        const siteName =
          typeof data.name === "string" && data.name.trim() ? data.name.trim() : null;
        return { ok: true, site_name: siteName };
      }
    }

    if (res.status === 404) {
      return {
        ok: false,
        message:
          "This URL does not expose the WordPress REST API (/wp-json). Confirm WordPress is installed and permalinks are not set to Plain.",
      };
    }

    return {
      ok: false,
      message: `Site returned HTTP ${res.status}. Check the URL points to your WordPress home page.`,
    };
  } catch (e) {
    const msg = axios.isAxiosError(e) ? e.message : "Connection failed";
    return {
      ok: false,
      message: `Could not reach your WordPress site (${msg}). Check the URL and SSL certificate.`,
    };
  }
}
