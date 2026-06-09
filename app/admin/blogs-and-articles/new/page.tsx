"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import TellacityLoader from "@/components/common/TellacityLoader";
import { createPlatformArticleDraft } from "@/lib/admin/createPlatformArticleDraft";

export default function AdminNewPlatformArticlePage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void createPlatformArticleDraft()
      .then((id) => {
        router.replace(
          `/admin/blogs-and-articles/${encodeURIComponent(id)}/edit?guide=1`,
        );
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : "Could not create article");
      });
  }, [router]);

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
        {error}
      </div>
    );
  }

  return <TellacityLoader />;
}
