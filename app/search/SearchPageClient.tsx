"use client";

import { Suspense } from "react";
import SearchPageInner from "./SearchPageInner";

export default function SearchPageClient() {
  return (
    <Suspense fallback={null}>
      <SearchPageInner />
    </Suspense>
  );
}
