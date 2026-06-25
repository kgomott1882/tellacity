"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Legacy route — send invite lives on the overview page. */
export default function InvitationMethodsRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/business/dashboard/get-reviews/overview#send-invite");
  }, [router]);

  return (
    <div className="flex min-h-[40vh] items-center justify-center text-sm text-gray-500">
      Redirecting…
    </div>
  );
}
