"use client";

import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useBusinessContext } from "../../_context/BusinessContext";
import { dashboardApiGet, dashboardApiPost } from "@/lib/dashboardApiFetch";
import PasswordInput from "@/components/ui/PasswordInput";
import {
  integrationConnectorPath,
  salesforceManagePath,
} from "@/lib/integrationConnectPaths";

type LoginHostChoice = "production" | "sandbox";

export default function ConnectSalesforcePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const paramBusinessId = searchParams.get("business_id") ?? "";
  const { selectedBusiness } = useBusinessContext();
  const businessId = paramBusinessId || selectedBusiness?.id || "";

  const [loginHost, setLoginHost] = useState<LoginHostChoice>("production");
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [refreshToken, setRefreshToken] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [alreadyConnected, setAlreadyConnected] = useState(false);
  const [existingOrgName, setExistingOrgName] = useState<string | null>(null);

  const loadExisting = useCallback(async () => {
    if (!businessId.trim()) return;
    try {
      const json = await dashboardApiGet<{
        connected: boolean;
        login_host?: string;
        org_name?: string | null;
      }>(
        `/api/integrations/salesforce/status?business_id=${encodeURIComponent(businessId)}`,
      );
      if (json.connected) {
        setAlreadyConnected(true);
        setExistingOrgName(json.org_name ?? null);
        if (json.login_host?.includes("test.salesforce.com")) {
          setLoginHost("sandbox");
        }
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
    const id = clientId.trim();
    const secret = clientSecret.trim();
    const refresh = refreshToken.trim();
    if (!id || !secret || !refresh) {
      setError("Fill in Client ID, Client Secret, and Refresh Token.");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      const json = await dashboardApiPost<{
        ok: boolean;
        org_name?: string | null;
      }>("/api/integrations/salesforce/connect", {
        business_id: businessId.trim(),
        login_host: loginHost,
        client_id: id,
        client_secret: secret,
        refresh_token: refresh,
      });
      if (json.org_name) setExistingOrgName(json.org_name);
      router.push("/business/dashboard/integrations?connected=salesforce");
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
          {alreadyConnected ? "Update Salesforce connection" : "Connect Salesforce"}
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          Tellacity verifies your Salesforce Connected App credentials, stores them server-side, and
          acts as the bridge when you are ready to surface reviews, NPS, and feedback on accounts
          and opportunities.
        </p>

        <ol className="mt-5 list-decimal space-y-2 pl-5 text-sm text-gray-700">
          <li>
            In Salesforce Setup, create a{" "}
            <span className="font-medium">Connected App</span> (App Manager → New Connected App).
          </li>
          <li>
            Enable OAuth scopes: <span className="font-medium">api</span>,{" "}
            <span className="font-medium">refresh_token</span>, and{" "}
            <span className="font-medium">offline_access</span>. Note the Consumer Key and Consumer
            Secret.
          </li>
          <li>
            Authorize the app for your integration user (OAuth web flow or admin-approved user) and
            copy the <span className="font-medium">refresh token</span>.
          </li>
          <li>Paste the credentials below. Tellacity exchanges the refresh token to verify API access.</li>
        </ol>

        {alreadyConnected ? (
          <p className="mt-4 rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
            {existingOrgName ? (
              <>
                Connected to <span className="font-semibold">{existingOrgName}</span>. Submit new
                credentials to replace the saved connection, or{" "}
              </>
            ) : (
              <>This business already has Salesforce linked. Submit new credentials to replace it, or </>
            )}
            <Link
              href={salesforceManagePath(businessId)}
              className="font-semibold underline underline-offset-2"
            >
              manage the current connection
            </Link>
            .
          </p>
        ) : null}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <span className="block text-sm font-medium text-gray-700">Environment</span>
            <div className="mt-2 flex flex-wrap gap-4 text-sm text-gray-700">
              <label className="inline-flex items-center gap-2">
                <input
                  type="radio"
                  name="login_host"
                  value="production"
                  checked={loginHost === "production"}
                  onChange={() => setLoginHost("production")}
                  className="text-[#1FAF9E] focus:ring-[#1FAF9E]"
                />
                Production (login.salesforce.com)
              </label>
              <label className="inline-flex items-center gap-2">
                <input
                  type="radio"
                  name="login_host"
                  value="sandbox"
                  checked={loginHost === "sandbox"}
                  onChange={() => setLoginHost("sandbox")}
                  className="text-[#1FAF9E] focus:ring-[#1FAF9E]"
                />
                Sandbox (test.salesforce.com)
              </label>
            </div>
          </div>

          <div>
            <label htmlFor="client_id" className="block text-sm font-medium text-gray-700">
              Client ID (Consumer Key)
            </label>
            <input
              id="client_id"
              type="text"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              placeholder="3MVG9…"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 font-mono text-sm shadow-sm focus:border-[#1FAF9E] focus:outline-none focus:ring-1 focus:ring-[#1FAF9E]"
              autoComplete="off"
              spellCheck={false}
            />
          </div>

          <div>
            <label htmlFor="client_secret" className="block text-sm font-medium text-gray-700">
              Client Secret (Consumer Secret)
            </label>
            <PasswordInput
              id="client_secret"
              value={clientSecret}
              onChange={(e) => setClientSecret(e.target.value)}
              placeholder="••••••••"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 font-mono text-sm shadow-sm focus:border-[#1FAF9E] focus:outline-none focus:ring-1 focus:ring-[#1FAF9E]"
              autoComplete="off"
              spellCheck={false}
            />
          </div>

          <div>
            <label htmlFor="refresh_token" className="block text-sm font-medium text-gray-700">
              Refresh token
            </label>
            <PasswordInput
              id="refresh_token"
              value={refreshToken}
              onChange={(e) => setRefreshToken(e.target.value)}
              placeholder="5Aep…"
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
                  ? "Save new credentials"
                  : "Connect Salesforce"}
            </button>
            <Link
              href={
                alreadyConnected
                  ? salesforceManagePath(businessId)
                  : integrationConnectorPath("salesforce")
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
