"use client";

import Image from "next/image";
import { Link2 } from "lucide-react";

type ReviewShareMenuProps = {
  reviewId: string;
  businessSlug: string;
  businessName: string;
  onClose?: () => void;
};

export default function ReviewShareMenu({
  reviewId,
  businessSlug,
  businessName,
  onClose,
}: ReviewShareMenuProps) {
  const sharePath =
    reviewId ? `/review/${reviewId}` : businessSlug && businessSlug !== "#" ? `/b/${businessSlug}` : "/b";
  const absoluteUrl =
    typeof window !== "undefined" ? `${window.location.origin}${sharePath}` : "";
  const encoded = encodeURIComponent(absoluteUrl || sharePath);
  const text = encodeURIComponent(
    businessName ? `Check out ${businessName}` : "Check out this review"
  );

  const handleCopyLink = () => {
    if (absoluteUrl && navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(absoluteUrl);
      onClose?.();
    }
  };

  return (
    <div className="flex flex-col gap-2 text-sm text-slate-700">
      <button
        type="button"
        onClick={handleCopyLink}
        className="inline-flex items-center gap-2 text-left hover:text-slate-900"
      >
        <Link2 className="w-4 h-4 shrink-0 text-slate-500" />
        Copy link
      </button>
      <a
        href={`https://www.linkedin.com/sharing/share-offsite/?url=${encoded}`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 hover:text-slate-900"
      >
        <Image src="/brand/LinkedIn.jpg" alt="" width={20} height={20} className="rounded shrink-0" />
        Share on LinkedIn
      </a>
      <a
        href={`https://x.com/intent/tweet?url=${encoded}&text=${text}`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 hover:text-slate-900"
      >
        <Image src="/brand/X.jpg" alt="" width={20} height={20} className="rounded shrink-0" />
        Share on X
      </a>
      <a
        href={`https://www.facebook.com/sharer/sharer.php?u=${encoded}`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 hover:text-slate-900"
      >
        <Image src="/brand/FACEBOOK.jpg" alt="" width={20} height={20} className="rounded shrink-0" />
        Share on Facebook
      </a>
    </div>
  );
}
