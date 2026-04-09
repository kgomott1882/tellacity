import axios from "axios";

/**
 * Normalize store URL to origin with path stripped (Woo REST lives at /wp-json/wc/v3).
 * Allows http only for localhost-style hosts (local WordPress dev).
 */
export function normalizeWooCommerceSiteUrl(raw: string): string | null {
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

/** Verify WooCommerce REST credentials (WC v3). */
export async function verifyWooCommerceRestCredentials(
  siteUrl: string,
  consumerKey: string,
  consumerSecret: string
): Promise<{ ok: true } | { ok: false; message: string }> {
  const base = siteUrl.replace(/\/$/, "");
  const auth = {
    username: consumerKey.trim(),
    password: consumerSecret.trim(),
  };
  const tryGet = async (path: string) =>
    axios.get(`${base}${path}`, {
      auth,
      timeout: 20_000,
      validateStatus: () => true,
    });

  try {
    let res = await tryGet("/wp-json/wc/v3/system_status");
    if (res.status === 404) {
      res = await tryGet("/wp-json/wc/v3/products?per_page=1");
    }
    if (res.status === 200 && res.data && typeof res.data === "object") {
      return { ok: true };
    }
    if (res.status === 401 || res.status === 403) {
      return {
        ok: false,
        message: "WooCommerce rejected these credentials. Check the key, secret, and permissions (Read/Write).",
      };
    }
    if (res.status === 404) {
      return {
        ok: false,
        message:
          "Could not reach WooCommerce REST API. Confirm the site URL, that WooCommerce is installed, and that permalinks are not set to Plain (WordPress Settings → Permalinks).",
      };
    }
    return {
      ok: false,
      message: `Store returned HTTP ${res.status}. Check the site URL and that the REST API is enabled.`,
    };
  } catch (e) {
    const msg = axios.isAxiosError(e) ? e.message : "Connection failed";
    return {
      ok: false,
      message: `Could not reach your store (${msg}). Check the URL and SSL certificate.`,
    };
  }
}
