export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";

type IndexNowBody = {
  urls?: string[];
};

type PublishResult = {
  url: string;
  ok: boolean;
  status?: number;
  error?: string;
  skipped?: boolean;
};

const RATE_LIMIT_WINDOW_MS = 60_000;
const DEDUPE_WINDOW_MS = 10 * 60_000;
const callerLastRequestAt = new Map<string, number>();
const recentlySubmittedUrls = new Map<string, number>();

function getAuthToken(req: Request): string {
  const header = req.headers.get("authorization") ?? "";
  if (!header.startsWith("Bearer ")) return "";
  return header.slice("Bearer ".length).trim();
}

function getCallerId(req: Request): string {
  const authToken = getAuthToken(req);
  if (authToken) return `auth:${authToken}`;
  const forwardedFor = req.headers.get("x-forwarded-for") ?? "";
  const firstIp = forwardedFor.split(",")[0]?.trim();
  if (firstIp) return `ip:${firstIp}`;
  const realIp = (req.headers.get("x-real-ip") ?? "").trim();
  if (realIp) return `ip:${realIp}`;
  return "anonymous";
}

function normalizeUrl(value: string): string {
  return value.trim();
}

function isValidAbsoluteUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}

function cleanupRateLimitState(now: number): void {
  for (const [key, ts] of callerLastRequestAt.entries()) {
    if (now - ts > RATE_LIMIT_WINDOW_MS * 2) {
      callerLastRequestAt.delete(key);
    }
  }
}

function cleanupDedupeState(now: number): void {
  for (const [url, ts] of recentlySubmittedUrls.entries()) {
    if (now - ts > DEDUPE_WINDOW_MS) {
      recentlySubmittedUrls.delete(url);
    }
  }
}

async function publishToGoogle(
  indexingToken: string,
  url: string,
): Promise<PublishResult> {
  try {
    const res = await fetch(
      "https://indexing.googleapis.com/v3/urlNotifications:publish",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${indexingToken}`,
        },
        body: JSON.stringify({
          url,
          type: "URL_UPDATED",
        }),
        cache: "no-store",
      },
    );

    if (!res.ok) {
      let err = `Google Indexing API error (${res.status})`;
      try {
        const json = (await res.json()) as { error?: { message?: string } };
        if (json?.error?.message) {
          err = json.error.message;
        }
      } catch {
        // Keep fallback message.
      }
      return { url, ok: false, status: res.status, error: err };
    }

    return { url, ok: true, status: res.status };
  } catch (e) {
    return {
      url,
      ok: false,
      error: e instanceof Error ? e.message : "Unknown publish error",
    };
  }
}

export async function POST(req: Request) {
  try {
    const now = Date.now();
    cleanupRateLimitState(now);
    cleanupDedupeState(now);

    const callerId = getCallerId(req);
    const previousRequestAt = callerLastRequestAt.get(callerId);
    if (typeof previousRequestAt === "number" && now - previousRequestAt < RATE_LIMIT_WINDOW_MS) {
      return NextResponse.json(
        {
          error: "Rate limit exceeded. Max 1 request per minute per caller.",
        },
        { status: 429 },
      );
    }
    callerLastRequestAt.set(callerId, now);

    const endpointSecret = process.env.INDEXNOW_SECRET?.trim();
    if (endpointSecret) {
      const callerToken = getAuthToken(req);
      if (!callerToken || callerToken !== endpointSecret) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    const indexingToken = process.env.GOOGLE_INDEXING_API_TOKEN?.trim();
    if (!indexingToken) {
      return NextResponse.json(
        {
          error:
            "Google indexing token is not configured. Set GOOGLE_INDEXING_API_TOKEN.",
        },
        { status: 503 },
      );
    }

    const body = (await req.json()) as IndexNowBody;
    const rawUrls = Array.isArray(body?.urls) ? body.urls : [];
    const urls = Array.from(
      new Set(rawUrls.map((u) => normalizeUrl(String(u ?? ""))).filter(Boolean)),
    );

    if (urls.length === 0) {
      return NextResponse.json(
        { error: "Provide at least one URL in urls[]", results: [] },
        { status: 400 },
      );
    }

    if (urls.length > 100) {
      return NextResponse.json(
        { error: "Too many URLs. Max 100 per request.", results: [] },
        { status: 400 },
      );
    }

    const invalid = urls.filter((url) => !isValidAbsoluteUrl(url));
    if (invalid.length > 0) {
      return NextResponse.json(
        {
          error: "All urls must be absolute http(s) URLs.",
          invalid,
          results: [],
        },
        { status: 400 },
      );
    }

    const skippedUrls = urls.filter((url) => {
      const lastSubmittedAt = recentlySubmittedUrls.get(url);
      return (
        typeof lastSubmittedAt === "number" &&
        now - lastSubmittedAt < DEDUPE_WINDOW_MS
      );
    });
    const urlsToSubmit = urls.filter((url) => !skippedUrls.includes(url));

    const skippedResults: PublishResult[] = skippedUrls.map((url) => ({
      url,
      ok: true,
      skipped: true,
      status: 200,
    }));

    const results = await Promise.all(
      urlsToSubmit.map((url) => publishToGoogle(indexingToken, url)),
    );
    for (const result of results) {
      if (result.ok) {
        recentlySubmittedUrls.set(result.url, now);
      } else {
        console.error("[indexnow] publish failed:", {
          url: result.url,
          status: result.status ?? null,
          error: result.error ?? "Unknown publish error",
        });
      }
    }

    const combinedResults = [...results, ...skippedResults];

    const successCount = combinedResults.filter((r) => r.ok).length;
    const failureCount = combinedResults.length - successCount;
    const statusCode = failureCount === 0 ? 200 : 207;

    return NextResponse.json(
      {
        ok: failureCount === 0,
        submitted: combinedResults.length,
        successCount,
        failureCount,
        results: combinedResults,
      },
      { status: statusCode },
    );
  } catch (e) {
    console.error("[indexnow] POST error:", e);
    return NextResponse.json(
      { error: "Failed to submit URLs for indexing.", results: [] },
      { status: 500 },
    );
  }
}
