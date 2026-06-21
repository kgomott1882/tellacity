"use client";

import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useBusinessContext } from "../../_context/BusinessContext";
import { dashboardApiGet, dashboardApiPost } from "@/lib/dashboardApiFetch";
import {
  integrationConnectorPath,
  zapierManagePath,
} from "@/lib/integrationConnectPaths";

export default function ConnectZapierPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const paramBusinessId = searchParams.get("business_id") ?? "";
  const { selectedBusiness } = useBusinessContext();
  const businessId = paramBusinessId || selectedBusiness?.id || "";

  const [webhookUrl, setWebhookUrl] = useState("");
  const [zapLabel, setZapLabel] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [alreadyConnected, setAlreadyConnected] = useState(false);

  const loadExisting = useCallback(async () => {
    if (!businessId.trim()) return;
    try {
      const json = await dashboardApiGet<{
        connected: boolean;
        webhook_url?: string;
        zap_label?: string | null;
      }>(
        `/api/integrations/zapier/status?business_id=${encodeURIComponent(businessId)}`,
      );
      if (json.connected) {
        setAlreadyConnected(true);
        if (json.webhook_url) setWebhookUrl(json.webhook_url);
        if (json.zap_label) setZapLabel(json.zap_label);
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
    const url = webhookUrl.trim();
    if (!url) {
      setError("Paste your Zapier Catch Hook URL.");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      await dashboardApiPost<{ ok: boolean }>("/api/integrations/zapier/connect", {
        business_id: businessId.trim(),
        webhook_url: url,
        zap_label: zapLabel.trim() || undefined,
      });
      router.push("/business/dashboard/integrations?connected=zapier");
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
          {alreadyConnected ? "Update Zapier hook" : "Connect Zapier"}
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          Tellacity verifies your Zapier Catch Hook, saves it server-side, and uses it as the bridge
          when you are ready to send review and feedback events into your Zaps.
        </p>

        <ol className="mt-5 list-decimal space-y-2 pl-5 text-sm text-gray-700">
          <li>
            In{" "}
            <a
              href="https://zapier.com/app/zaps"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-[#1FAF9E] hover:underline"
            >
              Zapier
            </a>
            , create a Zap with trigger <span className="font-medium">Webhooks by Zapier</span> →{" "}
            <span className="font-medium">Catch Hook</span>.
          </li>
          <li>Copy the custom webhook URL Zapier gives you (hooks.zapier.com).</li>
          <li>
            Turn the Zap <span className="font-medium">on</span>, paste the URL below, and Tellacity
            will send a test payload to confirm it works.
          </li>
          <li>Add actions in Zapier (Slack, Google Sheets, CRM, email, and more).</li>
        </ol>

        {alreadyConnected ? (
          <p className="mt-4 rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
            This business already has a Zapier hook linked. Submit a new URL to replace it, or{" "}
            <Link
              href={zapierManagePath(businessId)}
              className="font-semibold underline underline-offset-2"
            >
              manage the current connection
            </Link>
            .
          </p>
        ) : null}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="webhook_url" className="block text-sm font-medium text-gray-700">
              Catch Hook URL
            </label>
            <input
              id="webhook_url"
              type="url"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              placeholder="https://hooks.zapier.com/hooks/catch/…"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 font-mono text-xs shadow-sm focus:border-[#1FAF9E] focus:outline-none focus:ring-1 focus:ring-[#1FAF9E]"
              autoComplete="off"
              spellCheck={false}
            />
          </div>
          <div>
            <label htmlFor="zap_label" className="block text-sm font-medium text-gray-700">
              Zap name <span className="font-normal text-gray-500">(optional)</span>
            </label>
            <input
              id="zap_label"
              type="text"
              value={zapLabel}
              onChange={(e) => setZapLabel(e.target.value)}
              placeholder="e.g. New review → Slack"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-[#1FAF9E] focus:outline-none focus:ring-1 focus:ring-[#1FAF9E]"
              autoComplete="off"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center justify-center rounded-md bg-teal-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-teal-700 disabled:opacity-60"
            >
              {submitting
                ? "Testing hook…"
                : alreadyConnected
                  ? "Save hook"
                  : "Connect Zapier"}
            </button>
            <Link
              href={
                alreadyConnected
                  ? zapierManagePath(businessId)
                  : integrationConnectorPath("zapier")
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
