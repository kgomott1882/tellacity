"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function InviteTimeRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/business/dashboard/settings/invite-settings");
  }, [router]);
  return null;
}
