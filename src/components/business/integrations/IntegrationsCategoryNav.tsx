"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { INTEGRATION_CATEGORIES } from "@/lib/integrationsCatalog";

export default function IntegrationsCategoryNav() {
  const pathname = usePathname();

  const isAll = pathname === "/business/dashboard/integrations";

  const isActiveCategory = (id: string) =>
    pathname === `/business/dashboard/integrations/${id}`;

  return (
    <nav className="w-64 shrink-0 border-r border-gray-200 bg-white">
      <div className="px-4 py-4">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
          Integration categories
        </h2>
      </div>
      <div className="px-2 pb-4 space-y-1 text-sm">
        <Link
          href="/business/dashboard/integrations"
          className={`flex items-center justify-between rounded-md px-3 py-2 transition ${
            isAll
              ? "bg-[#0E0E0E] text-white"
              : "text-gray-700 hover:bg-gray-50"
          }`}
        >
          <span>All Integrations</span>
        </Link>
        {INTEGRATION_CATEGORIES.map((category) => {
          const active = isActiveCategory(category.id);
          return (
            <Link
              key={category.id}
              href={`/business/dashboard/integrations/${category.id}`}
              className={`flex items-center justify-between rounded-md px-3 py-2 transition ${
                active
                  ? "bg-[#0E0E0E] text-white"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              <span>{category.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

