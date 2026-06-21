"use client";

import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useBusinessContext } from "../../_context/BusinessContext";
import { dashboardApiGet, dashboardApiPost } from "@/lib/dashboardApiFetch";
import PasswordInput from "@/components/ui/PasswordInput";
import {
  integrationConnectorPath,
  wooCommerceManagePath,
} from "@/lib/integrationConnectPaths";

export default function ConnectWooCommercePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const paramBusinessId = searchParams.get("business_id") ?? "";
  const { selectedBusiness } = useBusinessContext();
  const businessId = paramBusinessId || selectedBusiness?.id || "";

  const [siteUrl, setSiteUrl] = useState("");
  const [consumerKey, setConsumerKey] = useState("");
  const [consumerSecret, setConsumerSecret] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [alreadyConnected, setAlreadyConnected] = useState(false);

  const loadExisting = useCallback(async () => {
    if (!businessId.trim()) return;
    try {
      const json = await dashboardApiGet<{
        connected: boolean;
        site_url?: string;
      }>(
        `/api/integrations/woocommerce/status?business_id=${encodeURIComponent(businessId)}`,
      );
      if (json.connected && json.site_url) {
        setAlreadyConnected(true);
        setSiteUrl(json.site_url);
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
    const ck = consumerKey.trim();
    const cs = consumerSecret.trim();
    if (!su || !ck || !cs) {
      setError("Fill in store URL, consumer key, and consumer secret.");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      await dashboardApiPost<{ ok: boolean }>("/api/integrations/woocommerce/connect", {
        business_id: businessId.trim(),
        site_url: su,
        consumer_key: ck,
        consumer_secret: cs,
      });
      router.push("/business/dashboard/integrations?connected=woocommerce");
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
          {alreadyConnected ? "Update WooCommerce connection" : "Connect WooCommerce"}
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          Tellacity verifies your store over HTTPS, saves the keys server-side, and uses them as
          the bridge when you are ready to sync orders and send review invites.
        </p>

        <ol className="mt-5 list-decimal space-y-2 pl-5 text-sm text-gray-700">
          <li>
            In WordPress admin, open{" "}
            <span className="font-medium">WooCommerce → Settings → Advanced → REST API</span>.
          </li>
          <li>
            Click <span className="font-medium">Add key</span>, set permissions to{" "}
            <span className="font-medium">Read/Write</span>, and create the key.
          </li>
          <li>Copy the consumer key and secret below (you will not see the secret again).</li>
          <li>
            Use your live store URL with HTTPS (http is only allowed for localhost dev).
          </li>
        </ol>

        {alreadyConnected ? (
          <p className="mt-4 rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
            This business already has a WooCommerce store linked. Submit new keys to replace the
            saved connection, or{" "}
            <Link
              href={wooCommerceManagePath(businessId)}
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
            <label htmlFor="consumer_key" className="block text-sm font-medium text-gray-700">
              Consumer key
            </label>
            <input
              id="consumer_key"
              type="text"
              value={consumerKey}
              onChange={(e) => setConsumerKey(e.target.value)}
              placeholder="ck_..."
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 font-mono text-sm shadow-sm focus:border-[#1FAF9E] focus:outline-none focus:ring-1 focus:ring-[#1FAF9E]"
              autoComplete="off"
              spellCheck={false}
            />
          </div>
          <div>
            <label htmlFor="consumer_secret" className="block text-sm font-medium text-gray-700">
              Consumer secret
            </label>
            <PasswordInput
              id="consumer_secret"
              value={consumerSecret}
              onChange={(e) => setConsumerSecret(e.target.value)}
              placeholder="cs_..."
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
                  ? "Save new keys"
                  : "Connect store"}
            </button>
            <Link
              href={
                alreadyConnected
                  ? wooCommerceManagePath(businessId)
                  : integrationConnectorPath("woocommerce")
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
