"use client";

import { normalizeLogoUrl } from "@/lib/logo";

type Props = {
  logoUrl: string | null;
  nameForAlt: string;
  /** Compact size for sidebar lists; default matches grid cards. */
  variant?: "default" | "mini";
};

export default function SimilarBusinessLogo({
  logoUrl,
  nameForAlt,
  variant = "default",
}: Props) {
  const url = logoUrl ? normalizeLogoUrl(logoUrl) ?? logoUrl : null;
  const boxClass =
    variant === "mini"
      ? "h-8 w-8 shrink-0 rounded-lg"
      : "h-12 w-12 shrink-0 rounded-2xl sm:h-14 sm:w-14";
  return (
    <div
      className={`flex items-center justify-center overflow-hidden bg-[#FCF7F6] ${boxClass}`}
    >
      {url ? (
        <img
          src={url}
          alt={`${nameForAlt} logo`}
          className="h-full w-full object-contain"
          referrerPolicy="no-referrer"
          crossOrigin="anonymous"
          onError={(event) => {
            event.currentTarget.style.display = "none";
          }}
        />
      ) : null}
    </div>
  );
}
