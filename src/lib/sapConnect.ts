import axios from "axios";

type SapTokenResponse = {
  access_token?: string;
  token_type?: string;
  expires_in?: number;
  error?: string;
  error_description?: string;
};

export function normalizeSapHttpsUrl(raw: string): string | null {
  let trimmed = raw.trim();
  if (!trimmed) return null;
  if (!/^https?:\/\//i.test(trimmed)) {
    trimmed = `https://${trimmed}`;
  }
  try {
    const url = new URL(trimmed);
    if (url.protocol !== "https:") return null;
    url.hash = "";
    url.search = "";
    const normalized = url.toString().replace(/\/$/, "");
    return normalized || null;
  } catch {
    return null;
  }
}

function normalizeClientId(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed || trimmed.length < 4) return null;
  return trimmed;
}

function normalizeClientSecret(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed || trimmed.length < 8) return null;
  return trimmed;
}

function systemNameFromUrl(apiBaseUrl: string): string | null {
  try {
    const host = new URL(apiBaseUrl).hostname;
    return host || null;
  } catch {
    return null;
  }
}

function catalogServiceUrl(apiBaseUrl: string): string {
  const base = apiBaseUrl.replace(/\/$/, "");
  if (base.includes("/sap/opu/odata")) {
    return `${base.split("/sap/opu/odata")[0]}/sap/opu/odata/IWFND/CATALOGSERVICE;v=2/ServiceCollection`;
  }
  return `${base}/sap/opu/odata/IWFND/CATALOGSERVICE;v=2/ServiceCollection`;
}

async function probeSapApiAccess(
  apiBaseUrl: string,
  accessToken: string,
): Promise<{ ok: true } | { ok: false; status: number }> {
  const base = apiBaseUrl.replace(/\/$/, "");
  const probeUrls = [
    `${base}/$metadata`,
    base,
    catalogServiceUrl(apiBaseUrl),
  ];

  const uniqueUrls = [...new Set(probeUrls)];

  let lastStatus = 0;
  for (const url of uniqueUrls) {
    const res = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json, application/xml, text/xml",
      },
      timeout: 25_000,
      validateStatus: () => true,
    });
    lastStatus = res.status;
    if (res.status >= 200 && res.status < 300) {
      return { ok: true };
    }
    if (res.status === 401 || res.status === 403) {
      return { ok: false, status: res.status };
    }
  }

  return { ok: false, status: lastStatus };
}

/** Verify SAP OAuth client credentials and OData/API reachability. */
export async function verifySapCredentials(
  apiBaseUrlRaw: string,
  tokenUrlRaw: string,
  clientIdRaw: string,
  clientSecretRaw: string,
): Promise<
  | { ok: true; api_base_url: string; token_url: string; system_name: string | null }
  | { ok: false; message: string }
> {
  const apiBaseUrl = normalizeSapHttpsUrl(apiBaseUrlRaw);
  const tokenUrl = normalizeSapHttpsUrl(tokenUrlRaw);
  const clientId = normalizeClientId(clientIdRaw);
  const clientSecret = normalizeClientSecret(clientSecretRaw);

  if (!apiBaseUrl) {
    return {
      ok: false,
      message:
        "API base URL is invalid. Use your SAP system or OData service root, for example https://mycompany.s4hana.cloud.sap.",
    };
  }
  if (!tokenUrl) {
    return {
      ok: false,
      message:
        "Token URL is invalid. Use your OAuth token endpoint from the communication arrangement.",
    };
  }
  if (!clientId) return { ok: false, message: "Client ID is required." };
  if (!clientSecret) return { ok: false, message: "Client Secret is required." };

  try {
    const tokenRes = await axios.post<SapTokenResponse>(
      tokenUrl,
      new URLSearchParams({
        grant_type: "client_credentials",
        client_id: clientId,
        client_secret: clientSecret,
      }).toString(),
      {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        timeout: 25_000,
        validateStatus: () => true,
      },
    );

    if (tokenRes.status === 401 || tokenRes.status === 400) {
      const detail =
        tokenRes.data?.error_description ?? tokenRes.data?.error ?? "invalid_client";
      return {
        ok: false,
        message: `SAP rejected these credentials (${detail}). Check Client ID, Client Secret, and Token URL.`,
      };
    }

    const accessToken =
      typeof tokenRes.data?.access_token === "string" ? tokenRes.data.access_token.trim() : "";
    if (!accessToken) {
      return {
        ok: false,
        message: "SAP did not return an access token. Confirm the token URL and OAuth client setup.",
      };
    }

    const probe = await probeSapApiAccess(apiBaseUrl, accessToken);
    if (!probe.ok) {
      if (probe.status === 401 || probe.status === 403) {
        return {
          ok: false,
          message:
            "OAuth token was issued but SAP denied API access. Check OData service scopes and communication arrangement permissions.",
        };
      }
      return {
        ok: false,
        message:
          probe.status > 0
            ? `SAP API returned HTTP ${probe.status}. Verify the API base URL points to your OData service or system root.`
            : "Could not reach the SAP API. Verify the API base URL and network access.",
      };
    }

    return {
      ok: true,
      api_base_url: apiBaseUrl,
      token_url: tokenUrl,
      system_name: systemNameFromUrl(apiBaseUrl),
    };
  } catch (e) {
    const msg = axios.isAxiosError(e) ? e.message : "Connection failed";
    return {
      ok: false,
      message: `Could not reach SAP (${msg}). Check URLs and try again.`,
    };
  }
}
