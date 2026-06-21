"use client";

import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useBusinessContext } from "../../_context/BusinessContext";
import { dashboardApiGet, dashboardApiPost } from "@/lib/dashboardApiFetch";
import PasswordInput from "@/components/ui/PasswordInput";
import {
  integrationConnectorPath,
  sapManagePath,
} from "@/lib/integrationConnectPaths";

export default function ConnectSapPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const paramBusinessId = searchParams.get("business_id") ?? "";
  const { selectedBusiness } = useBusinessContext();
  const businessId = paramBusinessId || selectedBusiness?.id || "";

  const [apiBaseUrl, setApiBaseUrl] = useState("");
  const [tokenUrl, setTokenUrl] = useState("");
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [alreadyConnected, setAlreadyConnected] = useState(false);
  const [existingSystemName, setExistingSystemName] = useState<string | null>(null);

  const loadExisting = useCallback(async () => {
    if (!businessId.trim()) return;
    try {
      const json = await dashboardApiGet<{
        connected: boolean;
        api_base_url?: string;
        token_url?: string;
        system_name?: string | null;
      }>(`/api/integrations/sap/status?business_id=${encodeURIComponent(businessId)}`);
      if (json.connected) {
        setAlreadyConnected(true);
        if (json.api_base_url) setApiBaseUrl(json.api_base_url);
        if (json.token_url) setTokenUrl(json.token_url);
        setExistingSystemName(json.system_name ?? null);
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
    const base = apiBaseUrl.trim();
    const token = tokenUrl.trim();
    const id = clientId.trim();
    const secret = clientSecret.trim();
    if (!base || !token || !id || !secret) {
      setError("Fill in API base URL, Token URL, Client ID, and Client Secret.");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      const json = await dashboardApiPost<{
        ok: boolean;
        system_name?: string | null;
      }>("/api/integrations/sap/connect", {
        business_id: businessId.trim(),
        api_base_url: base,
        token_url: token,
        client_id: id,
        client_secret: secret,
      });
      if (json.system_name) setExistingSystemName(json.system_name);
      router.push("/business/dashboard/integrations?connected=sap");
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
          {alreadyConnected ? "Update SAP connection" : "Connect SAP"}
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          Tellacity verifies your SAP OAuth credentials and OData API access, stores them
          server-side, and acts as the bridge when you are ready to sync customer data and
          feedback with SAP.
        </p>

        <ol className="mt-5 list-decimal space-y-2 pl-5 text-sm text-gray-700">
          <li>
            In SAP (S/4HANA Cloud or BTP), create a{" "}
            <span className="font-medium">Communication Arrangement</span> for the OData APIs you
            need (for example Business Partner).
          </li>
          <li>
            Copy the <span className="font-medium">OAuth Client ID</span>,{" "}
            <span className="font-medium">Client Secret</span>, and{" "}
            <span className="font-medium">Token URL</span> from the arrangement.
          </li>
          <li>
            Paste your <span className="font-medium">API base URL</span> — your system root or OData
            service URL (for example{" "}
            <span className="font-mono text-xs">https://mycompany.s4hana.cloud.sap</span>).
          </li>
        </ol>

        {alreadyConnected ? (
          <p className="mt-4 rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
            {existingSystemName ? (
              <>
                Connected to <span className="font-semibold">{existingSystemName}</span>. Submit new
                credentials to replace the saved connection, or{" "}
              </>
            ) : (
              <>This business already has SAP linked. Submit new credentials to replace it, or </>
            )}
            <Link
              href={sapManagePath(businessId)}
              className="font-semibold underline underline-offset-2"
            >
              manage the current connection
            </Link>
            .
          </p>
        ) : null}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="api_base_url" className="block text-sm font-medium text-gray-700">
              API base URL
            </label>
            <input
              id="api_base_url"
              type="url"
              value={apiBaseUrl}
              onChange={(e) => setApiBaseUrl(e.target.value)}
              placeholder="https://mycompany.s4hana.cloud.sap"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 font-mono text-sm shadow-sm focus:border-[#1FAF9E] focus:outline-none focus:ring-1 focus:ring-[#1FAF9E]"
              autoComplete="off"
              spellCheck={false}
            />
          </div>

          <div>
            <label htmlFor="token_url" className="block text-sm font-medium text-gray-700">
              OAuth token URL
            </label>
            <input
              id="token_url"
              type="url"
              value={tokenUrl}
              onChange={(e) => setTokenUrl(e.target.value)}
              placeholder="https://…/oauth/token"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 font-mono text-sm shadow-sm focus:border-[#1FAF9E] focus:outline-none focus:ring-1 focus:ring-[#1FAF9E]"
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
              placeholder="From communication arrangement"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 font-mono text-sm shadow-sm focus:border-[#1FAF9E] focus:outline-none focus:ring-1 focus:ring-[#1FAF9E]"
              autoComplete="off"
              spellCheck={false}
            />
          </div>

          <div>
            <label htmlFor="client_secret" className="block text-sm font-medium text-gray-700">
              Client Secret
            </label>
            <PasswordInput
              id="client_secret"
              value={clientSecret}
              onChange={(e) => setClientSecret(e.target.value)}
              placeholder="From communication arrangement"
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
                ? "Verifying credentials…"
                : alreadyConnected
                  ? "Save credentials"
                  : "Connect SAP"}
            </button>
            <Link
              href={
                alreadyConnected ? sapManagePath(businessId) : integrationConnectorPath("sap")
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
