"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useBusinessContext } from "../../_context/BusinessContext";
import { dashboardApiGet, dashboardApiPost } from "@/lib/dashboardApiFetch";
import {
  integrationConnectorPath,
  wordPressConnectPath,
} from "@/lib/integrationConnectPaths";

type WordPressStatus =
  | { loading: true }
  | { loading: false; connected: false }
  | {
      loading: false;
      connected: true;
      site_url: string;
      site_name: string | null;
      connected_at: string;
      updated_at: string;
    };

function formatWhen(iso: string): string {
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return iso;
  return d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

export default function ManageWordPressPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const paramBusinessId = searchParams.get("business_id") ?? "";
  const { selectedBusiness } = useBusinessContext();
  const businessId = paramBusinessId || selectedBusiness?.id || "";

  const [status, setStatus] = useState<WordPressStatus>({ loading: true });
  const [error, setError] = useState("");
  const [disconnecting, setDisconnecting] = useState(false);

  const loadStatus = useCallback(async () => {
    if (!businessId.trim()) {
      setStatus({ loading: false, connected: false });
      return;
    }
    setError("");
    try {
      const json = await dashboardApiGet<{
        connected: boolean;
        site_url?: string;
        site_name?: string | null;
        connected_at?: string;
        updated_at?: string;
      }>(
        `/api/integrations/wordpress/status?business_id=${encodeURIComponent(businessId)}`,
      );
      if (!json.connected) {
        setStatus({ loading: false, connected: false });
        return;
      }
      setStatus({
        loading: false,
        connected: true,
        site_url: json.site_url ?? "",
        site_name: json.site_name ?? null,
        connected_at: json.connected_at ?? "",
        updated_at: json.updated_at ?? "",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load connection");
      setStatus({ loading: false, connected: false });
    }
  }, [businessId]);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  const handleDisconnect = async () => {
    if (!businessId.trim()) return;
    const confirmed = window.confirm(
      "Disconnect WordPress from Tellacity? Your saved site link and embed shortcuts will be removed.",
    );
    if (!confirmed) return;

    setDisconnecting(true);
    setError("");
    try {
      await dashboardApiPost<{ ok: boolean }>("/api/integrations/wordpress/disconnect", {
        business_id: businessId.trim(),
      });
      router.push("/business/dashboard/integrations?disconnected=wordpress");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Disconnect failed");
    } finally {
      setDisconnecting(false);
    }
  };

  if (!businessId.trim()) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-gray-600">
          Select a business in the dashboard, then open this page again.
        </p>
        <Link
          href="/business/dashboard/integrations"
          className="mt-4 inline-block text-sm font-medium text-[#1FAF9E] hover:underline"
        >
          Back to integrations
        </Link>
      </div>
    );
  }

  if (status.loading) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-gray-500">Loading WordPress connection…</p>
      </div>
    );
  }

  if (!status.connected) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h1 className="text-lg font-semibold text-[#0E0E0E]">WordPress</h1>
        <p className="mt-2 text-sm text-gray-600">
          This business is not linked to a WordPress site yet.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href={wordPressConnectPath(businessId)}
            className="inline-flex items-center justify-center rounded-md bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700"
          >
            Connect site
          </Link>
          <Link
            href="/business/dashboard/integrations"
            className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Back to integrations
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-emerald-700">
            Connected
          </p>
          <h1 className="mt-1 text-lg font-semibold text-[#0E0E0E]">WordPress</h1>
          <p className="mt-1 text-sm text-gray-600">
            Your site is verified and linked. Add Tellacity widgets from the dashboard whenever
            you are ready.
          </p>
        </div>
        <span className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
          Active
        </span>
      </div>

      <dl className="mt-6 space-y-4 rounded-xl border border-gray-100 bg-gray-50/80 p-4 text-sm">
        {status.site_name ? (
          <div>
            <dt className="text-xs font-medium text-gray-500">WordPress site name</dt>
            <dd className="mt-1 font-medium text-[#0E0E0E]">{status.site_name}</dd>
          </div>
        ) : null}
        <div>
          <dt className="text-xs font-medium text-gray-500">Site URL</dt>
          <dd className="mt-1 font-medium text-[#0E0E0E] break-all">{status.site_url}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-gray-500">Connected</dt>
          <dd className="mt-1 text-gray-700">{formatWhen(status.connected_at)}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-gray-500">Last updated</dt>
          <dd className="mt-1 text-gray-700">{formatWhen(status.updated_at)}</dd>
        </div>
      </dl>

      <section className="mt-6">
        <h2 className="text-sm font-semibold text-[#0E0E0E]">Add widgets to WordPress</h2>
        <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-gray-600">
          <li>
            Open{" "}
            <Link
              href="/business/dashboard/share/widgets"
              className="font-medium text-[#1FAF9E] hover:underline"
            >
              Share → Website widgets
            </Link>{" "}
            and pick a widget.
          </li>
          <li>Copy the HTML embed snippet from the configure panel.</li>
          <li>
            In WordPress, add a <span className="font-medium">Custom HTML</span> block (or your
            page builder&apos;s HTML widget) where you want reviews to appear.
          </li>
          <li>Paste the snippet, publish the page, and preview on your live site.</li>
        </ol>
      </section>

      {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}

      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          href="/business/dashboard/share/widgets"
          className="inline-flex items-center justify-center rounded-md bg-[#1FAF9E] px-4 py-2 text-sm font-medium text-white hover:bg-[#169786]"
        >
          Open widget gallery
        </Link>
        <Link
          href={wordPressConnectPath(businessId)}
          className="inline-flex items-center justify-center rounded-md border border-[#1FAF9E] bg-white px-4 py-2 text-sm font-medium text-[#1FAF9E] hover:bg-[#F4FFFD]"
        >
          Change site URL
        </Link>
        <button
          type="button"
          onClick={() => void handleDisconnect()}
          disabled={disconnecting}
          className="inline-flex items-center justify-center rounded-md border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-60"
        >
          {disconnecting ? "Disconnecting…" : "Disconnect"}
        </button>
        <Link
          href={integrationConnectorPath("wordpress")}
          className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-gray-500 hover:text-[#1FAF9E]"
        >
          Integration details
        </Link>
      </div>
    </div>
  );
}
