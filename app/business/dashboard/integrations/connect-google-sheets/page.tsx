"use client";

import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useBusinessContext } from "../../_context/BusinessContext";
import { dashboardApiGet, dashboardApiPost } from "@/lib/dashboardApiFetch";
import {
  integrationConnectorPath,
  googleSheetsManagePath,
} from "@/lib/integrationConnectPaths";

export default function ConnectGoogleSheetsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const paramBusinessId = searchParams.get("business_id") ?? "";
  const { selectedBusiness } = useBusinessContext();
  const businessId = paramBusinessId || selectedBusiness?.id || "";

  const [spreadsheetInput, setSpreadsheetInput] = useState("");
  const [worksheetName, setWorksheetName] = useState("");
  const [serviceAccountJson, setServiceAccountJson] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [alreadyConnected, setAlreadyConnected] = useState(false);
  const [existingTitle, setExistingTitle] = useState<string | null>(null);

  const loadExisting = useCallback(async () => {
    if (!businessId.trim()) return;
    try {
      const json = await dashboardApiGet<{
        connected: boolean;
        spreadsheet_id?: string;
        spreadsheet_title?: string | null;
        worksheet_name?: string | null;
      }>(
        `/api/integrations/google-sheets/status?business_id=${encodeURIComponent(businessId)}`,
      );
      if (json.connected) {
        setAlreadyConnected(true);
        if (json.spreadsheet_id) {
          setSpreadsheetInput(
            `https://docs.google.com/spreadsheets/d/${json.spreadsheet_id}/edit`,
          );
        }
        if (json.worksheet_name) setWorksheetName(json.worksheet_name);
        setExistingTitle(json.spreadsheet_title ?? null);
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
    const sheet = spreadsheetInput.trim();
    const saJson = serviceAccountJson.trim();
    if (!sheet || !saJson) {
      setError("Fill in spreadsheet URL and service account JSON.");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      const json = await dashboardApiPost<{
        ok: boolean;
        spreadsheet_title?: string | null;
      }>("/api/integrations/google-sheets/connect", {
        business_id: businessId.trim(),
        spreadsheet_url: sheet,
        service_account_json: saJson,
        worksheet_name: worksheetName.trim() || undefined,
      });
      if (json.spreadsheet_title) setExistingTitle(json.spreadsheet_title);
      router.push("/business/dashboard/integrations?connected=google-sheets");
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
          {alreadyConnected ? "Update Google Sheets connection" : "Connect Google Sheets"}
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          Tellacity verifies access to your spreadsheet with a Google service account, stores
          credentials server-side, and acts as the bridge when you are ready to export reviews and
          feedback.
        </p>

        <ol className="mt-5 list-decimal space-y-2 pl-5 text-sm text-gray-700">
          <li>
            In{" "}
            <a
              href="https://console.cloud.google.com/apis/library/sheets.googleapis.com"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-[#1FAF9E] hover:underline"
            >
              Google Cloud
            </a>
            , enable the Google Sheets API and create a service account key (JSON).
          </li>
          <li>
            Share your target spreadsheet with the service account email as{" "}
            <span className="font-medium">Editor</span>.
          </li>
          <li>Paste the spreadsheet link and the full JSON key below.</li>
          <li>
            Optionally name a worksheet tab (e.g. <span className="font-medium">Reviews</span>) for
            exports.
          </li>
        </ol>

        {alreadyConnected ? (
          <p className="mt-4 rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
            {existingTitle ? (
              <>
                Connected to <span className="font-semibold">{existingTitle}</span>. Submit new
                details to replace the saved connection, or{" "}
              </>
            ) : (
              <>
                This business already has Google Sheets linked. Submit new details to replace it,
                or{" "}
              </>
            )}
            <Link
              href={googleSheetsManagePath(businessId)}
              className="font-semibold underline underline-offset-2"
            >
              manage the current connection
            </Link>
            .
          </p>
        ) : null}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="spreadsheet_url" className="block text-sm font-medium text-gray-700">
              Spreadsheet URL
            </label>
            <input
              id="spreadsheet_url"
              type="url"
              value={spreadsheetInput}
              onChange={(e) => setSpreadsheetInput(e.target.value)}
              placeholder="https://docs.google.com/spreadsheets/d/…/edit"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-[#1FAF9E] focus:outline-none focus:ring-1 focus:ring-[#1FAF9E]"
              autoComplete="off"
              spellCheck={false}
            />
          </div>
          <div>
            <label htmlFor="worksheet_name" className="block text-sm font-medium text-gray-700">
              Worksheet tab <span className="font-normal text-gray-500">(optional)</span>
            </label>
            <input
              id="worksheet_name"
              type="text"
              value={worksheetName}
              onChange={(e) => setWorksheetName(e.target.value)}
              placeholder="Reviews"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-[#1FAF9E] focus:outline-none focus:ring-1 focus:ring-[#1FAF9E]"
              autoComplete="off"
            />
          </div>
          <div>
            <label
              htmlFor="service_account_json"
              className="block text-sm font-medium text-gray-700"
            >
              Service account JSON key
            </label>
            <textarea
              id="service_account_json"
              value={serviceAccountJson}
              onChange={(e) => setServiceAccountJson(e.target.value)}
              placeholder='{ "type": "service_account", "client_email": "…", "private_key": "…" }'
              rows={6}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 font-mono text-xs shadow-sm focus:border-[#1FAF9E] focus:outline-none focus:ring-1 focus:ring-[#1FAF9E]"
              spellCheck={false}
            />
            <p className="mt-1 text-xs text-gray-500">
              Paste the full JSON file. It is only stored on Tellacity servers.
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
                ? "Verifying access…"
                : alreadyConnected
                  ? "Save connection"
                  : "Connect Google Sheets"}
            </button>
            <Link
              href={
                alreadyConnected
                  ? googleSheetsManagePath(businessId)
                  : integrationConnectorPath("google-sheets")
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
