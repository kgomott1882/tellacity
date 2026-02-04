"use client";

import { Suspense } from "react";
import SearchPageInner from "./SearchPageInner";

export const dynamic = "force-dynamic";

export default function SearchPage() {
  return (
    <Suspense fallback={null}>
      <SearchPageInner />
    </Suspense>
  );
}

