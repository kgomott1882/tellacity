"use client";

import { useEffect, useState } from "react";
import { ImageIcon } from "lucide-react";
import { normalizeLogoUrl } from "@/lib/logo";

type Props = {
  logoUrl: string | null;
  nameForAlt: string;
  /** Compact size for sidebar lists; default matches grid cards. */
  variant?: "default" | "mini" | "profile" | "compact";
};

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

  const boxClass =
    variant === "mini"
      ? "h-8 w-8 shrink-0 rounded-lg"
      : variant === "profile"
        ? "h-24 w-24 shrink-0 rounded-2xl"
        : variant === "compact"
          ? "h-12 w-12 shrink-0 rounded-lg"
          : "h-12 w-12 shrink-0 rounded-2xl sm:h-14 sm:w-14";

  const iconClass =
    variant === "profile"
      ? "h-6 w-6"
      : variant === "mini"
        ? "h-3.5 w-3.5"
        : "h-5 w-5";

  return (
    <div
      className={`flex items-center justify-center overflow-hidden border border-[#e5e7eb] bg-[#f9fafb] ${boxClass}`}
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
        <ImageIcon
          className={`${iconClass} text-[#d1d5db]`}
          strokeWidth={1.5}
          aria-hidden
        />
      )}
    </div>
  );
}
