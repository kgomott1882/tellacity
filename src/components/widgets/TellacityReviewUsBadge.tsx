import Image from "next/image";
import { TELLACITY_BRAND_ICON_SRC } from "@/lib/emailBranding";

type Props = {
  className?: string;
  /** When set, the whole badge is a single clickable target (e.g. write-review URL). */
  href?: string;
  size?: "sm" | "md";
};

const SIZES = {
  sm: { pad: "px-3 py-2 gap-2 text-[13px] leading-tight", img: 14 },
  md: { pad: "px-4 py-2.5 gap-2.5 text-sm leading-tight", img: 18 },
} as const;

/**
 * Trustpilot-style horizontal strip: “Review us on” + solid Tellacity mark + “Tellacity”.
 */
export default function TellacityReviewUsBadge({
  className = "",
  href,
  size = "md",
}: Props) {
  const s = SIZES[size];
  const inner = (
    <span
      className={`inline-flex items-center bg-transparent font-sans text-gray-900 ${s.pad} ${className}`}
    >
      <span className="shrink-0 font-normal">Review us on</span>
      <Image
        src={TELLACITY_BRAND_ICON_SRC}
        alt=""
        width={s.img}
        height={s.img}
        className="shrink-0 object-contain"
        unoptimized
        aria-hidden
      />
      <span className="shrink-0 font-semibold tracking-tight">Tellacity</span>
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
