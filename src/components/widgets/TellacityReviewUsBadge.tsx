import Image from "next/image";
import { TELLACITY_TRUST_BADGE_LOGO_PATH } from "@/lib/emailBranding";

type Props = {
  className?: string;
  /** When set, the whole badge is a single clickable target (e.g. write-review URL). */
  href?: string;
  size?: "sm" | "md";
  showTellacityLogo?: boolean;
};

const SIZES = {
  sm: {
    pad: "px-3 py-2.5 gap-2 text-sm leading-snug",
    logoClass: "h-[17px] max-w-[142px] sm:max-w-[154px]",
  },
  md: {
    pad: "px-4 py-3 gap-2.5 text-[15px] leading-snug",
    logoClass: "h-[20px] max-w-[162px] sm:max-w-[178px]",
  },
} as const;

/** Horizontal strip: “Review us on” + Tellacity wordmark (`TELLACITY LOGO 1A`). */
export default function TellacityReviewUsBadge({
  className = "",
  href,
  size = "md",
  showTellacityLogo = true,
}: Props) {
  const s = SIZES[size];
  const inner = (
    <span
      className={`inline-flex items-center bg-transparent ${s.pad} ${className}`}
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
          width={178}
          height={28}
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
