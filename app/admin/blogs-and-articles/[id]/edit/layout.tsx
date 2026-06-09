import type { ReactNode } from "react";

/** Full-bleed editor shell below the admin header (negates main padding). */
export default function PlatformArticleEditLayout({ children }: { children: ReactNode }) {
  return (
    <div className="-mx-4 -mt-2 flex h-[calc(100dvh-3.5rem-1.5rem)] min-h-0 flex-col overflow-hidden sm:-mx-6 sm:-mt-4 sm:h-[calc(100dvh-3.5rem-2rem)]">
      {children}
    </div>
  );
}
