import axios from "axios";

/** Normalize a Zapier catch-hook or standard hook URL (https only). */
export function normalizeZapierWebhookUrl(raw: string): string | null {
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
  const host = url.hostname.toLowerCase();
  if (host !== "hooks.zapier.com" && host !== "hook.zapier.com") return null;
  if (!url.pathname.includes("/hooks/")) return null;
  return url.toString().replace(/\/$/, "");
}

export function normalizeZapierZapLabel(raw: string | null | undefined): string | null {
  const trimmed = (raw ?? "").trim();
  if (!trimmed) return null;
  if (trimmed.length > 120) return trimmed.slice(0, 120);
  return trimmed;
}

/** Verify Zapier webhook by sending a connection test payload. */
export async function verifyZapierWebhookUrl(
  webhookUrl: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const url = normalizeZapierWebhookUrl(webhookUrl);
  if (!url) {
    return {
      ok: false,
      message:
        "Webhook URL is invalid. Use a Zapier Catch Hook URL from Webhooks by Zapier (hooks.zapier.com).",
    };
  }

  try {
    const res = await axios.post(
      url,
      {
        event: "tellacity.connection_test",
        source: "tellacity",
        verified_at: new Date().toISOString(),
        message: "Tellacity connected this Zapier hook successfully.",
      },
      {
        headers: { "Content-Type": "application/json" },
        timeout: 20_000,
        validateStatus: () => true,
      },
    );

    if (res.status >= 200 && res.status < 300) {
      return { ok: true };
    }
    if (res.status === 404 || res.status === 410) {
      return {
        ok: false,
        message:
          "Zapier could not find this hook. Turn the Zap on, copy a fresh Catch Hook URL, and try again.",
      };
    }

    return {
      ok: false,
      message: `Zapier returned HTTP ${res.status}. Confirm the Zap is published and the hook URL is correct.`,
    };
  } catch (e) {
    const msg = axios.isAxiosError(e) ? e.message : "Connection failed";
    return {
      ok: false,
      message: `Could not reach Zapier (${msg}). Check the URL and try again.`,
    };
  }
}
