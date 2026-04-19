import Link from "next/link";

type AdminStatCardProps = {
  title: string;
  value: string | number;
  href?: string;
  /** Narrower padding and type for dense grids (e.g. overview stat row). */
  compact?: boolean;
};

export default function AdminStatCard({ title, value, href, compact }: AdminStatCardProps) {
  const className = compact
    ? "rounded-lg border border-neutral-200 bg-white px-2 py-2 shadow-sm transition"
    : "rounded-xl border border-neutral-200 bg-white px-4 py-3 shadow-sm transition";

  const titleCls = compact
    ? "text-[10px] font-medium uppercase leading-tight tracking-wide text-neutral-500"
    : "text-xs font-medium uppercase tracking-wide text-neutral-500";

  const valueCls = compact
    ? "mt-0.5 text-base font-semibold tabular-nums leading-tight text-neutral-900 sm:text-lg"
    : "mt-1 text-2xl font-semibold tabular-nums text-neutral-900";

  if (href) {
    return (
      <Link
        href={href}
        className={`${className} block min-w-0 hover:border-neutral-300 hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1FAF9E] focus-visible:ring-offset-2`}
        aria-label={`${title}: ${value}. Open details`}
      >
        <p className={titleCls}>{title}</p>
        <p className={`${valueCls} break-all`}>{value}</p>
      </Link>
    );
  }

  return (
    <div className={`${className} min-w-0`}>
      <p className={titleCls}>{title}</p>
      <p className={`${valueCls} break-all`}>{value}</p>
    </div>
  );
}
