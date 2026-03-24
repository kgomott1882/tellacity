"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function DetailsRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/business/dashboard/settings/account");
  }, [router]);
  return null;
}
