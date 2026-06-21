"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useBusinessContext } from "../../_context/BusinessContext";
import { dashboardApiGet } from "@/lib/dashboardApiFetch";
import {
  integrationConnectorPath,
  shopifyManagePath,
} from "@/lib/integrationConnectPaths";

export default function ConnectShopifyPage() {
  const searchParams = useSearchParams();
  const paramBusinessId = searchParams.get("business_id") ?? "";
  const { selectedBusiness } = useBusinessContext();
  const businessId = paramBusinessId || selectedBusiness?.id || "";

  const [shop, setShop] = useState("");
  const [error, setError] = useState("");
  const [alreadyConnected, setAlreadyConnected] = useState(false);
  const [existingShop, setExistingShop] = useState<string | null>(null);

  const loadExisting = useCallback(async () => {
    if (!businessId.trim()) return;
    try {
      const json = await dashboardApiGet<{
        connected: boolean;
        shop_domain?: string;
        shop_name?: string | null;
      }>(
        `/api/integrations/shopify/status?business_id=${encodeURIComponent(businessId)}`,
      );
      if (json.connected && json.shop_domain) {
        setAlreadyConnected(true);
        setExistingShop(json.shop_name ?? json.shop_domain);
        setShop(json.shop_domain.replace(/\.myshopify\.com$/, ""));
      }
    } catch {
      /* optional prefill */
    }
  }, [businessId]);

  useEffect(() => {
    void loadExisting();
  }, [loadExisting]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessId.trim()) {
      setError("Select a business in the dashboard, then open this page again.");
      return;
    }
    const trimmed = shop.trim().toLowerCase();
    if (!trimmed) {
      setError("Enter your Shopify store domain.");
      return;
    }
    setError("");
    const shopParam = trimmed.endsWith(".myshopify.com")
      ? trimmed
      : `${trimmed}.myshopify.com`;
    const params = new URLSearchParams();
    params.set("business_id", businessId.trim());
    params.set("shop", shopParam);
    window.location.href = `/api/integrations/shopify/connect?${params.toString()}`;
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
          {alreadyConnected ? "Reconnect Shopify store" : "Connect Shopify"}
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          Tellacity uses Shopify OAuth to link your store, register order webhooks, and act as the
          bridge when you are ready to send review invitations after orders.
        </p>

        <ol className="mt-5 list-decimal space-y-2 pl-5 text-sm text-gray-700">
          <li>Enter your store domain and continue to Shopify to approve access.</li>
          <li>
            Scopes requested: <span className="font-medium">read_orders</span> and{" "}
            <span className="font-medium">read_customers</span>.
          </li>
          <li>
            After approval, Tellacity saves the token and registers webhooks for new and fulfilled
            orders.
          </li>
        </ol>

        {alreadyConnected ? (
          <p className="mt-4 rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
            Connected to <span className="font-semibold">{existingShop}</span>. Re-authorize to
            refresh the token, or{" "}
            <Link
              href={shopifyManagePath(businessId)}
              className="font-semibold underline underline-offset-2"
            >
              manage the current connection
            </Link>
            .
          </p>
        ) : null}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="shop" className="block text-sm font-medium text-gray-700">
              Store domain
            </label>
            <div className="mt-1 flex rounded-md shadow-sm">
              <input
                id="shop"
                type="text"
                value={shop}
                onChange={(e) => setShop(e.target.value)}
                placeholder="mystore"
                className="block w-full min-w-0 flex-1 rounded-l-md border border-gray-300 px-3 py-2 text-sm focus:border-[#1FAF9E] focus:outline-none focus:ring-1 focus:ring-[#1FAF9E]"
                autoComplete="off"
                spellCheck={false}
              />
              <span className="inline-flex items-center rounded-r-md border border-l-0 border-gray-300 bg-gray-50 px-3 text-sm text-gray-500">
                .myshopify.com
              </span>
            </div>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-md bg-teal-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-teal-700"
            >
              {alreadyConnected ? "Reconnect via Shopify" : "Continue to Shopify"}
            </button>
            <Link
              href={
                alreadyConnected
                  ? shopifyManagePath(businessId)
                  : integrationConnectorPath("shopify")
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
