"use client";

export default function SimplePage({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div>
      <h1 className="text-2xl font-semibold">{title}</h1>
      {subtitle ? <p className="mt-2 text-black/60">{subtitle}</p> : null}
    </div>
  );
}
