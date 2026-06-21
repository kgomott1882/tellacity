import axios from "axios";

const BOT_TOKEN_RE = /^xoxb-[A-Za-z0-9-]+$/;
const CHANNEL_ID_RE = /^[CGD][A-Z0-9]{8,}$/;

export function normalizeSlackBotToken(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed || !BOT_TOKEN_RE.test(trimmed)) return null;
  return trimmed;
}

export function normalizeSlackChannelId(raw: string | null | undefined): string | null {
  const trimmed = (raw ?? "").trim().toUpperCase();
  if (!trimmed) return null;
  if (!CHANNEL_ID_RE.test(trimmed)) return null;
  return trimmed;
}

type SlackApiResponse = {
  ok?: boolean;
  error?: string;
  team?: string;
  team_id?: string;
  channel?: {
    id?: string;
    name?: string;
    is_private?: boolean;
  };
};

async function slackPost<T extends SlackApiResponse>(
  method: string,
  token: string,
  params?: Record<string, string>,
): Promise<{ status: number; data: T }> {
  const res = await axios.post<T>(
    `https://slack.com/api/${method}`,
    new URLSearchParams(params ?? {}).toString(),
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      timeout: 20_000,
      validateStatus: () => true,
    },
  );
  return { status: res.status, data: res.data };
}

/** Verify Slack bot token via auth.test; optionally validate default channel. */
export async function verifySlackBotToken(
  botToken: string,
  defaultChannelId?: string | null,
): Promise<
  | {
      ok: true;
      workspace_id: string | null;
      workspace_name: string | null;
      default_channel_id: string | null;
      default_channel_name: string | null;
    }
  | { ok: false; message: string }
> {
  const token = normalizeSlackBotToken(botToken);
  if (!token) {
    return {
      ok: false,
      message:
        "Bot token is invalid. Install your Slack app to the workspace and paste the Bot User OAuth Token (starts with xoxb-).",
    };
  }

  const channelId = normalizeSlackChannelId(defaultChannelId);
  if (defaultChannelId?.trim() && !channelId) {
    return {
      ok: false,
      message:
        "Channel ID must start with C, G, or D (copy it from Slack channel details, not the channel name).",
    };
  }

  try {
    const auth = await slackPost<SlackApiResponse>("auth.test", token);
    if (!auth.data.ok) {
      const err = auth.data.error ?? "invalid_auth";
      if (err === "invalid_auth" || err === "token_revoked" || err === "account_inactive") {
        return {
          ok: false,
          message:
            "Slack rejected this bot token. Reinstall the app to your workspace and paste a fresh xoxb- token.",
        };
      }
      return { ok: false, message: `Slack auth error: ${err}` };
    }

    const workspaceId =
      typeof auth.data.team_id === "string" && auth.data.team_id.trim()
        ? auth.data.team_id.trim()
        : null;
    const workspaceName =
      typeof auth.data.team === "string" && auth.data.team.trim() ? auth.data.team.trim() : null;

    let defaultChannelName: string | null = null;
    if (channelId) {
      const channel = await slackPost<SlackApiResponse>("conversations.info", token, {
        channel: channelId,
      });
      if (!channel.data.ok) {
        const err = channel.data.error ?? "channel_not_found";
        if (err === "channel_not_found" || err === "missing_scope") {
          return {
            ok: false,
            message:
              err === "missing_scope"
                ? "This bot token cannot read channel info. Add channels:read (and chat:write) scopes, reinstall the app, then try again."
                : "That channel ID was not found. Invite the bot to the channel or check the ID from Slack channel details.",
          };
        }
        return { ok: false, message: `Slack channel error: ${err}` };
      }
      const name =
        typeof channel.data.channel?.name === "string" && channel.data.channel.name.trim()
          ? channel.data.channel.name.trim()
          : null;
      defaultChannelName = name ? `#${name}` : null;
    }

    return {
      ok: true,
      workspace_id: workspaceId,
      workspace_name: workspaceName,
      default_channel_id: channelId,
      default_channel_name: defaultChannelName,
    };
  } catch (e) {
    const msg = axios.isAxiosError(e) ? e.message : "Connection failed";
    return {
      ok: false,
      message: `Could not reach Slack (${msg}). Try again in a moment.`,
    };
  }
}
