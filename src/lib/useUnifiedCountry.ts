"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  COUNTRY_CHANGE_EVENT,
  DEFAULT_COUNTRY,
  getStoredCountry,
  normalizeCountryCode,
  setStoredCountry,
} from "@/lib/country";

type UseUnifiedCountryOptions = {
  initialCountry?: string | null;
  ensureQueryParam?: boolean;
  preferWindowSearchOnRoot?: boolean;
};

export function useUnifiedCountry(
  opts?: UseUnifiedCountryOptions,
): {
  countryCode: string;
  setCountryAndSync: (nextCountry: string) => void;
  searchKey: string;
} {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialFallback = normalizeCountryCode(
    opts?.initialCountry ?? DEFAULT_COUNTRY,
  );
  const preferWindowSearchOnRoot = opts?.preferWindowSearchOnRoot === true;
  const ensureQueryParam = opts?.ensureQueryParam === true;

  const searchKey = useMemo(() => searchParams.toString(), [searchParams]);

  const [countryCode, setCountryCode] = useState<string>(() => {
    // Hydration-safe initial render: avoid URL/window-dependent branching here.
    return initialFallback;
  });
  const pendingCountryRef = useRef<string | null>(null);

  useEffect(() => {
    // On `/`, prefer the real address bar first — Next `useSearchParams()` can lag one
    // frame behind `?country=`, which used to fall through to localStorage (wrong country).
    let queryCountryRaw: string | null = null;
    if (
      preferWindowSearchOnRoot &&
      pathname === "/" &&
      typeof window !== "undefined"
    ) {
      queryCountryRaw = new URLSearchParams(window.location.search).get(
        "country",
      );
    }
    if (queryCountryRaw == null || queryCountryRaw === "") {
      queryCountryRaw = searchParams.get("country");
    }

    if (queryCountryRaw) {
      const normalized = normalizeCountryCode(queryCountryRaw);
      const pending = pendingCountryRef.current;
      // Router query can lag one render behind local state right after selection.
      // Ignore stale URL values until it catches up to the requested country.
      if (pending && normalized !== pending) return;
      if (pending && normalized === pending) pendingCountryRef.current = null;
      if (countryCode !== normalized) setCountryCode(normalized);
      setStoredCountry(normalized);
      return;
    }
    const pending = pendingCountryRef.current;
    if (pending) {
      if (countryCode !== pending) setCountryCode(pending);
      return;
    }
    const stored = getStoredCountry() ?? initialFallback;
    if (countryCode !== stored) setCountryCode(stored);
  }, [
    searchParams,
    pathname,
    preferWindowSearchOnRoot,
    countryCode,
    initialFallback,
  ]);

  useEffect(() => {
    const syncFromStorage = () => {
      let fromUrl: string | null = null;
      if (
        preferWindowSearchOnRoot &&
        pathname === "/" &&
        typeof window !== "undefined"
      ) {
        fromUrl = new URLSearchParams(window.location.search).get("country");
      }
      if (fromUrl == null || fromUrl === "") {
        fromUrl = searchParams.get("country");
      }
      if (fromUrl) return;
      const stored = getStoredCountry() ?? initialFallback;
      if (pendingCountryRef.current && stored !== pendingCountryRef.current) {
        return;
      }
      setCountryCode((prev) => (prev === stored ? prev : stored));
    };
    window.addEventListener(COUNTRY_CHANGE_EVENT, syncFromStorage);
    window.addEventListener("storage", syncFromStorage);
    return () => {
      window.removeEventListener(COUNTRY_CHANGE_EVENT, syncFromStorage);
      window.removeEventListener("storage", syncFromStorage);
    };
  }, [pathname, searchParams, preferWindowSearchOnRoot, initialFallback]);

  const setCountryAndSync = useCallback(
    (nextCountry: string) => {
      const normalized = normalizeCountryCode(nextCountry);
      pendingCountryRef.current = normalized;
      setCountryCode(normalized);
      setStoredCountry(normalized);
      const params = new URLSearchParams(searchKey);
      params.set("country", normalized);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [pathname, router, searchKey],
  );

  useEffect(() => {
    if (!ensureQueryParam) return;
    let urlHasCountry = searchParams.get("country");
    if (
      preferWindowSearchOnRoot &&
      pathname === "/" &&
      typeof window !== "undefined"
    ) {
      urlHasCountry =
        new URLSearchParams(window.location.search).get("country") ??
        urlHasCountry;
    }
    if (urlHasCountry) return;
    const params = new URLSearchParams(searchKey);
    params.set("country", countryCode);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }, [
    ensureQueryParam,
    preferWindowSearchOnRoot,
    pathname,
    searchParams,
    countryCode,
    router,
    searchKey,
  ]);

  return { countryCode, setCountryAndSync, searchKey };
}

