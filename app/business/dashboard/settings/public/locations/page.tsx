"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LocationsRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/business/dashboard/settings/business-profile");
  }, [router]);
  return null;
}
