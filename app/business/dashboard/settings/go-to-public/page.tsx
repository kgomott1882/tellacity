"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useBusinessContext } from "../../_context/BusinessContext";

export default function GoToPublicPage() {
  const router = useRouter();
  const { selectedBusiness } = useBusinessContext();
  if (!selectedBusiness?.id) return null;

  useEffect(() => {
    if (selectedBusiness?.slug) {
      window.open(`/b/${selectedBusiness.slug}`, "_blank", "noopener,noreferrer");
      router.replace("/business/dashboard/settings/public/profile");
    } else {
      router.replace("/business/dashboard/settings/public/profile");
    }
  }, [router, selectedBusiness?.slug]);

  return null;
}
