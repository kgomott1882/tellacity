"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useBusinessContext } from "../../_context/BusinessContext";
import { dashboardApiGet, dashboardApiPost } from "@/lib/dashboardApiFetch";
import {
  integrationConnectorPath,
  twilioConnectPath,
} from "@/lib/integrationConnectPaths";

type TwilioStatus =
  | { loading: true }
  | { loading: false; connected: false }
  | {
      loading: false;
      connected: true;
      account_sid: string;
      account_friendly_name: string | null;
      from_phone_number: string | null;
      messaging_service_sid: string | null;
      connected_at: string;
      updated_at: string;
    };

function formatWhen(iso: string): string {
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return iso;
  return d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

function maskAccountSid(sid: string): string {
  if (sid.length < 8) return sid;
  return `${sid.slice(0, 4)}…${sid.slice(-4)}`;
}

export default function ManageTwilioPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const paramBusinessId = searchParams.get("business_id") ?? "";
  const { selectedBusiness } = useBusinessContext();
  const businessId = paramBusinessId || selectedBusiness?.id || "";

  const [status, setStatus] = useState<TwilioStatus>({ loading: true });
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
        account_sid?: string;
        account_friendly_name?: string | null;
        from_phone_number?: string | null;
        messaging_service_sid?: string | null;
        connected_at?: string;
        updated_at?: string;
      }>(
        `/api/integrations/twilio/status?business_id=${encodeURIComponent(businessId)}`,
      );
      if (!json.connected) {
        setStatus({ loading: false, connected: false });
        return;
      }
      setStatus({
        loading: false,
        connected: true,
        account_sid: json.account_sid ?? "",
        account_friendly_name: json.account_friendly_name ?? null,
        from_phone_number: json.from_phone_number ?? null,
        messaging_service_sid: json.messaging_service_sid ?? null,
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
      "Disconnect Twilio from Tellacity? SMS review invitations will stop until you connect again.",
    );
    if (!confirmed) return;

    setDisconnecting(true);
    setError("");
    try {
      await dashboardApiPost<{ ok: boolean }>("/api/integrations/twilio/disconnect", {
        business_id: businessId.trim(),
      });
      router.push("/business/dashboard/integrations?disconnected=twilio");
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
        <p className="text-sm text-gray-500">Loading Twilio connection…</p>
      </div>
    );
  }

  if (!status.connected) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h1 className="text-lg font-semibold text-[#0E0E0E]">Twilio</h1>
        <p className="mt-2 text-sm text-gray-600">
          This business is not connected to Twilio yet.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href={twilioConnectPath(businessId)}
            className="inline-flex items-center justify-center rounded-md bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700"
          >
            Connect Twilio
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
          <h1 className="mt-1 text-lg font-semibold text-[#0E0E0E]">Twilio</h1>
          <p className="mt-1 text-sm text-gray-600">
            Tellacity can send SMS through your Twilio account using the credentials you saved.
          </p>
        </div>
        <span className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
          Active
        </span>
      </div>

      <dl className="mt-6 space-y-4 rounded-xl border border-gray-100 bg-gray-50/80 p-4 text-sm">
        {status.account_friendly_name ? (
          <div>
            <dt className="text-xs font-medium text-gray-500">Twilio account</dt>
            <dd className="mt-1 font-medium text-[#0E0E0E]">{status.account_friendly_name}</dd>
          </div>
        ) : null}
        <div>
          <dt className="text-xs font-medium text-gray-500">Account SID</dt>
          <dd className="mt-1 font-mono text-xs text-gray-700">
            {maskAccountSid(status.account_sid)}
          </dd>
        </div>
        {status.from_phone_number ? (
          <div>
            <dt className="text-xs font-medium text-gray-500">Sender number</dt>
            <dd className="mt-1 text-gray-700">{status.from_phone_number}</dd>
          </div>
        ) : null}
        {status.messaging_service_sid ? (
          <div>
            <dt className="text-xs font-medium text-gray-500">Messaging Service SID</dt>
            <dd className="mt-1 font-mono text-xs text-gray-700 break-all">
              {status.messaging_service_sid}
            </dd>
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

      {!status.from_phone_number && !status.messaging_service_sid ? (
        <p className="mt-4 rounded-lg border border-amber-100 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          Add a sender phone number or Messaging Service SID on the connect page so SMS review
          invites are ready when automations go live.
        </p>
      ) : null}

      <section className="mt-6">
        <h2 className="text-sm font-semibold text-[#0E0E0E]">What happens next</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-gray-600">
          <li>Your Auth Token is stored server-side and is only used by Tellacity integrations.</li>
          <li>
            When SMS review invitations are enabled for your account, Tellacity can send invites and
            reminders through your Twilio sender.
          </li>
          <li>
            Until then, use{" "}
            <Link href="/business/dashboard/get-reviews" className="text-[#1FAF9E] hover:underline">
              Get reviews
            </Link>{" "}
            for email and other channels.
          </li>
        </ul>
      </section>

      {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}

      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          href={twilioConnectPath(businessId)}
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
          href={integrationConnectorPath("twilio")}
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
