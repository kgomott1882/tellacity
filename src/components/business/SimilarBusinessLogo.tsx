"use client";

import { useEffect, useState } from "react";
import { normalizeLogoUrl } from "@/lib/logo";

type Props = {
  logoUrl: string | null;
  nameForAlt: string;
  /** Compact size for sidebar lists; default matches grid cards. */
  variant?: "default" | "mini" | "profile";
};

function fallbackLetter(nameForAlt: string): string {
  return (nameForAlt?.trim()?.charAt(0) || "B").toUpperCase();
}

export default function SimilarBusinessLogo({
  logoUrl,
  nameForAlt,
  variant = "default",
}: Props) {
  const url = logoUrl ? normalizeLogoUrl(logoUrl) ?? logoUrl : null;
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    setImageFailed(false);
  }, [url]);
  const showImage = Boolean(url) && !imageFailed;
  const letter = fallbackLetter(nameForAlt);

  const boxClass =
    variant === "mini"
      ? "h-8 w-8 shrink-0 rounded-lg"
      : variant === "profile"
        ? "h-24 w-24 shrink-0 rounded-2xl"
        : "h-12 w-12 shrink-0 rounded-2xl sm:h-14 sm:w-14";

  const letterClass =
    variant === "profile" ? "text-2xl font-semibold text-[#0E0E0E]" : "text-sm font-semibold text-[#0E0E0E]";

  return (
    <div
      className={`flex items-center justify-center overflow-hidden bg-[#FCF7F6] ${boxClass}`}
    >
      {showImage ? (
        <img
          src={url!}
          alt={`${nameForAlt} logo`}
          className="h-full w-full object-contain"
          referrerPolicy="no-referrer"
          crossOrigin="anonymous"
          onError={() => setImageFailed(true)}
        />
      ) : (
        <span className={letterClass} aria-hidden>
          {letter}
        </span>
      )}
    </div>
  );
}
