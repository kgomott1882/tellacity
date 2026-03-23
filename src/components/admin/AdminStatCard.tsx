type AdminStatCardProps = {
  title: string;
  value: string | number;
};

export default function AdminStatCard({ title, value }: AdminStatCardProps) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white px-4 py-3 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
        {title}
      </p>
      <p className="mt-1 text-2xl font-semibold tabular-nums text-neutral-900">
        {value}
      </p>
    </div>
  );
}
