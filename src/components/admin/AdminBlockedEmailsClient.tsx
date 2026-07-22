"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type BlockedRow = {
  email: string;
  reason: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  reviews_deleted_count?: number | null;
  last_purged_at?: string | null;
};

type Props = {
  initialRows: BlockedRow[];
};

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso);
  // Fixed locale — avoid SSR/client hydration mismatch from toLocaleString().
  return d.toLocaleString("en-US", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
}

export default function AdminBlockedEmailsClient({ initialRows }: Props) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(
    null,
  );
  const [rows, setRows] = useState(initialRows);

  const refreshList = async () => {
    const res = await fetch("/api/admin/blocked-emails", {
      credentials: "include",
      cache: "no-store",
    });
    const data = (await res.json().catch(() => ({}))) as {
      rows?: BlockedRow[];
      error?: string;
    };
    if (res.ok && Array.isArray(data.rows)) setRows(data.rows);
  };

  const handleBlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/blocked-emails", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          reason: reason.trim() || null,
          notes: notes.trim() || null,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        email?: string;
        deletedReviews?: number;
        deletedDrafts?: number;
        deletedOtps?: number;
      };
      if (!res.ok) {
        setMessage({ type: "error", text: data.error ?? "Could not block." });
        return;
      }
      const deleted = data.deletedReviews ?? 0;
      setMessage({
        type: deleted > 0 ? "success" : "error",
        text:
          deleted > 0
            ? `Blocked ${data.email}. Deleted ${deleted} review(s) matched by email (stored fields or mentioned in title/body), ${data.deletedDrafts ?? 0} draft(s), ${data.deletedOtps ?? 0} OTP(s).`
            : `Blocked ${data.email}, but deleted 0 reviews. Use the email on the review (guest_email) or the address pasted in the review body — e.g. brucenora254@gmail.com for the current spam.`,
      });
      setEmail("");
      setReason("");
      setNotes("");
      await refreshList();
      router.refresh();
    } catch {
      setMessage({ type: "error", text: "Network error. Please try again." });
    } finally {
      setBusy(false);
    }
  };

  const handlePurgeEmail = async (targetEmail: string) => {
    const ok = window.confirm(
      `Delete all published reviews for ${targetEmail} now?\n\nMatches guest_email / author_email / email columns, and title/body text that mentions this address.`,
    );
    if (!ok) return;
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/blocked-emails", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: targetEmail, purgeOnly: true }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        deletedReviews?: number;
        deletedDrafts?: number;
        deletedOtps?: number;
      };
      if (!res.ok) {
        setMessage({ type: "error", text: data.error ?? "Could not delete reviews." });
        return;
      }
      const deleted = data.deletedReviews ?? 0;
      setMessage({
        type: deleted > 0 ? "success" : "error",
        text:
          deleted > 0
            ? `Deleted ${deleted} review(s), ${data.deletedDrafts ?? 0} draft(s), ${data.deletedOtps ?? 0} OTP(s) for ${targetEmail}. Hard-refresh the homepage.`
            : `No reviews matched ${targetEmail}. Block the email stored on the review or mentioned in the body (unique), not a display name.`,
      });
      await refreshList();
      router.refresh();
    } catch {
      setMessage({ type: "error", text: "Network error. Please try again." });
    } finally {
      setBusy(false);
    }
  };

  const handleUnblockEmail = async (targetEmail: string) => {
    const ok = window.confirm(`Unblock ${targetEmail}?`);
    if (!ok) return;
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch(
        `/api/admin/blocked-emails?email=${encodeURIComponent(targetEmail)}`,
        { method: "DELETE", credentials: "include" },
      );
      const data = (await res.json().catch(() => ({}))) as { error?: string; email?: string };
      if (!res.ok) {
        setMessage({ type: "error", text: data.error ?? "Could not unblock email." });
        return;
      }
      setMessage({ type: "success", text: `Unblocked ${data.email ?? targetEmail}.` });
      await refreshList();
      router.refresh();
    } catch {
      setMessage({ type: "error", text: "Network error. Please try again." });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      {message ? (
        <div
          className={`rounded-lg border px-4 py-3 text-sm ${
            message.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-900"
              : "border-red-200 bg-red-50 text-red-800"
          }`}
        >
          {message.text}
        </div>
      ) : null}

      <form
        onSubmit={(e) => void handleBlock(e)}
        className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm"
      >
        <h2 className="text-sm font-semibold text-neutral-900">Block email</h2>
        <p className="mt-1 text-xs text-neutral-600">
          Blocking is <strong>email-only</strong> (unique). Deletes matching published reviews
          immediately — by stored email fields or when the address appears in the review title/body.
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className="mb-1 block text-xs font-medium text-neutral-700">Email *</span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="brucenora254@gmail.com"
              className="w-full rounded-md border border-neutral-200 px-3 py-2 text-sm"
              disabled={busy}
            />
            <span className="mt-1 block text-xs text-neutral-500">
              Also deletes reviews whose title/body mention this email (even if guest_email is empty).
            </span>
          </label>
          <label className="block sm:col-span-2">
            <span className="mb-1 block text-xs font-medium text-neutral-700">Reason</span>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Spam / scam withdrawal promotion"
              className="w-full rounded-md border border-neutral-200 px-3 py-2 text-sm"
              disabled={busy}
            />
          </label>
          <label className="block sm:col-span-2">
            <span className="mb-1 block text-xs font-medium text-neutral-700">Notes (internal)</span>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Optional admin notes"
              className="w-full rounded-md border border-neutral-200 px-3 py-2 text-sm"
              disabled={busy}
            />
          </label>
        </div>
        <button
          type="submit"
          disabled={busy}
          className="mt-4 rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
        >
          {busy ? "Blocking…" : "Block & delete content"}
        </button>
      </form>

      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm">
        <div className="border-b border-neutral-100 px-4 py-3">
          <h2 className="text-sm font-semibold text-neutral-900">
            Blocked emails ({rows.length})
          </h2>
        </div>
        {rows.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-neutral-500">No blocked emails yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500">
                <tr>
                  <th className="px-4 py-2 font-semibold">Email</th>
                  <th className="px-4 py-2 font-semibold">Reason</th>
                  <th className="px-4 py-2 font-semibold">Reviews deleted</th>
                  <th className="px-4 py-2 font-semibold">Blocked at</th>
                  <th className="px-4 py-2 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.email} className="border-t border-neutral-100">
                    <td className="px-4 py-3 font-medium text-neutral-900">{row.email}</td>
                    <td className="px-4 py-3 text-neutral-600">
                      {row.reason?.trim() || "—"}
                      {row.notes?.trim() ? (
                        <span className="mt-0.5 block text-xs text-neutral-400">{row.notes}</span>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 tabular-nums text-neutral-800">
                      <span className="font-semibold">
                        {Number(row.reviews_deleted_count ?? 0)}
                      </span>
                      {row.last_purged_at ? (
                        <span className="mt-0.5 block text-xs font-normal text-neutral-400">
                          Last purge {formatDate(row.last_purged_at)}
                        </span>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-neutral-600">{formatDate(row.created_at)}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => void handlePurgeEmail(row.email)}
                          className="rounded-md border border-red-200 bg-red-50 px-2 py-1 text-xs font-medium text-red-800 hover:bg-red-100 disabled:opacity-50"
                        >
                          Delete reviews now
                        </button>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => void handleUnblockEmail(row.email)}
                          className="rounded-md border border-neutral-200 bg-white px-2 py-1 text-xs font-medium text-neutral-800 hover:bg-neutral-50 disabled:opacity-50"
                        >
                          Unblock
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
