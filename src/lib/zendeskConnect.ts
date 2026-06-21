import axios from "axios";

const SUBDOMAIN_RE = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/i;

export function normalizeZendeskSubdomain(raw: string): string | null {
  let trimmed = raw.trim().toLowerCase();
  if (!trimmed) return null;
  trimmed = trimmed.replace(/^https?:\/\//, "");
  trimmed = trimmed.split("/")[0] ?? trimmed;
  if (trimmed.endsWith(".zendesk.com")) {
    trimmed = trimmed.slice(0, -".zendesk.com".length);
  }
  if (!trimmed || !SUBDOMAIN_RE.test(trimmed)) return null;
  return trimmed;
}

export function normalizeZendeskAgentEmail(raw: string): string | null {
  const trimmed = raw.trim().toLowerCase();
  if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return null;
  return trimmed;
}

export function normalizeZendeskApiToken(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed || trimmed.length < 16) return null;
  return trimmed;
}

export function zendeskBaseUrl(subdomain: string): string {
  return `https://${subdomain}.zendesk.com`;
}

type ZendeskUserMe = {
  user?: { name?: string; email?: string };
};

type ZendeskAccount = {
  account?: { name?: string; subdomain?: string };
};

function zendeskAuth(email: string, apiToken: string) {
  return { username: `${email}/token`, password: apiToken };
}

/** Verify Zendesk subdomain, agent email, and API token. */
export async function verifyZendeskCredentials(
  subdomainRaw: string,
  agentEmailRaw: string,
  apiTokenRaw: string,
): Promise<
  | { ok: true; subdomain: string; account_name: string | null }
  | { ok: false; message: string }
> {
  const subdomain = normalizeZendeskSubdomain(subdomainRaw);
  const agentEmail = normalizeZendeskAgentEmail(agentEmailRaw);
  const apiToken = normalizeZendeskApiToken(apiTokenRaw);

  if (!subdomain) {
    return {
      ok: false,
      message:
        "Subdomain is invalid. Use your Zendesk subdomain only, for example mycompany (from mycompany.zendesk.com).",
    };
  }
  if (!agentEmail) {
    return { ok: false, message: "A valid agent email address is required." };
  }
  if (!apiToken) {
    return { ok: false, message: "API token is required." };
  }

  const base = zendeskBaseUrl(subdomain);
  const auth = zendeskAuth(agentEmail, apiToken);

  try {
    const meRes = await axios.get<ZendeskUserMe>(`${base}/api/v2/users/me.json`, {
      auth,
      timeout: 20_000,
      validateStatus: () => true,
    });

    if (meRes.status === 401 || meRes.status === 403) {
      return {
        ok: false,
        message:
          "Zendesk rejected these credentials. In Admin Center, enable token access for the agent and paste a fresh API token.",
      };
    }
    if (meRes.status === 404) {
      return {
        ok: false,
        message: "Zendesk subdomain was not found. Check the subdomain from your help center URL.",
      };
    }
    if (meRes.status !== 200 || !meRes.data?.user) {
      return {
        ok: false,
        message: `Zendesk returned HTTP ${meRes.status}. Check subdomain, email, and API token.`,
      };
    }

    let accountName: string | null = null;
    const accountRes = await axios.get<ZendeskAccount>(`${base}/api/v2/account.json`, {
      auth,
      timeout: 20_000,
      validateStatus: () => true,
    });
    if (accountRes.status === 200 && accountRes.data?.account) {
      const name =
        typeof accountRes.data.account.name === "string" && accountRes.data.account.name.trim()
          ? accountRes.data.account.name.trim()
          : null;
      accountName = name;
    }

    return { ok: true, subdomain, account_name: accountName };
  } catch (e) {
    const msg = axios.isAxiosError(e) ? e.message : "Connection failed";
    return {
      ok: false,
      message: `Could not reach Zendesk (${msg}). Check the subdomain and try again.`,
    };
  }
}
