import axios from "axios";

/**
 * Normalize Magento store base URL (REST lives at /rest/V1 or /rest/{storeCode}/V1).
 * Allows http only for localhost-style hosts.
 */
export function normalizeMagentoSiteUrl(raw: string): string | null {
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

export function normalizeMagentoStoreCode(raw: string | null | undefined): string {
  const trimmed = (raw ?? "").trim().toLowerCase();
  if (!trimmed) return "default";
  if (!/^[a-z0-9_-]+$/.test(trimmed)) return "default";
  return trimmed;
}

/** Verify Magento 2 REST credentials using an integration access token (Bearer). */
export async function verifyMagentoRestCredentials(
  siteUrl: string,
  accessToken: string,
  storeCode: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const base = siteUrl.replace(/\/$/, "");
  const token = accessToken.trim();
  if (!token) {
    return { ok: false, message: "Access token is required." };
  }

  const restPaths = [
    `/rest/${storeCode}/V1/store/storeConfigs`,
    `/rest/V1/store/storeConfigs`,
    `/rest/${storeCode}/V1/store/storeViews`,
    `/rest/V1/store/storeViews`,
  ];

  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: "application/json",
  };

  let lastStatus: number | null = null;

  for (const path of restPaths) {
    try {
      const res = await axios.get(`${base}${path}`, {
        headers,
        timeout: 20_000,
        validateStatus: () => true,
      });
      lastStatus = res.status;
      if (res.status === 200 && res.data != null) {
        return { ok: true };
      }
      if (res.status === 401 || res.status === 403) {
        return {
          ok: false,
          message:
            "Magento rejected this access token. Create an integration in Admin, activate it, and paste the access token with Sales/API permissions.",
        };
      }
    } catch (e) {
      const msg = axios.isAxiosError(e) ? e.message : "Connection failed";
      return {
        ok: false,
        message: `Could not reach your Magento store (${msg}). Check the URL and SSL certificate.`,
      };
    }
  }

  if (lastStatus === 404) {
    return {
      ok: false,
      message:
        "Could not reach the Magento REST API. Confirm the store URL, that Web API is enabled, and try store code “default” unless you use a multi-store code.",
    };
  }

  return {
    ok: false,
    message: `Store returned HTTP ${lastStatus ?? "error"}. Check the URL, access token, and store code.`,
  };
}
