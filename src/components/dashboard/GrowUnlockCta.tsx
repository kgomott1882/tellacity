"use client";

import type { GrowUnlockCtaResult } from "@/hooks/useGrowUnlockCta";
import { cn } from "@/lib/utils";

type SharedProps = GrowUnlockCtaResult & {
  className?: string;
  disabled?: boolean;
};

const PRIMARY_CLASS =
  "inline-flex items-center justify-center rounded-lg bg-[#124541] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#0f3a35] disabled:cursor-not-allowed disabled:opacity-60";

const COMPACT_CLASS =
  "inline-flex shrink-0 items-center justify-center rounded-lg bg-[#124541] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-[#0f3a35] disabled:cursor-not-allowed disabled:opacity-60";

const LINK_CLASS =
  "font-semibold text-[#124541] underline decoration-[#124541]/40 underline-offset-2 hover:text-[#0f3a35] disabled:cursor-not-allowed disabled:opacity-60";

const CHIP_CLASS =
  "inline-flex items-center gap-1.5 rounded-full border border-[#124541]/15 bg-white/95 px-2.5 py-1 text-[11px] font-semibold text-[#124541] shadow-sm backdrop-blur-sm transition hover:bg-[#124541] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#124541]/40 disabled:cursor-not-allowed disabled:opacity-60";

export function GrowUnlockButton({
  label,
  onClick,
  loading,
  className,
  disabled,
  variant = "primary",
}: SharedProps & { variant?: "primary" | "compact" }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      className={cn(variant === "compact" ? COMPACT_CLASS : PRIMARY_CLASS, className)}
    >
      {loading ? "Starting…" : label}
    </button>
  );
}

export function GrowUnlockLink({
  label,
  onClick,
  loading,
  className,
  disabled,
  variant = "link",
}: SharedProps & { variant?: "link" | "chip" }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      className={cn(variant === "chip" ? CHIP_CLASS : LINK_CLASS, className)}
    >
      {loading ? "Starting…" : label}
    </button>
  );
}

export function GrowUnlockError({
  message,
  className,
}: {
  message: string | null;
  className?: string;
}) {
  if (!message) return null;
  return (
    <p
      className={cn(
        "rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900",
        className,
      )}
      role="alert"
    >
      {message}
    </p>
  );
}
