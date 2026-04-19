"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function RunSystemChecksButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function run() {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/system-checks/run", {
        method: "POST",
        credentials: "include",
      });
      const data = (await res.json().catch(() => null)) as {
        success?: boolean;
        error?: string;
        results?: { status: string }[];
      } | null;
      if (!res.ok || !data?.success) {
        setMsg(data?.error ?? `Request failed (${res.status})`);
        return;
      }
      const ok = (data.results ?? []).filter((r) => String(r.status).toLowerCase() === "ok").length;
      const total = (data.results ?? []).length;
      setMsg(`Recorded ${total} checks (${ok} ok, ${total - ok} fail). Refreshing…`);
      router.refresh();
    } catch (e: unknown) {
      setMsg(e instanceof Error ? e.message : "Network error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
      <button
        type="button"
        onClick={() => void run()}
        disabled={busy}
        className="inline-flex items-center justify-center rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {busy ? "Running checks…" : "Run all checks now"}
      </button>
      {msg ? <p className="text-sm text-neutral-600">{msg}</p> : null}
    </div>
  );
}
