"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function InviteEmailRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/business/dashboard/settings/invite-settings");
  }, [router]);
  return null;
}
