"use client";

import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useBusinessContext } from "../../_context/BusinessContext";
import { dashboardApiGet, dashboardApiPost } from "@/lib/dashboardApiFetch";
import PasswordInput from "@/components/ui/PasswordInput";
import {
  integrationConnectorPath,
  netsuiteManagePath,
} from "@/lib/integrationConnectPaths";

export default function ConnectNetsuitePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const paramBusinessId = searchParams.get("business_id") ?? "";
  const { selectedBusiness } = useBusinessContext();
  const businessId = paramBusinessId || selectedBusiness?.id || "";

  const [accountId, setAccountId] = useState("");
  const [consumerKey, setConsumerKey] = useState("");
  const [consumerSecret, setConsumerSecret] = useState("");
  const [tokenId, setTokenId] = useState("");
  const [tokenSecret, setTokenSecret] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [alreadyConnected, setAlreadyConnected] = useState(false);
  const [existingAccountName, setExistingAccountName] = useState<string | null>(null);

  const loadExisting = useCallback(async () => {
    if (!businessId.trim()) return;
    try {
      const json = await dashboardApiGet<{
        connected: boolean;
        account_id?: string;
        account_name?: string | null;
      }>(
        `/api/integrations/netsuite/status?business_id=${encodeURIComponent(businessId)}`,
      );
      if (json.connected) {
        setAlreadyConnected(true);
        if (json.account_id) setAccountId(json.account_id);
        setExistingAccountName(json.account_name ?? null);
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
    const acct = accountId.trim();
    const key = consumerKey.trim();
    const secret = consumerSecret.trim();
    const tid = tokenId.trim();
    const tsecret = tokenSecret.trim();
    if (!acct || !key || !secret || !tid || !tsecret) {
      setError("Fill in Account ID, Consumer Key/Secret, and Token ID/Secret.");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      const json = await dashboardApiPost<{
        ok: boolean;
        account_name?: string | null;
      }>("/api/integrations/netsuite/connect", {
        business_id: businessId.trim(),
        account_id: acct,
        consumer_key: key,
        consumer_secret: secret,
        token_id: tid,
        token_secret: tsecret,
      });
      if (json.account_name) setExistingAccountName(json.account_name);
      router.push("/business/dashboard/integrations?connected=netsuite");
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
          {alreadyConnected ? "Update NetSuite connection" : "Connect NetSuite"}
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          Tellacity verifies your NetSuite Token-Based Authentication credentials, stores them
          server-side, and acts as the bridge when you are ready to link customer records with
          Tellacity feedback.
        </p>

        <ol className="mt-5 list-decimal space-y-2 pl-5 text-sm text-gray-700">
          <li>
            In NetSuite, go to{" "}
            <span className="font-medium">Setup → Integration → Manage Integrations</span> and
            create an integration with <span className="font-medium">Token-Based Authentication</span>{" "}
            and <span className="font-medium">REST Web Services</span> enabled.
          </li>
          <li>
            Note your <span className="font-medium">Account ID</span> (Setup → Company → Company
            Information). Sandbox accounts end with <span className="font-mono">_SB1</span>.
          </li>
          <li>
            Create an <span className="font-medium">Access Token</span> for a role with customer
            read permissions. Copy Consumer Key/Secret and Token ID/Secret below.
          </li>
        </ol>

        {alreadyConnected ? (
          <p className="mt-4 rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
            {existingAccountName ? (
              <>
                Connected to <span className="font-semibold">{existingAccountName}</span>. Submit
                new credentials to replace the saved connection, or{" "}
              </>
            ) : (
              <>This business already has NetSuite linked. Submit new credentials to replace it, or </>
            )}
            <Link
              href={netsuiteManagePath(businessId)}
              className="font-semibold underline underline-offset-2"
            >
              manage the current connection
            </Link>
            .
          </p>
        ) : null}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="account_id" className="block text-sm font-medium text-gray-700">
              Account ID
            </label>
            <input
              id="account_id"
              type="text"
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              placeholder="1234567 or 1234567_SB1"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 font-mono text-sm shadow-sm focus:border-[#1FAF9E] focus:outline-none focus:ring-1 focus:ring-[#1FAF9E]"
              autoComplete="off"
              spellCheck={false}
            />
          </div>

          <div>
            <label htmlFor="consumer_key" className="block text-sm font-medium text-gray-700">
              Consumer Key
            </label>
            <input
              id="consumer_key"
              type="text"
              value={consumerKey}
              onChange={(e) => setConsumerKey(e.target.value)}
              placeholder="From integration record"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 font-mono text-sm shadow-sm focus:border-[#1FAF9E] focus:outline-none focus:ring-1 focus:ring-[#1FAF9E]"
              autoComplete="off"
              spellCheck={false}
            />
          </div>

          <div>
            <label htmlFor="consumer_secret" className="block text-sm font-medium text-gray-700">
              Consumer Secret
            </label>
            <PasswordInput
              id="consumer_secret"
              value={consumerSecret}
              onChange={(e) => setConsumerSecret(e.target.value)}
              placeholder="From integration record"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 font-mono text-sm shadow-sm focus:border-[#1FAF9E] focus:outline-none focus:ring-1 focus:ring-[#1FAF9E]"
              autoComplete="off"
              spellCheck={false}
            />
          </div>

          <div>
            <label htmlFor="token_id" className="block text-sm font-medium text-gray-700">
              Token ID
            </label>
            <input
              id="token_id"
              type="text"
              value={tokenId}
              onChange={(e) => setTokenId(e.target.value)}
              placeholder="From access token"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 font-mono text-sm shadow-sm focus:border-[#1FAF9E] focus:outline-none focus:ring-1 focus:ring-[#1FAF9E]"
              autoComplete="off"
              spellCheck={false}
            />
          </div>

          <div>
            <label htmlFor="token_secret" className="block text-sm font-medium text-gray-700">
              Token Secret
            </label>
            <PasswordInput
              id="token_secret"
              value={tokenSecret}
              onChange={(e) => setTokenSecret(e.target.value)}
              placeholder="From access token"
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
                ? "Verifying credentials…"
                : alreadyConnected
                  ? "Save credentials"
                  : "Connect NetSuite"}
            </button>
            <Link
              href={
                alreadyConnected
                  ? netsuiteManagePath(businessId)
                  : integrationConnectorPath("netsuite")
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
