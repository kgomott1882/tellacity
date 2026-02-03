"use client";

import Link from "next/link";

export default function NavItem({
  href,
  icon,
  label,
  active,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-4 py-2.5 rounded-lg cursor-pointer transition ${
        active ? "bg-[#124541] text-white" : "hover:bg-white/10 text-white"
      }`}
    >
      {icon}
      <span className="font-medium">{label}</span>
    </Link>
  );
}
