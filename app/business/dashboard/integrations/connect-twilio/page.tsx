"use client";

import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useBusinessContext } from "../../_context/BusinessContext";
import { dashboardApiGet, dashboardApiPost } from "@/lib/dashboardApiFetch";
import PasswordInput from "@/components/ui/PasswordInput";
import {
  integrationConnectorPath,
  twilioManagePath,
} from "@/lib/integrationConnectPaths";

export default function ConnectTwilioPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const paramBusinessId = searchParams.get("business_id") ?? "";
  const { selectedBusiness } = useBusinessContext();
  const businessId = paramBusinessId || selectedBusiness?.id || "";

  const [accountSid, setAccountSid] = useState("");
  const [authToken, setAuthToken] = useState("");
  const [fromPhoneNumber, setFromPhoneNumber] = useState("");
  const [messagingServiceSid, setMessagingServiceSid] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [alreadyConnected, setAlreadyConnected] = useState(false);
  const [existingAccountName, setExistingAccountName] = useState<string | null>(null);

  const loadExisting = useCallback(async () => {
    if (!businessId.trim()) return;
    try {
      const json = await dashboardApiGet<{
        connected: boolean;
        account_sid?: string;
        account_friendly_name?: string | null;
        from_phone_number?: string | null;
        messaging_service_sid?: string | null;
      }>(
        `/api/integrations/twilio/status?business_id=${encodeURIComponent(businessId)}`,
      );
      if (json.connected) {
        setAlreadyConnected(true);
        if (json.account_sid) setAccountSid(json.account_sid);
        setExistingAccountName(json.account_friendly_name ?? null);
        if (json.from_phone_number) setFromPhoneNumber(json.from_phone_number);
        if (json.messaging_service_sid) setMessagingServiceSid(json.messaging_service_sid);
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
    const sid = accountSid.trim();
    const token = authToken.trim();
    if (!sid || !token) {
      setError("Fill in Account SID and Auth Token.");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      const json = await dashboardApiPost<{
        ok: boolean;
        account_friendly_name?: string | null;
      }>("/api/integrations/twilio/connect", {
        business_id: businessId.trim(),
        account_sid: sid,
        auth_token: token,
        from_phone_number: fromPhoneNumber.trim() || undefined,
        messaging_service_sid: messagingServiceSid.trim() || undefined,
      });
      if (json.account_friendly_name) setExistingAccountName(json.account_friendly_name);
      router.push("/business/dashboard/integrations?connected=twilio");
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
          {alreadyConnected ? "Update Twilio connection" : "Connect Twilio"}
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          Tellacity verifies your Twilio account, stores credentials server-side, and acts as the
          bridge when you are ready to send SMS review invitations and reminders.
        </p>

        <ol className="mt-5 list-decimal space-y-2 pl-5 text-sm text-gray-700">
          <li>
            In the{" "}
            <a
              href="https://console.twilio.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-[#1FAF9E] hover:underline"
            >
              Twilio Console
            </a>
            , copy your <span className="font-medium">Account SID</span> and{" "}
            <span className="font-medium">Auth Token</span> from the project dashboard.
          </li>
          <li>
            Optionally add a sender phone number (E.164, e.g. +14155552671) or Messaging Service
            SID so SMS is ready when automations go live.
          </li>
          <li>Paste the values below. Credentials are only stored on Tellacity servers.</li>
        </ol>

        {alreadyConnected ? (
          <p className="mt-4 rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
            {existingAccountName ? (
              <>
                Connected to <span className="font-semibold">{existingAccountName}</span>. Submit
                updated credentials to replace the saved connection, or{" "}
              </>
            ) : (
              <>This business already has Twilio linked. Submit new credentials to replace it, or </>
            )}
            <Link
              href={twilioManagePath(businessId)}
              className="font-semibold underline underline-offset-2"
            >
              manage the current connection
            </Link>
            .
          </p>
        ) : null}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="account_sid" className="block text-sm font-medium text-gray-700">
              Account SID
            </label>
            <input
              id="account_sid"
              type="text"
              value={accountSid}
              onChange={(e) => setAccountSid(e.target.value)}
              placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 font-mono text-sm shadow-sm focus:border-[#1FAF9E] focus:outline-none focus:ring-1 focus:ring-[#1FAF9E]"
              autoComplete="off"
              spellCheck={false}
            />
          </div>
          <div>
            <label htmlFor="auth_token" className="block text-sm font-medium text-gray-700">
              Auth token
            </label>
            <PasswordInput
              id="auth_token"
              value={authToken}
              onChange={(e) => setAuthToken(e.target.value)}
              placeholder="Paste from Twilio Console"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 font-mono text-sm shadow-sm focus:border-[#1FAF9E] focus:outline-none focus:ring-1 focus:ring-[#1FAF9E]"
              autoComplete="off"
              spellCheck={false}
            />
          </div>
          <div>
            <label htmlFor="from_phone_number" className="block text-sm font-medium text-gray-700">
              Sender phone number <span className="font-normal text-gray-500">(optional)</span>
            </label>
            <input
              id="from_phone_number"
              type="tel"
              value={fromPhoneNumber}
              onChange={(e) => setFromPhoneNumber(e.target.value)}
              placeholder="+14155552671"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-[#1FAF9E] focus:outline-none focus:ring-1 focus:ring-[#1FAF9E]"
              autoComplete="off"
            />
          </div>
          <div>
            <label
              htmlFor="messaging_service_sid"
              className="block text-sm font-medium text-gray-700"
            >
              Messaging Service SID <span className="font-normal text-gray-500">(optional)</span>
            </label>
            <input
              id="messaging_service_sid"
              type="text"
              value={messagingServiceSid}
              onChange={(e) => setMessagingServiceSid(e.target.value)}
              placeholder="MGxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 font-mono text-sm shadow-sm focus:border-[#1FAF9E] focus:outline-none focus:ring-1 focus:ring-[#1FAF9E]"
              autoComplete="off"
              spellCheck={false}
            />
            <p className="mt-1 text-xs text-gray-500">
              Use a Messaging Service instead of a single From number if your team routes SMS that
              way.
            </p>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center justify-center rounded-md bg-teal-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-teal-700 disabled:opacity-60"
            >
              {submitting
                ? "Verifying account…"
                : alreadyConnected
                  ? "Save credentials"
                  : "Connect Twilio"}
            </button>
            <Link
              href={
                alreadyConnected
                  ? twilioManagePath(businessId)
                  : integrationConnectorPath("twilio")
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
