import axios from "axios";
import crypto from "crypto";

const ACCOUNT_ID_RE = /^[0-9]+(_SB[0-9]+)?$/i;

export function percentEncodeOAuth(value: string): string {
  return encodeURIComponent(value)
    .replace(/!/g, "%21")
    .replace(/\*/g, "%2A")
    .replace(/'/g, "%27")
    .replace(/\(/g, "%28")
    .replace(/\)/g, "%29");
}

/** Normalize NetSuite account ID (realm), e.g. 1234567 or 1234567_SB1. */
export function normalizeNetsuiteAccountId(raw: string): string | null {
  let trimmed = raw.trim();
  if (!trimmed) return null;

  trimmed = trimmed.replace(/^https?:\/\//i, "");
  const hostMatch = trimmed.match(/^([0-9]+(?:-sb[0-9]+)?)\.suitetalk\.api\.netsuite\.com/i);
  if (hostMatch?.[1]) {
    trimmed = hostMatch[1];
  } else {
    trimmed = trimmed.split("/")[0] ?? trimmed;
  }

  trimmed = trimmed.replace(/-/g, "_").toUpperCase();
  if (!ACCOUNT_ID_RE.test(trimmed)) return null;
  return trimmed;
}

export function netsuiteRestBaseUrl(accountId: string): string {
  const domain = accountId.toLowerCase().replace(/_/g, "-");
  return `https://${domain}.suitetalk.api.netsuite.com`;
}

function normalizeSecret(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed || trimmed.length < 8) return null;
  return trimmed;
}

type NetsuiteTbaCredentials = {
  accountId: string;
  consumerKey: string;
  consumerSecret: string;
  tokenId: string;
  tokenSecret: string;
};

function buildOAuthAuthorizationHeader(
  method: string,
  url: string,
  creds: NetsuiteTbaCredentials,
): string {
  const oauthParams: Record<string, string> = {
    oauth_consumer_key: creds.consumerKey,
    oauth_nonce: crypto.randomBytes(16).toString("hex"),
    oauth_signature_method: "HMAC-SHA256",
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_token: creds.tokenId,
    oauth_version: "1.0",
  };

  const paramString = Object.keys(oauthParams)
    .sort()
    .map((key) => `${percentEncodeOAuth(key)}=${percentEncodeOAuth(oauthParams[key]!)}`)
    .join("&");

  const baseString = [
    method.toUpperCase(),
    percentEncodeOAuth(url),
    percentEncodeOAuth(paramString),
  ].join("&");

  const signingKey = `${percentEncodeOAuth(creds.consumerSecret)}&${percentEncodeOAuth(creds.tokenSecret)}`;
  const signature = crypto.createHmac("sha256", signingKey).update(baseString).digest("base64");

  const headerParams: Record<string, string> = {
    ...oauthParams,
    oauth_signature: signature,
  };

  const authParts = Object.keys(headerParams)
    .sort()
    .map((key) => `${percentEncodeOAuth(key)}="${percentEncodeOAuth(headerParams[key]!)}"`);

  return `OAuth realm="${creds.accountId}", ${authParts.join(", ")}`;
}

type MetadataCatalogResponse = {
  items?: Array<{ name?: string }>;
};

/** Verify NetSuite TBA credentials against the REST metadata catalog. */
export async function verifyNetsuiteCredentials(
  accountIdRaw: string,
  consumerKeyRaw: string,
  consumerSecretRaw: string,
  tokenIdRaw: string,
  tokenSecretRaw: string,
): Promise<
  | { ok: true; account_id: string; account_name: string | null }
  | { ok: false; message: string }
> {
  const accountId = normalizeNetsuiteAccountId(accountIdRaw);
  const consumerKey = normalizeSecret(consumerKeyRaw);
  const consumerSecret = normalizeSecret(consumerSecretRaw);
  const tokenId = normalizeSecret(tokenIdRaw);
  const tokenSecret = normalizeSecret(tokenSecretRaw);

  if (!accountId) {
    return {
      ok: false,
      message:
        "Account ID is invalid. Use your NetSuite account ID, for example 1234567 or 1234567_SB1 for sandbox.",
    };
  }
  if (!consumerKey) return { ok: false, message: "Consumer Key is required." };
  if (!consumerSecret) return { ok: false, message: "Consumer Secret is required." };
  if (!tokenId) return { ok: false, message: "Token ID is required." };
  if (!tokenSecret) return { ok: false, message: "Token Secret is required." };

  const creds: NetsuiteTbaCredentials = {
    accountId,
    consumerKey,
    consumerSecret,
    tokenId,
    tokenSecret,
  };

  const baseUrl = netsuiteRestBaseUrl(accountId);
  const path = "/services/rest/record/v1/metadata-catalog";
  const url = `${baseUrl}${path}`;
  const authorization = buildOAuthAuthorizationHeader("GET", url, creds);

  try {
    const res = await axios.get<MetadataCatalogResponse>(url, {
      headers: {
        Authorization: authorization,
        Accept: "application/json",
      },
      timeout: 25_000,
      validateStatus: () => true,
    });

    if (res.status === 401) {
      return {
        ok: false,
        message:
          "NetSuite rejected these credentials. Confirm Account ID, Consumer Key/Secret, and Token ID/Secret from your integration record.",
      };
    }
    if (res.status === 403) {
      return {
        ok: false,
        message:
          "NetSuite denied API access. Ensure the integration has REST Web Services enabled and the role has required permissions.",
      };
    }
    if (res.status !== 200) {
      const detail =
        typeof res.data === "object" && res.data && "title" in res.data
          ? String((res.data as { title?: string }).title)
          : `HTTP ${res.status}`;
      return {
        ok: false,
        message: `NetSuite API returned ${detail}. Check account ID and token permissions.`,
      };
    }

    const itemCount = Array.isArray(res.data?.items) ? res.data.items.length : 0;
    const accountName = itemCount > 0 ? `NetSuite (${accountId})` : null;

    return { ok: true, account_id: accountId, account_name: accountName };
  } catch (e) {
    const msg = axios.isAxiosError(e) ? e.message : "Connection failed";
    return {
      ok: false,
      message: `Could not reach NetSuite (${msg}). Check the account ID and try again.`,
    };
  }
}
