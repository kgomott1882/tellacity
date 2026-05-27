"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import {
  COOKIE_CONSENT_UPDATED_EVENT,
  getCookieConsent,
} from "@/lib/cookieConsent";

/**
 * Mount point for marketing/ad scripts. Only renders children when the user
 * opted into marketing cookies. Add third-party tags as children when needed.
 */
export default function MarketingGate({
  children,
}: {
  children?: React.ReactNode;
}) {
  const pathname = usePathname();
  const isWidgetRoute = pathname?.startsWith("/widgets");
  const [allowMarketing, setAllowMarketing] = useState(false);

  useEffect(() => {
    const refresh = () => {
      const consent = getCookieConsent();
      setAllowMarketing(consent?.marketing === true);
    };

    refresh();
    window.addEventListener(COOKIE_CONSENT_UPDATED_EVENT, refresh);
    return () =>
      window.removeEventListener(COOKIE_CONSENT_UPDATED_EVENT, refresh);
  }, []);

  if (isWidgetRoute || !allowMarketing || !children) return null;

  return <>{children}</>;
}
