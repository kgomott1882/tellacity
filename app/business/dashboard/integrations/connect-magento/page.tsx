"use client";

import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useBusinessContext } from "../../_context/BusinessContext";
import { dashboardApiGet, dashboardApiPost } from "@/lib/dashboardApiFetch";
import PasswordInput from "@/components/ui/PasswordInput";
import {
  integrationConnectorPath,
  magentoManagePath,
} from "@/lib/integrationConnectPaths";

export default function ConnectMagentoPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const paramBusinessId = searchParams.get("business_id") ?? "";
  const { selectedBusiness } = useBusinessContext();
  const businessId = paramBusinessId || selectedBusiness?.id || "";

  const [siteUrl, setSiteUrl] = useState("");
  const [storeCode, setStoreCode] = useState("default");
  const [accessToken, setAccessToken] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [alreadyConnected, setAlreadyConnected] = useState(false);

  const loadExisting = useCallback(async () => {
    if (!businessId.trim()) return;
    try {
      const json = await dashboardApiGet<{
        connected: boolean;
        site_url?: string;
        store_code?: string;
      }>(
        `/api/integrations/magento/status?business_id=${encodeURIComponent(businessId)}`,
      );
      if (json.connected && json.site_url) {
        setAlreadyConnected(true);
        setSiteUrl(json.site_url);
        if (json.store_code) setStoreCode(json.store_code);
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
    const su = siteUrl.trim();
    const token = accessToken.trim();
    if (!su || !token) {
      setError("Fill in store URL and integration access token.");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      await dashboardApiPost<{ ok: boolean }>("/api/integrations/magento/connect", {
        business_id: businessId.trim(),
        site_url: su,
        access_token: token,
        store_code: storeCode.trim() || "default",
      });
      router.push("/business/dashboard/integrations?connected=magento");
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
          {alreadyConnected ? "Update Magento connection" : "Connect Magento"}
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          Tellacity verifies your Adobe Commerce or Magento Open Source store over HTTPS, saves
          the integration token server-side, and uses it as the bridge when you are ready to sync
          orders and send review invites.
        </p>

        <ol className="mt-5 list-decimal space-y-2 pl-5 text-sm text-gray-700">
          <li>
            In Magento Admin, go to{" "}
            <span className="font-medium">System → Extensions → Integrations</span> (or{" "}
            <span className="font-medium">Stores → Settings → Configuration → Services</span> on
            some versions).
          </li>
          <li>
            Add an integration, grant <span className="font-medium">Sales</span> and related API
            resources, then <span className="font-medium">Activate</span>.
          </li>
          <li>Copy the <span className="font-medium">Access Token</span> shown after activation.</li>
          <li>
            Use your live storefront base URL with HTTPS (http is only allowed for localhost dev).
          </li>
        </ol>

        {alreadyConnected ? (
          <p className="mt-4 rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
            This business already has a Magento store linked. Submit a new token to replace the
            saved connection, or{" "}
            <Link
              href={magentoManagePath(businessId)}
              className="font-semibold underline underline-offset-2"
            >
              manage the current connection
            </Link>
            .
          </p>
        ) : null}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="site_url" className="block text-sm font-medium text-gray-700">
              Store URL
            </label>
            <input
              id="site_url"
              type="url"
              value={siteUrl}
              onChange={(e) => setSiteUrl(e.target.value)}
              placeholder="https://yourstore.com"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-[#1FAF9E] focus:outline-none focus:ring-1 focus:ring-[#1FAF9E]"
              autoComplete="off"
            />
          </div>
          <div>
            <label htmlFor="store_code" className="block text-sm font-medium text-gray-700">
              Store code <span className="font-normal text-gray-500">(optional)</span>
            </label>
            <input
              id="store_code"
              type="text"
              value={storeCode}
              onChange={(e) => setStoreCode(e.target.value)}
              placeholder="default"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-[#1FAF9E] focus:outline-none focus:ring-1 focus:ring-[#1FAF9E]"
              autoComplete="off"
              spellCheck={false}
            />
            <p className="mt-1 text-xs text-gray-500">
              Leave as <span className="font-medium">default</span> unless your developer uses a
              different REST store view code.
            </p>
          </div>
          <div>
            <label htmlFor="access_token" className="block text-sm font-medium text-gray-700">
              Integration access token
            </label>
            <PasswordInput
              id="access_token"
              value={accessToken}
              onChange={(e) => setAccessToken(e.target.value)}
              placeholder="Paste token from Magento Admin"
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
                ? "Verifying store…"
                : alreadyConnected
                  ? "Save new token"
                  : "Connect store"}
            </button>
            <Link
              href={
                alreadyConnected
                  ? magentoManagePath(businessId)
                  : integrationConnectorPath("magento")
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
