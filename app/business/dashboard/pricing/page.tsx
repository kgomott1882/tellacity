"use client";

import { useEffect, useState } from "react";
import { PricingPageContent } from "@/components/pricing/PricingPageContent";
import { useBusinessContext } from "../_context/BusinessContext";
import { dashboardApiGet } from "@/lib/dashboardApiFetch";

/**
 * Do not use `useBusinessAuth()` here: DashboardShell already runs it. A second
 * instance re-runs getSession/ensureSessionFresh from loading=true and can hang,
 * leaving PageLoadingOverlay stuck forever. Session email comes from the server
 * via the same cookie/Bearer pattern as other dashboard APIs.
 */
export default function DashboardPricingPage() {
  const { selectedBusiness } = useBusinessContext();
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    if (!selectedBusiness?.id) {
      setUserEmail("");
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const json = await dashboardApiGet<{ email: string | null }>("/api/dashboard/session");
        if (!cancelled) setUserEmail(json.email ?? "");
      } catch {
        if (!cancelled) setUserEmail("");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedBusiness?.id]);

  if (!selectedBusiness?.id) return null;

  return (
    <PricingPageContent
      variant="dashboard"
      dashboardBusinessId={selectedBusiness.id}
      dashboardUserEmail={userEmail}
    />
  );
}
