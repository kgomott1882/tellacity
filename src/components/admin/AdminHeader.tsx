"use client";

import { usePathname } from "next/navigation";

const TITLES: Record<string, { title: string }> = {
  "/admin": { title: "Overview" },
  "/admin/users": { title: "Users" },
  "/admin/businesses": { title: "Businesses" },
  "/admin/reviews": { title: "Reviews" },
};

type AdminHeaderProps = {
  userEmail: string;
};

export default function AdminHeader({ userEmail }: AdminHeaderProps) {
  const pathname = usePathname();
  const meta = TITLES[pathname] ?? { title: "Admin" };

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-neutral-200 bg-white px-6">
      <div>
        <h1 className="text-base font-semibold text-neutral-900">{meta.title}</h1>
        <p className="text-xs text-neutral-500">Operations console</p>
      </div>
      {userEmail ? (
        <p className="max-w-[240px] truncate text-xs text-neutral-600" title={userEmail}>
          {userEmail}
        </p>
      ) : null}
    </header>
  );
}
