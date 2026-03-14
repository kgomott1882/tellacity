"use client";

import { useMemo } from "react";
import { useBusinessContext } from "../_context/BusinessContext";
import { cleanDomain } from "./ui";

export default function BusinessSwitcher({ loading }: { loading: boolean }) {
  const { selectedBusiness } = useBusinessContext();

  const label = useMemo(() => {
    if (!selectedBusiness) return { name: "Select business", domain: "" };
    return {
      name: selectedBusiness.name,
      domain: selectedBusiness.website ? cleanDomain(selectedBusiness.website) : "",
    };
  }, [selectedBusiness]);

  // When loading but we already have a selected business (e.g. restored from back/forward), show it so the dashboard doesn't look disconnected
  const showLabel = !loading || selectedBusiness;

  return (
    <div className="px-4 pt-4 pb-4 text-left">
      <div className="text-sm font-semibold leading-tight text-white truncate">
        {showLabel ? label.name : "Loading…"}
      </div>
      <div className="text-xs text-white/70 leading-tight truncate mt-0.5">
        {showLabel ? label.domain : ""}
      </div>
    </div>
  );
}
