"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import Link from "next/link";

export default function ConnectShopifyPage() {
  const searchParams = useSearchParams();
  const businessId = searchParams.get("business_id") ?? "";
  const [shop, setShop] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
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
    if (businessId) params.set("business_id", businessId);
    params.set("shop", shopParam);
    window.location.href = `/api/integrations/shopify/connect?${params.toString()}`;
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="max-w-md">
        <h1 className="text-lg font-semibold text-[#0E0E0E]">Connect Shopify</h1>
        <p className="mt-1 text-sm text-gray-600">
          Enter your Shopify store domain to start the connection. For example:{" "}
          <code className="rounded bg-gray-100 px-1">mystore</code> or{" "}
          <code className="rounded bg-gray-100 px-1">mystore.myshopify.com</code>
        </p>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="shop" className="block text-sm font-medium text-gray-700">
              Store domain
            </label>
            <input
              id="shop"
              type="text"
              value={shop}
              onChange={(e) => setShop(e.target.value)}
              placeholder="mystore"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-[#1FAF9E] focus:outline-none focus:ring-1 focus:ring-[#1FAF9E]"
              autoComplete="off"
            />
          </div>
          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}
          <div className="flex gap-3">
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-md bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 transition"
            >
              Continue to Shopify
            </button>
            <Link
              href="/business/dashboard/integrations"
              className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
