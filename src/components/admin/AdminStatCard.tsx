import Link from "next/link";

type AdminStatCardProps = {
  title: string;
  value: string | number;
  href?: string;
};

export default function AdminStatCard({ title, value, href }: AdminStatCardProps) {
  const className =
    "rounded-xl border border-neutral-200 bg-white px-4 py-3 shadow-sm transition";

  if (href) {
    return (
      <Link
        href={href}
        className={`${className} block hover:border-neutral-300 hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1FAF9E] focus-visible:ring-offset-2`}
        aria-label={`${title}: ${value}. Open details`}
      >
        <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
          {title}
        </p>
        <p className="mt-1 text-2xl font-semibold tabular-nums text-neutral-900">
          {value}
        </p>
      </Link>
    );
  }

  return (
    <div className={className}>
      <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
        {title}
      </p>
      <p className="mt-1 text-2xl font-semibold tabular-nums text-neutral-900">
        {value}
      </p>
    </div>
  );
}
