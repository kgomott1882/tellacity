"use client";

import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useBusinessContext } from "../../_context/BusinessContext";
import { dashboardApiGet, dashboardApiPost } from "@/lib/dashboardApiFetch";
import PasswordInput from "@/components/ui/PasswordInput";
import {
  integrationConnectorPath,
  slackManagePath,
} from "@/lib/integrationConnectPaths";

export default function ConnectSlackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const paramBusinessId = searchParams.get("business_id") ?? "";
  const { selectedBusiness } = useBusinessContext();
  const businessId = paramBusinessId || selectedBusiness?.id || "";

  const [botToken, setBotToken] = useState("");
  const [defaultChannelId, setDefaultChannelId] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [alreadyConnected, setAlreadyConnected] = useState(false);
  const [existingWorkspaceName, setExistingWorkspaceName] = useState<string | null>(null);

  const loadExisting = useCallback(async () => {
    if (!businessId.trim()) return;
    try {
      const json = await dashboardApiGet<{
        connected: boolean;
        workspace_name?: string | null;
        default_channel_id?: string | null;
        default_channel_name?: string | null;
      }>(
        `/api/integrations/slack/status?business_id=${encodeURIComponent(businessId)}`,
      );
      if (json.connected) {
        setAlreadyConnected(true);
        setExistingWorkspaceName(json.workspace_name ?? null);
        if (json.default_channel_id) setDefaultChannelId(json.default_channel_id);
      }
    } catch {
      /* optional prefill */
    }
  }, [businessId]);

  useEffect(() => {
    void loadExisting();
  }, [loadExisting]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessId.trim()) {
      setError("Select a business in the dashboard, then open this page again.");
      return;
    }
    const token = botToken.trim();
    if (!token) {
      setError("Paste your Slack Bot User OAuth Token.");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      const json = await dashboardApiPost<{
        ok: boolean;
        workspace_name?: string | null;
      }>("/api/integrations/slack/connect", {
        business_id: businessId.trim(),
        bot_token: token,
        default_channel_id: defaultChannelId.trim() || undefined,
      });
      if (json.workspace_name) setExistingWorkspaceName(json.workspace_name);
      router.push("/business/dashboard/integrations?connected=slack");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Connection failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="max-w-lg">
        <Link
          href="/business/dashboard/integrations"
          className="text-xs font-medium text-gray-500 hover:text-[#1FAF9E]"
        >
          ← Integrations
        </Link>
        <h1 className="mt-3 text-lg font-semibold text-[#0E0E0E]">
          {alreadyConnected ? "Update Slack connection" : "Connect Slack"}
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          Tellacity verifies your Slack workspace bot token, stores it server-side, and acts as the
          bridge when you are ready to stream reviews and feedback events into channels.
        </p>

        <ol className="mt-5 list-decimal space-y-2 pl-5 text-sm text-gray-700">
          <li>
            Create a Slack app at{" "}
            <a
              href="https://api.slack.com/apps"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-[#1FAF9E] hover:underline"
            >
              api.slack.com/apps
            </a>{" "}
            (or use an existing internal app).
          </li>
          <li>
            Add bot scopes: <span className="font-medium">chat:write</span>,{" "}
            <span className="font-medium">channels:read</span> (and{" "}
            <span className="font-medium">groups:read</span> for private channels).
          </li>
          <li>
            Install the app to your workspace and copy the{" "}
            <span className="font-medium">Bot User OAuth Token</span> (starts with{" "}
            <span className="font-mono">xoxb-</span>).
          </li>
          <li>
            Optionally paste a default channel ID (from channel details in Slack) and invite the bot
            to that channel.
          </li>
        </ol>

        {alreadyConnected ? (
          <p className="mt-4 rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
            {existingWorkspaceName ? (
              <>
                Connected to <span className="font-semibold">{existingWorkspaceName}</span>. Submit
                a new token to replace the saved connection, or{" "}
              </>
            ) : (
              <>This business already has Slack linked. Submit a new token to replace it, or </>
            )}
            <Link
              href={slackManagePath(businessId)}
              className="font-semibold underline underline-offset-2"
            >
              manage the current connection
            </Link>
            .
          </p>
        ) : null}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="bot_token" className="block text-sm font-medium text-gray-700">
              Bot User OAuth Token
            </label>
            <PasswordInput
              id="bot_token"
              value={botToken}
              onChange={(e) => setBotToken(e.target.value)}
              placeholder="xoxb-…"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 font-mono text-sm shadow-sm focus:border-[#1FAF9E] focus:outline-none focus:ring-1 focus:ring-[#1FAF9E]"
              autoComplete="off"
              spellCheck={false}
            />
          </div>
          <div>
            <label htmlFor="default_channel_id" className="block text-sm font-medium text-gray-700">
              Default channel ID <span className="font-normal text-gray-500">(optional)</span>
            </label>
            <input
              id="default_channel_id"
              type="text"
              value={defaultChannelId}
              onChange={(e) => setDefaultChannelId(e.target.value)}
              placeholder="C0123456789"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 font-mono text-sm shadow-sm focus:border-[#1FAF9E] focus:outline-none focus:ring-1 focus:ring-[#1FAF9E]"
              autoComplete="off"
              spellCheck={false}
            />
            <p className="mt-1 text-xs text-gray-500">
              Open the channel in Slack → channel name → copy the Channel ID at the bottom of About.
            </p>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center justify-center rounded-md bg-teal-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-teal-700 disabled:opacity-60"
            >
              {submitting
                ? "Verifying token…"
                : alreadyConnected
                  ? "Save connection"
                  : "Connect Slack"}
            </button>
            <Link
              href={
                alreadyConnected
                  ? slackManagePath(businessId)
                  : integrationConnectorPath("slack")
              }
              className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
