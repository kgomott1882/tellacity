"use client";

import { useEffect, useState } from "react";
import { normalizeLogoUrl, resolveBusinessLogo } from "./logo";

/**
 * Primary: manual logo URL (from businesses.logo_url).
 * Secondary: Edge Function resolve-business-logo when manual is empty.
 */
export function useBusinessLogo(
  manualUrl: string | null | undefined,
  domain: string | null | undefined
): { logoUrl: string | null; isLoading: boolean } {
  const manual = normalizeLogoUrl(manualUrl ?? null);
  const [resolved, setResolved] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (manual) {
      setResolved(null);
      setLoading(false);
      return;
    }
    if (!domain || !domain.trim()) {
      setResolved(null);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    resolveBusinessLogo(domain)
      .then((url) => {
        if (!cancelled) {
          setResolved(url);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [manual, domain]);

  const logoUrl = manual ?? resolved ?? null;
  return { logoUrl, isLoading: !manual && loading };
}
