"use client";

import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useBusinessContext } from "../../_context/BusinessContext";
import { dashboardApiGet, dashboardApiPost } from "@/lib/dashboardApiFetch";
import PasswordInput from "@/components/ui/PasswordInput";
import {
  integrationConnectorPath,
  hubSpotManagePath,
} from "@/lib/integrationConnectPaths";

export default function ConnectHubSpotPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const paramBusinessId = searchParams.get("business_id") ?? "";
  const { selectedBusiness } = useBusinessContext();
  const businessId = paramBusinessId || selectedBusiness?.id || "";

  const [accessToken, setAccessToken] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [alreadyConnected, setAlreadyConnected] = useState(false);
  const [existingPortalId, setExistingPortalId] = useState<string | null>(null);

  const loadExisting = useCallback(async () => {
    if (!businessId.trim()) return;
    try {
      const json = await dashboardApiGet<{
        connected: boolean;
        portal_id?: string | null;
      }>(
        `/api/integrations/hubspot/status?business_id=${encodeURIComponent(businessId)}`,
      );
      if (json.connected) {
        setAlreadyConnected(true);
        setExistingPortalId(json.portal_id ?? null);
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
    const token = accessToken.trim();
    if (!token) {
      setError("Paste your HubSpot private app access token.");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      const json = await dashboardApiPost<{
        ok: boolean;
        portal_id?: string | null;
      }>("/api/integrations/hubspot/connect", {
        business_id: businessId.trim(),
        access_token: token,
      });
      if (json.portal_id) setExistingPortalId(json.portal_id);
      router.push("/business/dashboard/integrations?connected=hubspot");
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
          {alreadyConnected ? "Update HubSpot access token" : "Connect HubSpot"}
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          Tellacity verifies your HubSpot private app token, stores it server-side, and acts as the
          bridge when you are ready to sync contacts, deals, and review feedback into HubSpot.
        </p>

        <ol className="mt-5 list-decimal space-y-2 pl-5 text-sm text-gray-700">
          <li>
            In HubSpot, go to{" "}
            <span className="font-medium">Settings → Integrations → Private Apps</span> and create
            an app (or open an existing one).
          </li>
          <li>
            Grant scopes such as <span className="font-medium">crm.objects.contacts.read</span> and{" "}
            <span className="font-medium">crm.objects.deals.read</span> (add write scopes when sync
            is enabled).
          </li>
          <li>
            Copy the <span className="font-medium">Access token</span> (starts with{" "}
            <span className="font-mono">pat-</span>) and paste it below.
          </li>
        </ol>

        {alreadyConnected ? (
          <p className="mt-4 rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
            {existingPortalId ? (
              <>
                Connected to HubSpot portal <span className="font-semibold">{existingPortalId}</span>
                . Submit a new token to replace the saved connection, or{" "}
              </>
            ) : (
              <>This business already has HubSpot linked. Submit a new token to replace it, or </>
            )}
            <Link
              href={hubSpotManagePath(businessId)}
              className="font-semibold underline underline-offset-2"
            >
              manage the current connection
            </Link>
            .
          </p>
        ) : null}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="access_token" className="block text-sm font-medium text-gray-700">
              Private app access token
            </label>
            <PasswordInput
              id="access_token"
              value={accessToken}
              onChange={(e) => setAccessToken(e.target.value)}
              placeholder="pat-na1-…"
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
                ? "Verifying token…"
                : alreadyConnected
                  ? "Save new token"
                  : "Connect HubSpot"}
            </button>
            <Link
              href={
                alreadyConnected
                  ? hubSpotManagePath(businessId)
                  : integrationConnectorPath("hubspot")
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
