export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { requireAdminSession } from "@/components/admin/RequireAdmin";
import {
  runSystemMonitoringChecks,
  type SystemMonitoringApiResult,
} from "@/lib/systemHealthMonitoring";

function errMessage(e: unknown): string {
  if (e instanceof Error) return e.message || String(e);
  return typeof e === "string" ? e : "Unknown error";
}

export async function POST() {
  try {
    await requireAdminSession();
    const { results } = await runSystemMonitoringChecks();
    return NextResponse.json({ success: true, results });
  } catch (e: unknown) {
    console.error("[admin/system-checks/run]", e);
    return NextResponse.json(
      {
        success: false,
        error: errMessage(e),
        results: [] as SystemMonitoringApiResult[],
      },
      { status: 500 },
    );
  }
}
