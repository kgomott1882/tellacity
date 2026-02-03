"use client";

import Link from "next/link";
import { ChevronDown, ChevronRight, Check } from "lucide-react";

export default function Expandable({
  label,
  icon,
  open,
  onToggle,
  items,
  pathname,
}: {
  label: string;
  icon: React.ReactNode;
  open: boolean;
  onToggle: () => void;
  items: { label: string; path: string }[];
  pathname: string;
}) {
  return (
    <div>
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-2.5 rounded-lg cursor-pointer hover:bg-white/10 text-white"
      >
        <div className="flex items-center gap-3">
          {icon}
          <span className="font-medium">{label}</span>
        </div>
        {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
      </button>

      {open && (
        <div className="ml-10 mt-1 space-y-1">
          {items.map((item) => {
            const active = pathname === item.path;
            return (
              <Link
                key={item.path}
                href={item.path}
                className={`px-3 py-1.5 rounded-md cursor-pointer flex items-center justify-between transition ${
                  active ? "bg-white/15 text-white" : "text-white/80 hover:bg-white/10"
                }`}
              >
                <span>{item.label}</span>
                {active ? <Check size={14} className="text-white/80" /> : null}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
