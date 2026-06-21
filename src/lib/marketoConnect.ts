import axios from "axios";

/** Normalize Marketo REST API base URL (e.g. https://xxx-xxx-xxx.mktorest.com). */
export function normalizeMarketoRestEndpoint(raw: string): string | null {
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
  if (url.protocol !== "https:") return null;
  if (!url.hostname) return null;
  return `https://${url.host}`.replace(/\/$/, "");
}

export function normalizeMarketoClientId(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed || trimmed.length < 8) return null;
  return trimmed;
}

export function normalizeMarketoClientSecret(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed || trimmed.length < 8) return null;
  return trimmed;
}

export function normalizeMarketoMunchkinId(raw: string | null | undefined): string | null {
  const trimmed = (raw ?? "").trim();
  if (!trimmed) return null;
  if (!/^[A-Za-z0-9-]{3,32}$/.test(trimmed)) return null;
  return trimmed;
}

type MarketoTokenResponse = {
  access_token?: string;
  token_type?: string;
  expires_in?: number;
  scope?: string;
  error?: string;
  error_description?: string;
};

/** Verify Marketo REST credentials via client-credentials OAuth, then a lightweight API call. */
export async function verifyMarketoCredentials(
  restEndpoint: string,
  clientId: string,
  clientSecret: string,
  munchkinId?: string | null,
): Promise<
  | { ok: true; munchkin_id: string | null }
  | { ok: false; message: string }
> {
  const endpoint = normalizeMarketoRestEndpoint(restEndpoint);
  const id = normalizeMarketoClientId(clientId);
  const secret = normalizeMarketoClientSecret(clientSecret);
  const munchkin = normalizeMarketoMunchkinId(munchkinId);

  if (!endpoint) {
    return {
      ok: false,
      message:
        "REST endpoint is invalid. Use your Marketo instance URL, for example https://xxx-xxx-xxx.mktorest.com.",
    };
  }
  if (!id) {
    return { ok: false, message: "Client ID is required." };
  }
  if (!secret) {
    return { ok: false, message: "Client secret is required." };
  }
  if (munchkinId?.trim() && !munchkin) {
    return {
      ok: false,
      message: "Munchkin Account ID must be 3–32 letters, numbers, or hyphens.",
    };
  }

  try {
    const tokenRes = await axios.get<MarketoTokenResponse>(
      `${endpoint}/identity/oauth/token`,
      {
        params: {
          grant_type: "client_credentials",
          client_id: id,
          client_secret: secret,
        },
        timeout: 20_000,
        validateStatus: () => true,
      },
    );

    if (tokenRes.status === 401 || tokenRes.status === 403) {
      return {
        ok: false,
        message:
          "Marketo rejected these credentials. Check Client ID, Client Secret, and REST endpoint in Admin → LaunchPoint.",
      };
    }

    const tokenBody = tokenRes.data;
    if (tokenBody?.error) {
      const detail =
        typeof tokenBody.error_description === "string" && tokenBody.error_description.trim()
          ? tokenBody.error_description.trim()
          : tokenBody.error;
      return {
        ok: false,
        message: `Marketo OAuth error: ${detail}`,
      };
    }

    const accessToken =
      typeof tokenBody?.access_token === "string" ? tokenBody.access_token.trim() : "";
    if (!accessToken) {
      return {
        ok: false,
        message: `Marketo returned HTTP ${tokenRes.status} without an access token. Confirm the REST endpoint URL.`,
      };
    }

    const apiRes = await axios.get(`${endpoint}/rest/v1/leads/describe.json`, {
      params: { access_token: accessToken },
      timeout: 20_000,
      validateStatus: () => true,
    });

    if (apiRes.status === 401 || apiRes.status === 403) {
      return {
        ok: false,
        message:
          "Credentials obtained a token but API access was denied. Grant the LaunchPoint service read access to Leads.",
      };
    }

    if (apiRes.status !== 200) {
      return {
        ok: false,
        message: `Marketo API returned HTTP ${apiRes.status}. Check LaunchPoint permissions and endpoint URL.`,
      };
    }

    return { ok: true, munchkin_id: munchkin };
  } catch (e) {
    const msg = axios.isAxiosError(e) ? e.message : "Connection failed";
    return {
      ok: false,
      message: `Could not reach Marketo (${msg}). Check the REST endpoint and try again.`,
    };
  }
}
