import axios from "axios";

export const SALESFORCE_API_VERSION = "v59.0";

const PROD_LOGIN = "https://login.salesforce.com";
const SANDBOX_LOGIN = "https://test.salesforce.com";

export type SalesforceLoginHost = typeof PROD_LOGIN | typeof SANDBOX_LOGIN;

export function normalizeSalesforceLoginHost(
  raw: string | null | undefined,
): SalesforceLoginHost | null {
  const trimmed = (raw ?? "").trim().toLowerCase();
  if (!trimmed || trimmed === "production" || trimmed === "prod") return PROD_LOGIN;
  if (trimmed === "sandbox" || trimmed === "test") return SANDBOX_LOGIN;
  let withProtocol = trimmed;
  if (!/^https?:\/\//i.test(withProtocol)) {
    withProtocol = `https://${withProtocol}`;
  }
  try {
    const url = new URL(withProtocol);
    if (url.protocol !== "https:") return null;
    const host = url.origin.toLowerCase();
    if (host === PROD_LOGIN || host === SANDBOX_LOGIN) return host as SalesforceLoginHost;
    return null;
  } catch {
    return null;
  }
}

export function normalizeSalesforceClientId(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed || trimmed.length < 8) return null;
  return trimmed;
}

export function normalizeSalesforceClientSecret(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed || trimmed.length < 8) return null;
  return trimmed;
}

export function normalizeSalesforceRefreshToken(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed || trimmed.length < 16) return null;
  return trimmed;
}

type SalesforceTokenResponse = {
  access_token?: string;
  instance_url?: string;
  id?: string;
  token_type?: string;
  error?: string;
  error_description?: string;
};

type SalesforceIdentity = {
  organization_id?: string;
  organization_id_15?: string;
  display_name?: string;
  username?: string;
};

/** Verify Salesforce Connected App credentials via refresh-token OAuth. */
export async function verifySalesforceCredentials(
  loginHostRaw: string,
  clientId: string,
  clientSecret: string,
  refreshToken: string,
): Promise<
  | {
      ok: true;
      login_host: SalesforceLoginHost;
      instance_url: string;
      org_id: string | null;
      org_name: string | null;
    }
  | { ok: false; message: string }
> {
  const loginHost = normalizeSalesforceLoginHost(loginHostRaw);
  const id = normalizeSalesforceClientId(clientId);
  const secret = normalizeSalesforceClientSecret(clientSecret);
  const refresh = normalizeSalesforceRefreshToken(refreshToken);

  if (!loginHost) {
    return {
      ok: false,
      message: "Login host must be production (login.salesforce.com) or sandbox (test.salesforce.com).",
    };
  }
  if (!id) return { ok: false, message: "Client ID (Consumer Key) is required." };
  if (!secret) return { ok: false, message: "Client Secret is required." };
  if (!refresh) return { ok: false, message: "Refresh token is required." };

  try {
    const tokenRes = await axios.post<SalesforceTokenResponse>(
      `${loginHost}/services/oauth2/token`,
      new URLSearchParams({
        grant_type: "refresh_token",
        client_id: id,
        client_secret: secret,
        refresh_token: refresh,
      }).toString(),
      {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        timeout: 20_000,
        validateStatus: () => true,
      },
    );

    if (tokenRes.status === 401 || tokenRes.status === 400) {
      const detail =
        tokenRes.data?.error_description ?? tokenRes.data?.error ?? "invalid_grant";
      return {
        ok: false,
        message: `Salesforce rejected these credentials (${detail}). Check Client ID, Secret, and Refresh Token.`,
      };
    }

    const accessToken =
      typeof tokenRes.data?.access_token === "string" ? tokenRes.data.access_token.trim() : "";
    const instanceUrl =
      typeof tokenRes.data?.instance_url === "string" ? tokenRes.data.instance_url.trim() : "";

    if (!accessToken || !instanceUrl) {
      return {
        ok: false,
        message: "Salesforce did not return an access token. Confirm the Connected App and refresh token.",
      };
    }

    const limitsRes = await axios.get(
      `${instanceUrl}/services/data/${SALESFORCE_API_VERSION}/limits`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
        timeout: 20_000,
        validateStatus: () => true,
      },
    );

    if (limitsRes.status === 401 || limitsRes.status === 403) {
      return {
        ok: false,
        message:
          "Connected App lacks API access. Enable OAuth scopes for api and refresh_token, then re-authorize.",
      };
    }
    if (limitsRes.status !== 200) {
      return {
        ok: false,
        message: `Salesforce API returned HTTP ${limitsRes.status}. Check Connected App permissions.`,
      };
    }

    let orgId: string | null = null;
    let orgName: string | null = null;

    const identityUrl =
      typeof tokenRes.data?.id === "string" && tokenRes.data.id.startsWith("http")
        ? tokenRes.data.id
        : `${instanceUrl}/services/oauth2/userinfo`;

    const identityRes = await axios.get<SalesforceIdentity>(identityUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
      timeout: 20_000,
      validateStatus: () => true,
    });

    if (identityRes.status === 200 && identityRes.data) {
      orgId =
        identityRes.data.organization_id ??
        identityRes.data.organization_id_15 ??
        null;
      orgName = identityRes.data.display_name ?? identityRes.data.username ?? null;
    }

    return {
      ok: true,
      login_host: loginHost,
      instance_url: instanceUrl,
      org_id: orgId,
      org_name: orgName,
    };
  } catch (e) {
    const msg = axios.isAxiosError(e) ? e.message : "Connection failed";
    return {
      ok: false,
      message: `Could not reach Salesforce (${msg}). Try again in a moment.`,
    };
  }
}
