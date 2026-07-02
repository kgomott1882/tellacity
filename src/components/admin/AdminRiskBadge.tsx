type RiskLevel = "low" | "medium" | "high" | string;

export function normalizeRiskLevel(
  raw: string | null | undefined,
): RiskLevel | null {
  const s = raw?.trim().toLowerCase();
  if (s === "low" || s === "medium" || s === "high") return s;
  return null;
}

export default function AdminRiskBadge({
  status,
  score,
}: {
  status: string | null | undefined;
  score?: number | null;
}) {
  const level = normalizeRiskLevel(status);
  if (!level) {
    return <span className="text-xs text-neutral-400">—</span>;
  }

  let cls =
    "inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold capitalize";
  if (level === "high") {
    cls += " border-red-200 bg-red-50 text-red-800";
  } else if (level === "medium") {
    cls += " border-amber-200 bg-amber-50 text-amber-900";
  } else {
    cls += " border-emerald-200 bg-emerald-50 text-emerald-800";
  }

  const label =
    typeof score === "number" && Number.isFinite(score)
      ? `${level} (${score})`
      : level;

  return <span className={cls}>{label}</span>;
}
