"use client";

import { useMemo } from "react";
import { useBusinessContext } from "../_context/BusinessContext";
import { cleanDomain } from "./ui";

export default function BusinessSwitcher() {
  const { selectedBusiness } = useBusinessContext();

  const label = useMemo(() => {
    if (!selectedBusiness) return { name: "Select business", domain: "" };
    return {
      name: selectedBusiness.name,
      domain: selectedBusiness.website ? cleanDomain(selectedBusiness.website) : "",
    };
  }, [selectedBusiness]);

  return (
    <div className="px-4 pt-4 pb-4 text-left">
      <div className="text-sm font-semibold leading-tight text-white truncate">
        {label.name}
      </div>
      <div className="text-xs text-white/70 leading-tight truncate mt-0.5">
        {label.domain}
      </div>
    </div>
  );
}
