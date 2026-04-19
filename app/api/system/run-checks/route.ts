export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import {
  runSystemMonitoringChecks,
  type SystemMonitoringApiResult,
} from "@/lib/systemHealthMonitoring";

function authorize(req: Request): boolean {
  const secret = process.env.SYSTEM_CHECKS_SECRET?.trim();
  if (!secret) return false;
  const authHeader = req.headers.get("authorization") ?? "";
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length).trim()
    : "";
  return token === secret;
}

function errMessage(e: unknown): string {
  if (e instanceof Error) return e.message || String(e);
  return typeof e === "string" ? e : "Unknown error";
}

export async function POST(req: Request) {
  if (process.env.NODE_ENV === "development") {
    console.log("[run-checks] origin hint:", {
      NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
      VERCEL_URL: process.env.VERCEL_URL,
    });
  }

  const secretConfigured = Boolean(process.env.SYSTEM_CHECKS_SECRET?.trim());
  if (!secretConfigured) {
    return NextResponse.json(
      {
        success: false,
        error: "SYSTEM_CHECKS_SECRET is not configured",
        results: [] as SystemMonitoringApiResult[],
      },
      { status: 503 },
    );
  }

  if (!authorize(req)) {
    return NextResponse.json(
      { success: false, error: "Unauthorized", results: [] as SystemMonitoringApiResult[] },
      { status: 401 },
    );
  }

  try {
    const { results } = await runSystemMonitoringChecks();
    return NextResponse.json({
      success: true,
      results,
    });
  } catch (e: unknown) {
    console.error("run-checks:", e);
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
