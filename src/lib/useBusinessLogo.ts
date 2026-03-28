"use client";

import { useEffect, useState } from "react";
import { normalizeLogoUrl } from "./logo";

/**
 * Use manual logo URL only (from businesses.logo_url).
 */
export function useBusinessLogo(
  manualUrl: string | null | undefined,
  _domain: string | null | undefined
): { logoUrl: string | null; isLoading: boolean } {
  const manual = normalizeLogoUrl(manualUrl ?? null);
  const [resolved] = useState<string | null>(null);
  const [loading] = useState(false);

  useEffect(() => {
  }, [manual]);

  const logoUrl = manual ?? resolved ?? null;
  return { logoUrl, isLoading: !manual && loading };
}
