import axios from "axios";

const ACCESS_TOKEN_RE = /^pat-[a-z]{2}\d?-[a-f0-9-]{36}$/i;

export function normalizeHubSpotAccessToken(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (!trimmed.toLowerCase().startsWith("pat-")) return null;
  if (trimmed.length < 20) return null;
  if (!ACCESS_TOKEN_RE.test(trimmed)) {
    // Allow slightly non-standard tokens HubSpot may issue while still requiring pat- prefix.
    if (!/^pat-[a-z0-9-]+$/i.test(trimmed) || trimmed.length < 32) return null;
  }
  return trimmed;
}

type HubSpotAccountInfo = {
  portalId?: number;
  accountType?: string;
  companyCurrency?: string;
};

/** Verify a HubSpot private app access token via the account-info API. */
export async function verifyHubSpotAccessToken(
  accessToken: string,
): Promise<
  | { ok: true; portal_id: string | null; account_type: string | null }
  | { ok: false; message: string }
> {
  const token = normalizeHubSpotAccessToken(accessToken);
  if (!token) {
    return {
      ok: false,
      message:
        "Access token is invalid. Create a private app in HubSpot and copy the access token (starts with pat-).",
    };
  }

  try {
    const res = await axios.get<HubSpotAccountInfo>(
      "https://api.hubapi.com/account-info/v3/details",
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        timeout: 20_000,
        validateStatus: () => true,
      },
    );

    if (res.status === 401 || res.status === 403) {
      return {
        ok: false,
        message:
          "HubSpot rejected this access token. Check the token in your private app settings and required scopes (crm.objects.contacts.read minimum).",
      };
    }

    if (res.status === 200 && res.data && typeof res.data === "object") {
      const portalId =
        typeof res.data.portalId === "number" && Number.isFinite(res.data.portalId)
          ? String(res.data.portalId)
          : null;
      const accountType =
        typeof res.data.accountType === "string" && res.data.accountType.trim()
          ? res.data.accountType.trim()
          : null;
      return { ok: true, portal_id: portalId, account_type: accountType };
    }

    return {
      ok: false,
      message: `HubSpot returned HTTP ${res.status}. Check the token and try again.`,
    };
  } catch (e) {
    const msg = axios.isAxiosError(e) ? e.message : "Connection failed";
    return {
      ok: false,
      message: `Could not reach HubSpot (${msg}). Try again in a moment.`,
    };
  }
}
