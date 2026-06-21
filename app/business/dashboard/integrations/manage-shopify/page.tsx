"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useBusinessContext } from "../../_context/BusinessContext";
import { dashboardApiGet, dashboardApiPost } from "@/lib/dashboardApiFetch";
import {
  integrationConnectorPath,
  shopifyConnectPath,
} from "@/lib/integrationConnectPaths";

type ShopifyStatus =
  | { loading: true }
  | { loading: false; connected: false }
  | {
      loading: false;
      connected: true;
      shop_domain: string;
      shop_name: string | null;
      scope: string | null;
      webhook_registered: boolean;
      token_valid: boolean;
      token_error: string | null;
      connected_at: string;
      updated_at: string;
    };

function formatWhen(iso: string): string {
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return iso;
  return d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

export default function ManageShopifyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const paramBusinessId = searchParams.get("business_id") ?? "";
  const { selectedBusiness } = useBusinessContext();
  const businessId = paramBusinessId || selectedBusiness?.id || "";

  const [status, setStatus] = useState<ShopifyStatus>({ loading: true });
  const [error, setError] = useState("");
  const [loadFailed, setLoadFailed] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [registeringWebhooks, setRegisteringWebhooks] = useState(false);

  const loadStatus = useCallback(async () => {
    if (!businessId.trim()) {
      setStatus({ loading: false, connected: false });
      return;
    }
    setError("");
    setLoadFailed(false);
    try {
      const json = await dashboardApiGet<{
        connected: boolean;
        shop_domain?: string;
        shop_name?: string | null;
        scope?: string | null;
        webhook_registered?: boolean;
        token_valid?: boolean;
        token_error?: string | null;
        connected_at?: string;
        updated_at?: string;
      }>(
        `/api/integrations/shopify/status?business_id=${encodeURIComponent(businessId)}`,
      );
      if (!json.connected) {
        setStatus({ loading: false, connected: false });
        return;
      }
      setStatus({
        loading: false,
        connected: true,
        shop_domain: json.shop_domain ?? "",
        shop_name: json.shop_name ?? null,
        scope: json.scope ?? null,
        webhook_registered: Boolean(json.webhook_registered),
        token_valid: Boolean(json.token_valid),
        token_error: json.token_error ?? null,
        connected_at: json.connected_at ?? "",
        updated_at: json.updated_at ?? "",
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not load connection";
      setError(message);
      setLoadFailed(true);
      setStatus({ loading: false, connected: false });
    }
  }, [businessId]);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  const handleDisconnect = async () => {
    if (!businessId.trim()) return;
    const confirmed = window.confirm(
      "Disconnect Shopify from Tellacity? Order webhooks and review invites from Shopify orders will stop until you connect again.",
    );
    if (!confirmed) return;

    setDisconnecting(true);
    setError("");
    try {
      await dashboardApiPost<{ ok: boolean }>("/api/integrations/shopify/disconnect", {
        business_id: businessId.trim(),
      });
      router.push("/business/dashboard/integrations?disconnected=shopify");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Disconnect failed");
    } finally {
      setDisconnecting(false);
    }
  };

  const handleRegisterWebhooks = async () => {
    if (!businessId.trim()) return;
    setRegisteringWebhooks(true);
    setError("");
    try {
      await dashboardApiPost<{ ok: boolean }>(
        "/api/integrations/shopify/register-webhooks-business",
        { business_id: businessId.trim() },
      );
      await loadStatus();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Webhook registration failed");
    } finally {
      setRegisteringWebhooks(false);
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
        <p className="text-sm text-gray-500">Loading Shopify connection…</p>
      </div>
    );
  }

  if (!status.connected) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h1 className="text-lg font-semibold text-[#0E0E0E]">Shopify</h1>
        {loadFailed ? (
          <>
            <p className="mt-2 text-sm text-gray-600">
              We could not load your Shopify connection status. The integrations list and manage
              page may be out of sync until this is resolved.
            </p>
            {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => void loadStatus()}
                className="inline-flex items-center justify-center rounded-md bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700"
              >
                Retry
              </button>
              <Link
                href="/business/dashboard/integrations"
                className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Back to integrations
              </Link>
            </div>
          </>
        ) : (
          <>
            <p className="mt-2 text-sm text-gray-600">
              This business is not connected to a Shopify store yet.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href={shopifyConnectPath(businessId)}
                className="inline-flex items-center justify-center rounded-md bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700"
              >
                Connect Shopify
              </Link>
              <Link
                href="/business/dashboard/integrations"
                className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Back to integrations
              </Link>
            </div>
          </>
        )}
      </div>
    );
  }

  const adminUrl = `https://${status.shop_domain}/admin`;

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-emerald-700">
            Connected
          </p>
          <h1 className="mt-1 text-lg font-semibold text-[#0E0E0E]">Shopify</h1>
          <p className="mt-1 text-sm text-gray-600">
            Your store is linked via OAuth. Tellacity listens for order webhooks when registered.
          </p>
        </div>
        <span
          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
            status.token_valid
              ? "bg-emerald-50 text-emerald-700"
              : "bg-amber-50 text-amber-800"
          }`}
        >
          {status.token_valid ? "Active" : "Needs attention"}
        </span>
      </div>

      {!status.token_valid && status.token_error ? (
        <p className="mt-4 rounded-lg border border-amber-100 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          {status.token_error}{" "}
          <Link href={shopifyConnectPath(businessId)} className="font-semibold underline">
            Reconnect via Shopify
          </Link>
          .
        </p>
      ) : null}

      {!status.webhook_registered ? (
        <p className="mt-4 rounded-lg border border-amber-100 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          Order webhooks are not registered yet. Register them so Tellacity can receive Shopify
          orders.
        </p>
      ) : null}

      <dl className="mt-6 space-y-4 rounded-xl border border-gray-100 bg-gray-50/80 p-4 text-sm">
        {status.shop_name ? (
          <div>
            <dt className="text-xs font-medium text-gray-500">Store</dt>
            <dd className="mt-1 font-medium text-[#0E0E0E]">{status.shop_name}</dd>
          </div>
        ) : null}
        <div>
          <dt className="text-xs font-medium text-gray-500">Shop domain</dt>
          <dd className="mt-1 text-gray-700">
            <a
              href={adminUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#1FAF9E] hover:underline break-all"
            >
              {status.shop_domain}
            </a>
          </dd>
        </div>
        {status.scope ? (
          <div>
            <dt className="text-xs font-medium text-gray-500">Scopes</dt>
            <dd className="mt-1 text-xs text-gray-700">{status.scope}</dd>
          </div>
        ) : null}
        <div>
          <dt className="text-xs font-medium text-gray-500">Order webhooks</dt>
          <dd className="mt-1 text-gray-700">
            {status.webhook_registered ? "Registered (orders/create, orders/fulfilled)" : "Not registered"}
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
        <h2 className="text-sm font-semibold text-[#0E0E0E]">What happens next</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-gray-600">
          <li>Your access token is stored server-side and is only used by Tellacity integrations.</li>
          <li>
            When order-based review invites run for your account, fulfilled Shopify orders can
            trigger invitations automatically.
          </li>
          <li>
            Until then, use{" "}
            <Link href="/business/dashboard/get-reviews" className="text-[#1FAF9E] hover:underline">
              Get reviews
            </Link>{" "}
            to send invitations manually.
          </li>
        </ul>
      </section>

      {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}

      <div className="mt-6 flex flex-wrap gap-3">
        {!status.webhook_registered ? (
          <button
            type="button"
            onClick={() => void handleRegisterWebhooks()}
            disabled={registeringWebhooks}
            className="inline-flex items-center justify-center rounded-md bg-[#1FAF9E] px-4 py-2 text-sm font-medium text-white hover:bg-[#169786] disabled:opacity-60"
          >
            {registeringWebhooks ? "Registering webhooks…" : "Register order webhooks"}
          </button>
        ) : null}
        <Link
          href={shopifyConnectPath(businessId)}
          className="inline-flex items-center justify-center rounded-md border border-[#1FAF9E] bg-white px-4 py-2 text-sm font-medium text-[#1FAF9E] hover:bg-[#F4FFFD]"
        >
          Reconnect store
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
          href={integrationConnectorPath("shopify")}
          className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-gray-500 hover:text-[#1FAF9E]"
        >
          Integration details
        </Link>
      </div>
    </div>
  );
}
