"use client";

import { supabaseBrowser } from "@/lib/supabaseBrowser";

const FETCH_TIMEOUT_MS = 45_000;
const SESSION_TIMEOUT_MS = 6_000;

function abortableFetch(
  input: RequestInfo | URL,
  init: RequestInit,
  timeoutMs: number
): { promise: Promise<Response>; clearTimer: () => void } {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const clearTimer = () => clearTimeout(timer);
  const promise = fetch(input, { ...init, signal: controller.signal });
  return { promise, clearTimer };
}

async function getSessionWithTimeout() {
  return Promise.race([
    supabaseBrowser().auth.getSession(),
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("session_timeout")), SESSION_TIMEOUT_MS)
    ),
  ]);
}

const baseInit: RequestInit = { credentials: "include", cache: "no-store" };

/**
 * Cookie-first GET for dashboard API routes; Bearer retry after 401 (same pattern as Performance).
 */
export async function dashboardApiGet<T>(path: string): Promise<T> {
  const first = abortableFetch(path, { ...baseInit, method: "GET", headers: {} }, FETCH_TIMEOUT_MS);
  let res = await first.promise;
  first.clearTimer();

  if (res.status === 401) {
    try {
      const { data: sessionData } = await getSessionWithTimeout();
      const token = sessionData?.session?.access_token;
      if (token) {
        const second = abortableFetch(
          path,
          {
            ...baseInit,
            method: "GET",
            headers: { Authorization: `Bearer ${token}` },
          },
          FETCH_TIMEOUT_MS
        );
        res = await second.promise;
        second.clearTimer();
      }
    } catch {
      /* keep 401 */
    }
  }

  let json: T & { error?: string };
  try {
    json = (await res.json()) as typeof json;
  } catch {
    throw new Error("Invalid response from server");
  }

  if (!res.ok) {
    throw new Error(json.error || "Request failed");
  }

  return json as T;
}

/** Optional Bearer for POST/PATCH/DELETE when cookies are not synced yet. */
export async function getOptionalAccessToken(): Promise<string | undefined> {
  try {
    const { data } = await getSessionWithTimeout();
    return data?.session?.access_token ?? undefined;
  } catch {
    return undefined;
  }
}

/**
 * Cookie-first POST with JSON body; Bearer retry after 401 (same as GET).
 */
export async function dashboardApiPost<T>(path: string, body?: unknown): Promise<T> {
  const first = abortableFetch(
    path,
    {
      ...baseInit,
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    },
    FETCH_TIMEOUT_MS
  );
  let res = await first.promise;
  first.clearTimer();

  if (res.status === 401) {
    try {
      const { data: sessionData } = await getSessionWithTimeout();
      const token = sessionData?.session?.access_token;
      if (token) {
        const second = abortableFetch(
          path,
          {
            ...baseInit,
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: body !== undefined ? JSON.stringify(body) : undefined,
          },
          FETCH_TIMEOUT_MS
        );
        res = await second.promise;
        second.clearTimer();
      }
    } catch {
      /* keep 401 */
    }
  }

  let json: T & { error?: string };
  try {
    json = (await res.json()) as typeof json;
  } catch {
    throw new Error("Invalid response from server");
  }

  if (!res.ok) {
    throw new Error(json.error || "Request failed");
  }

  return json as T;
}

async function dashboardApiMutate<T>(
  method: "PATCH" | "DELETE",
  path: string,
  body?: unknown,
): Promise<T> {
  const first = abortableFetch(
    path,
    {
      ...baseInit,
      method,
      headers: { "Content-Type": "application/json" },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    },
    FETCH_TIMEOUT_MS,
  );
  let res = await first.promise;
  first.clearTimer();

  if (res.status === 401) {
    try {
      const { data: sessionData } = await getSessionWithTimeout();
      const token = sessionData?.session?.access_token;
      if (token) {
        const second = abortableFetch(
          path,
          {
            ...baseInit,
            method,
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: body !== undefined ? JSON.stringify(body) : undefined,
          },
          FETCH_TIMEOUT_MS,
        );
        res = await second.promise;
        second.clearTimer();
      }
    } catch {
      /* keep 401 */
    }
  }

  let json: T & { error?: string };
  try {
    json = (await res.json()) as typeof json;
  } catch {
    throw new Error("Invalid response from server");
  }

  if (!res.ok) {
    throw new Error(json.error || "Request failed");
  }

  return json as T;
}

export async function dashboardApiPatch<T>(path: string, body?: unknown): Promise<T> {
  return dashboardApiMutate<T>("PATCH", path, body);
}

export async function dashboardApiDelete<T>(path: string): Promise<T> {
  return dashboardApiMutate<T>("DELETE", path);
}
