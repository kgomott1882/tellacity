import type { ReactNode } from "react";

type AdminTableShellProps = {
  title: string;
  controls?: ReactNode;
  children: ReactNode;
};

export default function AdminTableShell({
  title,
  controls,
  children,
}: AdminTableShellProps) {
  return (
    <section className="admin-table-shell rounded-xl border border-neutral-200 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-neutral-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-sm font-semibold text-neutral-900">{title}</h2>
        {controls ? (
          <div className="flex flex-wrap items-center gap-2">{controls}</div>
        ) : null}
      </div>
      <div className="overflow-x-auto [&_tbody_tr]:cursor-pointer [&_tbody_tr]:transition-colors [&_tbody_tr:hover]:bg-[#F4C430]/20 [&_tbody_tr:focus-within]:bg-[#F4C430]/28 [&_tbody_tr[aria-selected='true']]:bg-[#F4C430]/35">
        {children}
      </div>
    </section>
  );
}
