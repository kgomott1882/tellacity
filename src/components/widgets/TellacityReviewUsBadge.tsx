import Image from "next/image";
import { TELLACITY_TRUST_BADGE_LOGO_PATH } from "@/lib/emailBranding";

type Props = {
  className?: string;
  /** When set, the whole badge is a single clickable target (e.g. write-review URL). */
  href?: string;
  size?: "sm" | "md";
  showTellacityLogo?: boolean;
  /** Transparent minimal embed — no extra padding chrome. */
  minimal?: boolean;
};

const SIZES = {
  sm: {
    pad: "px-3 py-2.5 gap-2 text-sm leading-snug",
    logoClass: "h-[13px] max-w-[112px] sm:max-w-[120px]",
  },
  md: {
    pad: "px-4 py-3 gap-2.5 text-[15px] leading-snug",
    logoClass: "h-[15px] max-w-[126px] sm:max-w-[136px]",
  },
} as const;

/** Horizontal strip: “Review us on” + Tellacity wordmark (`TELLACITY LOGO 1A`). */
export default function TellacityReviewUsBadge({
  className = "",
  href,
  size = "md",
  showTellacityLogo = true,
  minimal,
}: Props) {
  const s = SIZES[size];
  const padClass = minimal ? "gap-2 px-0 py-0 text-sm leading-snug" : s.pad;
  const inner = (
    <span
      className={`inline-flex items-center bg-transparent ${padClass} ${className}`}
      style={{
        color: "var(--tc-widget-text-color, #111827)",
        fontFamily: "var(--tc-widget-font-family, ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif)",
      }}
    >
      <span className="shrink-0 font-normal">Review us on</span>
      {showTellacityLogo ? (
        <Image
          src={TELLACITY_TRUST_BADGE_LOGO_PATH}
          alt="Tellacity"
          width={142}
          height={23}
          className={`w-auto shrink-0 object-contain object-left ${s.logoClass}`}
          unoptimized
        />
      ) : null}
    </span>
  );

  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex text-inherit no-underline transition-opacity hover:opacity-90"
      >
        {inner}
      </a>
    );
  }

  return inner;
}
