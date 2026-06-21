import axios from "axios";

/** Klaviyo JSON:API revision used for server-side verification. */
export const KLAVIYO_API_REVISION = "2024-10-15";

export function normalizeKlaviyoPrivateApiKey(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (trimmed.length < 20) return null;
  return trimmed;
}

type KlaviyoAccountResource = {
  type?: string;
  id?: string;
  attributes?: {
    organization_name?: string;
    contact_information?: { default_sender_name?: string };
  };
};

type KlaviyoAccountsResponse = {
  data?: KlaviyoAccountResource[];
};

/** Verify a Klaviyo private API key via the Accounts API. */
export async function verifyKlaviyoPrivateApiKey(
  privateApiKey: string,
): Promise<
  | { ok: true; account_id: string | null; account_name: string | null }
  | { ok: false; message: string }
> {
  const key = normalizeKlaviyoPrivateApiKey(privateApiKey);
  if (!key) {
    return { ok: false, message: "Private API key is required." };
  }

  try {
    const res = await axios.get("https://a.klaviyo.com/api/accounts/", {
      timeout: 20_000,
      validateStatus: () => true,
      headers: {
        Authorization: `Klaviyo-API-Key ${key}`,
        Accept: "application/vnd.api+json",
        revision: KLAVIYO_API_REVISION,
      },
    });

    if (res.status === 401 || res.status === 403) {
      return {
        ok: false,
        message:
          "Klaviyo rejected this private API key. Create a new key in Klaviyo with at least Accounts read access, then try again.",
      };
    }

    if (res.status === 200 && res.data && typeof res.data === "object") {
      const payload = res.data as KlaviyoAccountsResponse;
      const first = Array.isArray(payload.data) ? payload.data[0] : null;
      if (first?.type === "account" || first?.id) {
        const attrs = first.attributes;
        const orgName =
          typeof attrs?.organization_name === "string" && attrs.organization_name.trim()
            ? attrs.organization_name.trim()
            : null;
        const senderName =
          typeof attrs?.contact_information?.default_sender_name === "string" &&
          attrs.contact_information.default_sender_name.trim()
            ? attrs.contact_information.default_sender_name.trim()
            : null;
        return {
          ok: true,
          account_id: typeof first.id === "string" ? first.id : null,
          account_name: orgName ?? senderName,
        };
      }
      return { ok: true, account_id: null, account_name: null };
    }

    return {
      ok: false,
      message: `Klaviyo returned HTTP ${res.status}. Check the key and try again.`,
    };
  } catch (e) {
    const msg = axios.isAxiosError(e) ? e.message : "Connection failed";
    return {
      ok: false,
      message: `Could not reach Klaviyo (${msg}). Try again in a moment.`,
    };
  }
}
