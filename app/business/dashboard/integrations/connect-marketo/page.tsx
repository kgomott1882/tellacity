"use client";

import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useBusinessContext } from "../../_context/BusinessContext";
import { dashboardApiGet, dashboardApiPost } from "@/lib/dashboardApiFetch";
import PasswordInput from "@/components/ui/PasswordInput";
import {
  integrationConnectorPath,
  marketoManagePath,
} from "@/lib/integrationConnectPaths";

export default function ConnectMarketoPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const paramBusinessId = searchParams.get("business_id") ?? "";
  const { selectedBusiness } = useBusinessContext();
  const businessId = paramBusinessId || selectedBusiness?.id || "";

  const [restEndpoint, setRestEndpoint] = useState("");
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [munchkinId, setMunchkinId] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [alreadyConnected, setAlreadyConnected] = useState(false);

  const loadExisting = useCallback(async () => {
    if (!businessId.trim()) return;
    try {
      const json = await dashboardApiGet<{
        connected: boolean;
        rest_endpoint?: string;
        munchkin_id?: string | null;
      }>(
        `/api/integrations/marketo/status?business_id=${encodeURIComponent(businessId)}`,
      );
      if (json.connected) {
        setAlreadyConnected(true);
        if (json.rest_endpoint) setRestEndpoint(json.rest_endpoint);
        if (json.munchkin_id) setMunchkinId(json.munchkin_id);
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
    const endpoint = restEndpoint.trim();
    const id = clientId.trim();
    const secret = clientSecret.trim();
    if (!endpoint || !id || !secret) {
      setError("Fill in REST endpoint, Client ID, and Client Secret.");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      await dashboardApiPost<{ ok: boolean }>("/api/integrations/marketo/connect", {
        business_id: businessId.trim(),
        rest_endpoint: endpoint,
        client_id: id,
        client_secret: secret,
        munchkin_id: munchkinId.trim() || undefined,
      });
      router.push("/business/dashboard/integrations?connected=marketo");
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
          {alreadyConnected ? "Update Marketo connection" : "Connect Marketo"}
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          Tellacity verifies your Marketo REST API credentials, stores them server-side, and acts
          as the bridge when you are ready to trigger review campaigns from programs and smart
          campaigns.
        </p>

        <ol className="mt-5 list-decimal space-y-2 pl-5 text-sm text-gray-700">
          <li>
            In Marketo Admin, go to{" "}
            <span className="font-medium">Admin → LaunchPoint</span> and create a new service, or
            open an existing custom service with REST API access.
          </li>
          <li>
            Copy the <span className="font-medium">REST API endpoint</span>,{" "}
            <span className="font-medium">Client ID</span>, and{" "}
            <span className="font-medium">Client Secret</span>.
          </li>
          <li>
            Grant read access to <span className="font-medium">Lead</span> (and campaign scopes
            when you enable automations).
          </li>
          <li>
            Optionally add your <span className="font-medium">Munchkin Account ID</span> from
            Admin → Munchkin for tracking alignment.
          </li>
        </ol>

        {alreadyConnected ? (
          <p className="mt-4 rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
            This business already has Marketo linked. Submit new credentials to replace the saved
            connection, or{" "}
            <Link
              href={marketoManagePath(businessId)}
              className="font-semibold underline underline-offset-2"
            >
              manage the current connection
            </Link>
            .
          </p>
        ) : null}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="rest_endpoint" className="block text-sm font-medium text-gray-700">
              REST API endpoint
            </label>
            <input
              id="rest_endpoint"
              type="url"
              value={restEndpoint}
              onChange={(e) => setRestEndpoint(e.target.value)}
              placeholder="https://xxx-xxx-xxx.mktorest.com"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-[#1FAF9E] focus:outline-none focus:ring-1 focus:ring-[#1FAF9E]"
              autoComplete="off"
              spellCheck={false}
            />
          </div>
          <div>
            <label htmlFor="client_id" className="block text-sm font-medium text-gray-700">
              Client ID
            </label>
            <input
              id="client_id"
              type="text"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              placeholder="From LaunchPoint service"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 font-mono text-sm shadow-sm focus:border-[#1FAF9E] focus:outline-none focus:ring-1 focus:ring-[#1FAF9E]"
              autoComplete="off"
              spellCheck={false}
            />
          </div>
          <div>
            <label htmlFor="client_secret" className="block text-sm font-medium text-gray-700">
              Client secret
            </label>
            <PasswordInput
              id="client_secret"
              value={clientSecret}
              onChange={(e) => setClientSecret(e.target.value)}
              placeholder="From LaunchPoint service"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 font-mono text-sm shadow-sm focus:border-[#1FAF9E] focus:outline-none focus:ring-1 focus:ring-[#1FAF9E]"
              autoComplete="off"
              spellCheck={false}
            />
          </div>
          <div>
            <label htmlFor="munchkin_id" className="block text-sm font-medium text-gray-700">
              Munchkin Account ID <span className="font-normal text-gray-500">(optional)</span>
            </label>
            <input
              id="munchkin_id"
              type="text"
              value={munchkinId}
              onChange={(e) => setMunchkinId(e.target.value)}
              placeholder="e.g. 123-ABC-456"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-[#1FAF9E] focus:outline-none focus:ring-1 focus:ring-[#1FAF9E]"
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
                ? "Verifying credentials…"
                : alreadyConnected
                  ? "Save credentials"
                  : "Connect Marketo"}
            </button>
            <Link
              href={
                alreadyConnected
                  ? marketoManagePath(businessId)
                  : integrationConnectorPath("marketo")
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
