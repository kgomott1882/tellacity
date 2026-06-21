"use client";

import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useBusinessContext } from "../../_context/BusinessContext";
import { dashboardApiGet, dashboardApiPost } from "@/lib/dashboardApiFetch";
import PasswordInput from "@/components/ui/PasswordInput";
import {
  integrationConnectorPath,
  zendeskManagePath,
} from "@/lib/integrationConnectPaths";

export default function ConnectZendeskPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const paramBusinessId = searchParams.get("business_id") ?? "";
  const { selectedBusiness } = useBusinessContext();
  const businessId = paramBusinessId || selectedBusiness?.id || "";

  const [subdomain, setSubdomain] = useState("");
  const [agentEmail, setAgentEmail] = useState("");
  const [apiToken, setApiToken] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [alreadyConnected, setAlreadyConnected] = useState(false);
  const [existingAccountName, setExistingAccountName] = useState<string | null>(null);

  const loadExisting = useCallback(async () => {
    if (!businessId.trim()) return;
    try {
      const json = await dashboardApiGet<{
        connected: boolean;
        subdomain?: string;
        agent_email?: string;
        account_name?: string | null;
      }>(
        `/api/integrations/zendesk/status?business_id=${encodeURIComponent(businessId)}`,
      );
      if (json.connected) {
        setAlreadyConnected(true);
        if (json.subdomain) setSubdomain(json.subdomain);
        if (json.agent_email) setAgentEmail(json.agent_email);
        setExistingAccountName(json.account_name ?? null);
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
    const sub = subdomain.trim();
    const email = agentEmail.trim();
    const token = apiToken.trim();
    if (!sub || !email || !token) {
      setError("Fill in subdomain, agent email, and API token.");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      const json = await dashboardApiPost<{
        ok: boolean;
        account_name?: string | null;
      }>("/api/integrations/zendesk/connect", {
        business_id: businessId.trim(),
        subdomain: sub,
        agent_email: email,
        api_token: token,
      });
      if (json.account_name) setExistingAccountName(json.account_name);
      router.push("/business/dashboard/integrations?connected=zendesk");
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
          {alreadyConnected ? "Update Zendesk connection" : "Connect Zendesk"}
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          Tellacity verifies your Zendesk account, stores API credentials server-side, and acts as
          the bridge when you are ready to send review invites after tickets close.
        </p>

        <ol className="mt-5 list-decimal space-y-2 pl-5 text-sm text-gray-700">
          <li>
            Find your subdomain in your help center URL:{" "}
            <span className="font-mono text-xs">https://yoursubdomain.zendesk.com</span>.
          </li>
          <li>
            In Zendesk Admin Center, go to{" "}
            <span className="font-medium">Apps and integrations → APIs → Zendesk API</span> and
            enable token access for an admin agent.
          </li>
          <li>
            Generate an <span className="font-medium">API token</span> for that agent and paste it
            below with their email address.
          </li>
        </ol>

        {alreadyConnected ? (
          <p className="mt-4 rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
            {existingAccountName ? (
              <>
                Connected to <span className="font-semibold">{existingAccountName}</span>. Submit
                new credentials to replace the saved connection, or{" "}
              </>
            ) : (
              <>This business already has Zendesk linked. Submit new credentials to replace it, or </>
            )}
            <Link
              href={zendeskManagePath(businessId)}
              className="font-semibold underline underline-offset-2"
            >
              manage the current connection
            </Link>
            .
          </p>
        ) : null}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="subdomain" className="block text-sm font-medium text-gray-700">
              Subdomain
            </label>
            <div className="mt-1 flex rounded-md shadow-sm">
              <input
                id="subdomain"
                type="text"
                value={subdomain}
                onChange={(e) => setSubdomain(e.target.value)}
                placeholder="mycompany"
                className="block w-full min-w-0 flex-1 rounded-l-md border border-gray-300 px-3 py-2 text-sm focus:border-[#1FAF9E] focus:outline-none focus:ring-1 focus:ring-[#1FAF9E]"
                autoComplete="off"
                spellCheck={false}
              />
              <span className="inline-flex items-center rounded-r-md border border-l-0 border-gray-300 bg-gray-50 px-3 text-sm text-gray-500">
                .zendesk.com
              </span>
            </div>
          </div>
          <div>
            <label htmlFor="agent_email" className="block text-sm font-medium text-gray-700">
              Agent email
            </label>
            <input
              id="agent_email"
              type="email"
              value={agentEmail}
              onChange={(e) => setAgentEmail(e.target.value)}
              placeholder="admin@yourcompany.com"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-[#1FAF9E] focus:outline-none focus:ring-1 focus:ring-[#1FAF9E]"
              autoComplete="off"
            />
          </div>
          <div>
            <label htmlFor="api_token" className="block text-sm font-medium text-gray-700">
              API token
            </label>
            <PasswordInput
              id="api_token"
              value={apiToken}
              onChange={(e) => setApiToken(e.target.value)}
              placeholder="Paste from Zendesk Admin Center"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 font-mono text-sm shadow-sm focus:border-[#1FAF9E] focus:outline-none focus:ring-1 focus:ring-[#1FAF9E]"
              autoComplete="off"
              spellCheck={false}
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
                ? "Verifying account…"
                : alreadyConnected
                  ? "Save credentials"
                  : "Connect Zendesk"}
            </button>
            <Link
              href={
                alreadyConnected
                  ? zendeskManagePath(businessId)
                  : integrationConnectorPath("zendesk")
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
