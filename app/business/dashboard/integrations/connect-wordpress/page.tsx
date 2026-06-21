"use client";

import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useBusinessContext } from "../../_context/BusinessContext";
import { dashboardApiGet, dashboardApiPost } from "@/lib/dashboardApiFetch";
import {
  integrationConnectorPath,
  wordPressManagePath,
} from "@/lib/integrationConnectPaths";

export default function ConnectWordPressPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const paramBusinessId = searchParams.get("business_id") ?? "";
  const { selectedBusiness } = useBusinessContext();
  const businessId = paramBusinessId || selectedBusiness?.id || "";

  const [siteUrl, setSiteUrl] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [alreadyConnected, setAlreadyConnected] = useState(false);
  const [existingSiteName, setExistingSiteName] = useState<string | null>(null);

  const loadExisting = useCallback(async () => {
    if (!businessId.trim()) return;
    try {
      const json = await dashboardApiGet<{
        connected: boolean;
        site_url?: string;
        site_name?: string | null;
      }>(
        `/api/integrations/wordpress/status?business_id=${encodeURIComponent(businessId)}`,
      );
      if (json.connected && json.site_url) {
        setAlreadyConnected(true);
        setSiteUrl(json.site_url);
        setExistingSiteName(json.site_name ?? null);
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
    if (!su) {
      setError("Enter your WordPress site URL.");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      const json = await dashboardApiPost<{
        ok: boolean;
        site_name?: string | null;
      }>("/api/integrations/wordpress/connect", {
        business_id: businessId.trim(),
        site_url: su,
      });
      if (json.site_name) setExistingSiteName(json.site_name);
      router.push("/business/dashboard/integrations?connected=wordpress");
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
          {alreadyConnected ? "Update WordPress site" : "Connect WordPress"}
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          Tellacity verifies your WordPress site, links it to this business, and gives you embed
          snippets for review widgets and flows. We act as the bridge between your dashboard and
          your site.
        </p>

        <ol className="mt-5 list-decimal space-y-2 pl-5 text-sm text-gray-700">
          <li>Enter the public URL where WordPress is installed (your homepage).</li>
          <li>
            We check that the WordPress REST API is available at{" "}
            <span className="font-mono text-xs">/wp-json/</span>.
          </li>
          <li>
            After connecting, open{" "}
            <span className="font-medium">Share → Website widgets</span> to copy embed code into a
            Custom HTML block, page builder, or theme template.
          </li>
          <li>
            In WordPress, use <span className="font-medium">Settings → Permalinks</span> and avoid
            Plain permalinks so REST routes work.
          </li>
        </ol>

        {alreadyConnected ? (
          <p className="mt-4 rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
            {existingSiteName ? (
              <>
                Linked site: <span className="font-semibold">{existingSiteName}</span>.{" "}
              </>
            ) : null}
            Submit a new URL to replace the link, or{" "}
            <Link
              href={wordPressManagePath(businessId)}
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
              WordPress site URL
            </label>
            <input
              id="site_url"
              type="url"
              value={siteUrl}
              onChange={(e) => setSiteUrl(e.target.value)}
              placeholder="https://yourblog.com"
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
                ? "Verifying site…"
                : alreadyConnected
                  ? "Save new URL"
                  : "Connect site"}
            </button>
            <Link
              href={
                alreadyConnected
                  ? wordPressManagePath(businessId)
                  : integrationConnectorPath("wordpress")
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
