"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { SystemMonitoringApiResult } from "@/lib/systemHealthMonitoring";
import {
  readSystemChecksLastRun,
  writeSystemChecksLastRun,
  type SystemChecksLastRunStored,
} from "@/lib/systemChecksLastRunStorage";

function formatDeviceRunAt(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString();
}

export default function RunSystemChecksButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [msgHasFailures, setMsgHasFailures] = useState(false);
  const [lastDeviceRun, setLastDeviceRun] = useState<SystemChecksLastRunStored | null>(null);

  useEffect(() => {
    setLastDeviceRun(readSystemChecksLastRun());
  }, []);

  async function run() {
    setBusy(true);
    setMsg(null);
    setMsgHasFailures(false);
    try {
      const res = await fetch("/api/admin/system-checks/run", {
        method: "POST",
        credentials: "include",
      });
      const data = (await res.json().catch(() => null)) as {
        success?: boolean;
        error?: string;
        results?: SystemMonitoringApiResult[];
      } | null;
      if (!res.ok || !data?.success) {
        setMsg(data?.error ?? `Request failed (${res.status})`);
        return;
      }
      const list = data.results ?? [];
      const ok = list.filter((r) => String(r.status).toLowerCase() === "ok").length;
      const total = list.length;
      const fail = total - ok;
      const failures = list.filter((r) => String(r.status).toLowerCase() === "fail");

      const stored: SystemChecksLastRunStored = {
        at: new Date().toISOString(),
        total,
        ok,
        fail,
        results: list.map((r) => ({
          check_name: r.check_name,
          check_group: r.check_group,
          status: r.status,
          response_time_ms: r.response_time_ms,
          message: r.message,
        })),
      };
      writeSystemChecksLastRun(stored);
      setLastDeviceRun(stored);

      let text = `Recorded ${total} checks (${ok} ok, ${fail} fail).`;
      if (fail > 0) {
        const names = failures.map((f) => `${f.check_group}/${f.check_name}`);
        const shown = names.slice(0, 6);
        const more = names.length > shown.length ? ` (+${names.length - shown.length} more)` : "";
        text += ` Failing: ${shown.join("; ")}${more}. See the Message column. Refreshing…`;
        setMsgHasFailures(true);
      } else {
        text += " Refreshing…";
        setMsgHasFailures(false);
      }
      setMsg(text);
      router.refresh();
    } catch (e: unknown) {
      setMsg(e instanceof Error ? e.message : "Network error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-start sm:gap-4">
      <button
        type="button"
        onClick={() => void run()}
        disabled={busy}
        className="inline-flex shrink-0 items-center justify-center rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {busy ? "Running checks…" : "Run all checks now"}
      </button>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        {msg ? (
          <p
            className={
              msgHasFailures
                ? "text-sm font-medium text-red-800"
                : "text-sm text-neutral-600"
            }
            role={msgHasFailures ? "alert" : undefined}
          >
            {msg}
          </p>
        ) : null}
        {lastDeviceRun ? (
          <p className="text-xs text-neutral-500">
            Last saved run (this browser): {formatDeviceRunAt(lastDeviceRun.at)} — {lastDeviceRun.ok}{" "}
            ok, {lastDeviceRun.fail} fail
            {lastDeviceRun.fail > 0 ? (
              <span className="text-red-700">
                {" "}
                — review failing checks above after refresh.
              </span>
            ) : null}
          </p>
        ) : null}
      </div>
    </div>
  );
}
