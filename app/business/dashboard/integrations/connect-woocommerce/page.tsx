"use client";

import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { useBusinessContext } from "../../_context/BusinessContext";
import { dashboardApiPost } from "@/lib/dashboardApiFetch";
import PasswordInput from "@/components/ui/PasswordInput";

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
    } catch (err) {
      setError(err instanceof Error ? err.message : "Connection failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="max-w-md">
        <h1 className="text-lg font-semibold text-[#0E0E0E]">Connect WooCommerce</h1>
        <p className="mt-1 text-sm text-gray-600">
          Use REST API keys from your WordPress admin:{" "}
          <span className="font-medium">WooCommerce → Settings → Advanced → REST API</span>.
          Create a key with <span className="font-medium">Read/Write</span> permission, then paste
          the values below. Your store must use <span className="font-medium">HTTPS</span> in
          production (except local dev).
        </p>
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
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm font-mono text-sm shadow-sm focus:border-[#1FAF9E] focus:outline-none focus:ring-1 focus:ring-[#1FAF9E]"
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
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm font-mono text-sm shadow-sm focus:border-[#1FAF9E] focus:outline-none focus:ring-1 focus:ring-[#1FAF9E]"
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
              {submitting ? "Connecting…" : "Connect store"}
            </button>
            <Link
              href="/business/dashboard/integrations"
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
