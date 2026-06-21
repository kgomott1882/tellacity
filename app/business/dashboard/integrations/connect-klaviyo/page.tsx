"use client";

import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useBusinessContext } from "../../_context/BusinessContext";
import { dashboardApiGet, dashboardApiPost } from "@/lib/dashboardApiFetch";
import PasswordInput from "@/components/ui/PasswordInput";
import {
  integrationConnectorPath,
  klaviyoManagePath,
} from "@/lib/integrationConnectPaths";

export default function ConnectKlaviyoPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const paramBusinessId = searchParams.get("business_id") ?? "";
  const { selectedBusiness } = useBusinessContext();
  const businessId = paramBusinessId || selectedBusiness?.id || "";

  const [privateApiKey, setPrivateApiKey] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [alreadyConnected, setAlreadyConnected] = useState(false);
  const [existingAccountName, setExistingAccountName] = useState<string | null>(null);

  const loadExisting = useCallback(async () => {
    if (!businessId.trim()) return;
    try {
      const json = await dashboardApiGet<{
        connected: boolean;
        account_name?: string | null;
      }>(
        `/api/integrations/klaviyo/status?business_id=${encodeURIComponent(businessId)}`,
      );
      if (json.connected) {
        setAlreadyConnected(true);
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
    const key = privateApiKey.trim();
    if (!key) {
      setError("Paste your Klaviyo private API key.");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      const json = await dashboardApiPost<{
        ok: boolean;
        account_name?: string | null;
      }>("/api/integrations/klaviyo/connect", {
        business_id: businessId.trim(),
        private_api_key: key,
      });
      if (json.account_name) setExistingAccountName(json.account_name);
      router.push("/business/dashboard/integrations?connected=klaviyo");
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
          {alreadyConnected ? "Update Klaviyo API key" : "Connect Klaviyo"}
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          Tellacity verifies your Klaviyo account, stores the private API key server-side, and
          acts as the bridge when you are ready to add review links into campaigns and post-purchase
          flows.
        </p>

        <ol className="mt-5 list-decimal space-y-2 pl-5 text-sm text-gray-700">
          <li>
            In Klaviyo, open{" "}
            <span className="font-medium">Settings → API keys</span> (or Account → Settings →
            API keys).
          </li>
          <li>
            Create a <span className="font-medium">Private API key</span> with read access to
            Accounts (add Profiles and Events write scopes when you enable automated flows).
          </li>
          <li>Copy the key and paste it below. It is only stored on Tellacity servers.</li>
        </ol>

        {alreadyConnected ? (
          <p className="mt-4 rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
            {existingAccountName ? (
              <>
                Connected to <span className="font-semibold">{existingAccountName}</span>. Submit a
                new key to replace the saved connection, or{" "}
              </>
            ) : (
              <>This business already has Klaviyo linked. Submit a new key to replace it, or </>
            )}
            <Link
              href={klaviyoManagePath(businessId)}
              className="font-semibold underline underline-offset-2"
            >
              manage the current connection
            </Link>
            .
          </p>
        ) : null}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="private_api_key" className="block text-sm font-medium text-gray-700">
              Private API key
            </label>
            <PasswordInput
              id="private_api_key"
              value={privateApiKey}
              onChange={(e) => setPrivateApiKey(e.target.value)}
              placeholder="pk_…"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 font-mono text-sm shadow-sm focus:border-[#1FAF9E] focus:outline-none focus:ring-1 focus:ring-[#1FAF9E]"
              autoComplete="off"
              spellCheck={false}
            />
            <p className="mt-1 text-xs text-gray-500">
              Use a private key (starts with <span className="font-mono">pk_</span>), not your
              public site ID.
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
                ? "Verifying key…"
                : alreadyConnected
                  ? "Save new key"
                  : "Connect Klaviyo"}
            </button>
            <Link
              href={
                alreadyConnected
                  ? klaviyoManagePath(businessId)
                  : integrationConnectorPath("klaviyo")
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
