/** Browser localStorage key for last admin “Run all checks” snapshot (full results). */
export const SYSTEM_CHECKS_LAST_RUN_STORAGE_KEY = "tellacity_system_checks_last_run";

export type SystemChecksLastRunStored = {
  at: string;
  total: number;
  ok: number;
  fail: number;
  results: Array<{
    check_name: string;
    check_group: string;
    status: string;
    response_time_ms: number;
    message: string;
  }>;
};

export function readSystemChecksLastRun(): SystemChecksLastRunStored | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(SYSTEM_CHECKS_LAST_RUN_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SystemChecksLastRunStored;
    if (!parsed || typeof parsed.at !== "string" || !Array.isArray(parsed.results)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeSystemChecksLastRun(payload: SystemChecksLastRunStored): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(SYSTEM_CHECKS_LAST_RUN_STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // Quota or private mode — ignore
  }
}
