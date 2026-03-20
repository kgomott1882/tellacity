"use client";

import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { setStoredCountry } from "@/lib/countryStore";

export default function CountrySync() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const country = searchParams.get("country");
    if (country) {
      setStoredCountry(country);
    }
  }, [searchParams]);

  return null;
}
