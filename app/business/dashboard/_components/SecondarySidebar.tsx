"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronUp, ChevronDown, ChevronRight } from "lucide-react";
import { useState, useEffect } from "react";

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
  const [openGroups, setOpenGroups] = useState<string[]>([]);

  // Auto-open groups that contain the current path
  useEffect(() => {
    if (groups) {
      const activeGroups = groups
        .filter((group) => group.items.some((item) => pathname === item.path))
        .map((group) => group.title);
      if (activeGroups.length > 0) {
        setOpenGroups(activeGroups);
      }
    }
  }, [pathname, groups]);

  const toggleGroup = (title: string) => {
    setOpenGroups((prev) =>
      prev.includes(title) ? prev.filter((g) => g !== title) : [...prev, title]
    );
  };

  return (
    <aside className="w-64 h-full min-h-full bg-gray-950 text-white flex flex-col">
      <div className="px-6 py-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide">{title}</h2>
      </div>

      <nav className="flex-1 px-6 py-4 text-sm overflow-y-auto">
        {items && items.length > 0 && (
          <div className="space-y-1 mb-4">
            {items.map((item) => {
              const isActive = pathname === item.path;
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
          <div className="space-y-1">
            {groups.map((group) => {
              const isOpen = openGroups.includes(group.title);
              const hasActiveItem = group.items.some((item) => pathname === item.path);

              return (
                <div key={group.title}>
                  <button
                    onClick={() => toggleGroup(group.title)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-md transition text-left ${
                      hasActiveItem
                        ? "bg-white/20 text-white font-medium"
                        : "text-white/90 hover:bg-white/10"
                    }`}
                  >
                    <span>{group.title}</span>
                    {isOpen ? (
                      <ChevronUp size={16} className="text-white/60" />
                    ) : (
                      <ChevronDown size={16} className="text-white/60" />
                    )}
                  </button>

                  {isOpen && (
                    <div className="ml-4 mt-1 space-y-1 border-l border-white/20 pl-3">
                      {group.items.map((item) => {
                        const isActive = pathname === item.path;
                        return (
                          <Link
                            key={item.path}
                            href={item.path}
                            className={`block px-3 py-2 rounded-md transition ${
                              isActive
                                ? "bg-white/20 text-white font-medium"
                                : "text-white/80 hover:bg-white/10"
                            }`}
                          >
                            {item.label}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </nav>
    </aside>
  );
}
