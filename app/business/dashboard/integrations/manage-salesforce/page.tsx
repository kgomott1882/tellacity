"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useBusinessContext } from "../../_context/BusinessContext";
import { dashboardApiGet, dashboardApiPost } from "@/lib/dashboardApiFetch";
import {
  integrationConnectorPath,
  salesforceConnectPath,
} from "@/lib/integrationConnectPaths";

type SalesforceStatus =
  | { loading: true }
  | { loading: false; connected: false }
  | {
      loading: false;
      connected: true;
      login_host: string;
      instance_url: string | null;
      org_id: string | null;
      org_name: string | null;
      connected_at: string;
      updated_at: string;
    };

function formatWhen(iso: string): string {
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return iso;
  return d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

function environmentLabel(loginHost: string): string {
  if (loginHost.includes("test.salesforce.com")) return "Sandbox";
  return "Production";
}

export default function ManageSalesforcePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const paramBusinessId = searchParams.get("business_id") ?? "";
  const { selectedBusiness } = useBusinessContext();
  const businessId = paramBusinessId || selectedBusiness?.id || "";

  const [status, setStatus] = useState<SalesforceStatus>({ loading: true });
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
        login_host?: string;
        instance_url?: string | null;
        org_id?: string | null;
        org_name?: string | null;
        connected_at?: string;
        updated_at?: string;
      }>(
        `/api/integrations/salesforce/status?business_id=${encodeURIComponent(businessId)}`,
      );
      if (!json.connected) {
        setStatus({ loading: false, connected: false });
        return;
      }
      setStatus({
        loading: false,
        connected: true,
        login_host: json.login_host ?? "https://login.salesforce.com",
        instance_url: json.instance_url ?? null,
        org_id: json.org_id ?? null,
        org_name: json.org_name ?? null,
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
      "Disconnect Salesforce from Tellacity? CRM sync and review visibility on accounts will stop until you connect again.",
    );
    if (!confirmed) return;

    setDisconnecting(true);
    setError("");
    try {
      await dashboardApiPost<{ ok: boolean }>("/api/integrations/salesforce/disconnect", {
        business_id: businessId.trim(),
      });
      router.push("/business/dashboard/integrations?disconnected=salesforce");
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
        <p className="text-sm text-gray-500">Loading Salesforce connection…</p>
      </div>
    );
  }

  if (!status.connected) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h1 className="text-lg font-semibold text-[#0E0E0E]">Salesforce</h1>
        <p className="mt-2 text-sm text-gray-600">
          This business is not connected to Salesforce yet.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href={salesforceConnectPath(businessId)}
            className="inline-flex items-center justify-center rounded-md bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700"
          >
            Connect Salesforce
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
          <h1 className="mt-1 text-lg font-semibold text-[#0E0E0E]">Salesforce</h1>
          <p className="mt-1 text-sm text-gray-600">
            Tellacity can reach your Salesforce org using the Connected App credentials you saved.
          </p>
        </div>
        <span className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
          Active
        </span>
      </div>

      <dl className="mt-6 space-y-4 rounded-xl border border-gray-100 bg-gray-50/80 p-4 text-sm">
        {status.org_name ? (
          <div>
            <dt className="text-xs font-medium text-gray-500">Organization</dt>
            <dd className="mt-1 font-medium text-[#0E0E0E]">{status.org_name}</dd>
          </div>
        ) : null}
        {status.org_id ? (
          <div>
            <dt className="text-xs font-medium text-gray-500">Org ID</dt>
            <dd className="mt-1 font-mono text-xs text-gray-700">{status.org_id}</dd>
          </div>
        ) : null}
        <div>
          <dt className="text-xs font-medium text-gray-500">Environment</dt>
          <dd className="mt-1 text-gray-700">{environmentLabel(status.login_host)}</dd>
        </div>
        {status.instance_url ? (
          <div>
            <dt className="text-xs font-medium text-gray-500">Instance URL</dt>
            <dd className="mt-1 break-all font-mono text-xs text-gray-700">{status.instance_url}</dd>
          </div>
        ) : null}
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
        <h2 className="text-sm font-semibold text-[#0E0E0E]">What happens next</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-gray-600">
          <li>
            Your Connected App credentials are stored server-side and only used by Tellacity
            integrations.
          </li>
          <li>
            When Salesforce sync is enabled for your account, reviews and NPS can appear on Account
            and Opportunity records automatically.
          </li>
          <li>
            Until then, export review data from your{" "}
            <Link href="/business/dashboard/manage-reviews" className="text-[#1FAF9E] hover:underline">
              Reviews
            </Link>{" "}
            dashboard and link records in Salesforce manually.
          </li>
        </ul>
      </section>

      {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}

      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          href={salesforceConnectPath(businessId)}
          className="inline-flex items-center justify-center rounded-md border border-[#1FAF9E] bg-white px-4 py-2 text-sm font-medium text-[#1FAF9E] hover:bg-[#F4FFFD]"
        >
          Update credentials
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
          href={integrationConnectorPath("salesforce")}
          className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-gray-500 hover:text-[#1FAF9E]"
        >
          Integration details
        </Link>
        <Link
          href="/business/dashboard/integrations"
          className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-gray-500 hover:text-[#1FAF9E]"
        >
          All integrations
        </Link>
      </div>
    </div>
  );
}
