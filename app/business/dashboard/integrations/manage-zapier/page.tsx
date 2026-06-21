"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useBusinessContext } from "../../_context/BusinessContext";
import { dashboardApiGet, dashboardApiPost } from "@/lib/dashboardApiFetch";
import {
  integrationConnectorPath,
  zapierConnectPath,
} from "@/lib/integrationConnectPaths";

type ZapierStatus =
  | { loading: true }
  | { loading: false; connected: false }
  | {
      loading: false;
      connected: true;
      webhook_url: string;
      zap_label: string | null;
      connected_at: string;
      updated_at: string;
    };

function formatWhen(iso: string): string {
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return iso;
  return d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

function maskWebhookUrl(url: string): string {
  try {
    const u = new URL(url);
    const parts = u.pathname.split("/").filter(Boolean);
    if (parts.length >= 2) {
      const last = parts[parts.length - 1] ?? "";
      parts[parts.length - 1] = last.length > 6 ? `${last.slice(0, 4)}…` : "…";
    }
    return `${u.origin}/${parts.join("/")}`;
  } catch {
    return url.length > 40 ? `${url.slice(0, 36)}…` : url;
  }
}

export default function ManageZapierPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const paramBusinessId = searchParams.get("business_id") ?? "";
  const { selectedBusiness } = useBusinessContext();
  const businessId = paramBusinessId || selectedBusiness?.id || "";

  const [status, setStatus] = useState<ZapierStatus>({ loading: true });
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
        webhook_url?: string;
        zap_label?: string | null;
        connected_at?: string;
        updated_at?: string;
      }>(
        `/api/integrations/zapier/status?business_id=${encodeURIComponent(businessId)}`,
      );
      if (!json.connected) {
        setStatus({ loading: false, connected: false });
        return;
      }
      setStatus({
        loading: false,
        connected: true,
        webhook_url: json.webhook_url ?? "",
        zap_label: json.zap_label ?? null,
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
      "Disconnect Zapier from Tellacity? Automations will stop receiving Tellacity events until you connect again.",
    );
    if (!confirmed) return;

    setDisconnecting(true);
    setError("");
    try {
      await dashboardApiPost<{ ok: boolean }>("/api/integrations/zapier/disconnect", {
        business_id: businessId.trim(),
      });
      router.push("/business/dashboard/integrations?disconnected=zapier");
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
        <p className="text-sm text-gray-500">Loading Zapier connection…</p>
      </div>
    );
  }

  if (!status.connected) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h1 className="text-lg font-semibold text-[#0E0E0E]">Zapier</h1>
        <p className="mt-2 text-sm text-gray-600">
          This business is not connected to Zapier yet.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href={zapierConnectPath(businessId)}
            className="inline-flex items-center justify-center rounded-md bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700"
          >
            Connect Zapier
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
          <h1 className="mt-1 text-lg font-semibold text-[#0E0E0E]">Zapier</h1>
          <p className="mt-1 text-sm text-gray-600">
            Tellacity can forward events to your Zap using the Catch Hook you saved.
          </p>
        </div>
        <span className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
          Active
        </span>
      </div>

      <dl className="mt-6 space-y-4 rounded-xl border border-gray-100 bg-gray-50/80 p-4 text-sm">
        {status.zap_label ? (
          <div>
            <dt className="text-xs font-medium text-gray-500">Zap</dt>
            <dd className="mt-1 font-medium text-[#0E0E0E]">{status.zap_label}</dd>
          </div>
        ) : null}
        <div>
          <dt className="text-xs font-medium text-gray-500">Catch Hook URL</dt>
          <dd className="mt-1 font-mono text-xs text-gray-700 break-all">
            {maskWebhookUrl(status.webhook_url)}
          </dd>
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
        <h2 className="text-sm font-semibold text-[#0E0E0E]">Build your Zap</h2>
        <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-gray-600">
          <li>
            In Zapier, use the Catch Hook test record from Tellacity (event{" "}
            <span className="font-mono text-xs">tellacity.connection_test</span>) to map fields.
          </li>
          <li>Add action steps for the apps you use (CRM, email, spreadsheets, chat, and more).</li>
          <li>
            When Tellacity event automations are enabled, review and feedback events will POST to
            this hook automatically.
          </li>
        </ol>
      </section>

      {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}

      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          href={zapierConnectPath(businessId)}
          className="inline-flex items-center justify-center rounded-md border border-[#1FAF9E] bg-white px-4 py-2 text-sm font-medium text-[#1FAF9E] hover:bg-[#F4FFFD]"
        >
          Update hook URL
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
          href={integrationConnectorPath("zapier")}
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
