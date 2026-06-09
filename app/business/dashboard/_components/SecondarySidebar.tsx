"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { ChevronRight } from "lucide-react";

function isSubNavItemActive(
  pathname: string,
  searchParams: URLSearchParams,
  itemPath: string,
): boolean {
  const [basePath, queryString] = itemPath.split("?");
  if (pathname !== basePath) return false;
  if (!queryString) return !searchParams.get("type");
  const expectedType = new URLSearchParams(queryString).get("type");
  return searchParams.get("type") === expectedType;
}

type SubItem = {
  label: string;
  path: string;
};

type ExpandableGroup = {
  title: string;
  items: SubItem[];
};

type SecondarySidebarProps = {
  title: string;
  items?: SubItem[];
  groups?: ExpandableGroup[];
};

export default function SecondarySidebar({ title, items, groups }: SecondarySidebarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return (
    <aside className="w-64 h-full min-h-full bg-gray-950 text-white flex flex-col">
      <div className="px-6 py-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide">{title}</h2>
      </div>

      <nav className="flex-1 px-6 py-4 text-sm overflow-y-auto">
        {items && items.length > 0 && (
          <div className="space-y-1 mb-4">
            {items.map((item) => {
              const isActive = isSubNavItemActive(pathname, searchParams, item.path);
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`flex items-center justify-between px-3 py-2 rounded-md transition ${
                    isActive
                      ? "bg-white/20 text-white font-medium"
                      : "text-white/90 hover:bg-white/10"
                  }`}
                >
                  <span>{item.label}</span>
                  {!isActive && <ChevronRight size={16} className="text-white/60" />}
                </Link>
              );
            })}
          </div>
        )}

        {groups && groups.length > 0 && (
          <div className="space-y-6">
            {groups.map((group) => {
              return (
                <div key={group.title}>
                  <p className="px-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/50">
                    {group.title}
                  </p>
                  <div className="mt-2 space-y-1">
                    {group.items.map((item) => {
                      const isActive = isSubNavItemActive(pathname, searchParams, item.path);
                      return (
                        <Link
                          key={item.path}
                          href={item.path}
                          className={`flex items-center justify-between px-3 py-2 rounded-md transition ${
                            isActive
                              ? "bg-white/20 text-white font-medium"
                              : "text-white/80 hover:bg-white/10"
                          }`}
                        >
                          <span>{item.label}</span>
                          {!isActive && <ChevronRight size={16} className="text-white/60" />}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </nav>
    </aside>
  );
}
