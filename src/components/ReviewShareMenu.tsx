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
}: ReviewShareMenuProps) {
  const shareUrl =
    businessSlug && businessSlug !== "#"
      ? `/b/${businessSlug}`
      : "/b";
  const encoded = encodeURIComponent(shareUrl);
  const text = encodeURIComponent(
    businessName ? `Check out ${businessName}` : "Check out this review"
  );

  return (
    <div className="flex flex-col gap-2 text-sm text-slate-700">
      <button type="button" className="text-left hover:text-slate-900">
        Copy link
      </button>
      <a
        href={`https://x.com/intent/tweet?url=${encoded}&text=${text}`}
        target="_blank"
        rel="noopener noreferrer"
        className="hover:text-slate-900"
      >
        Share on X
      </a>
      <a
        href={`https://www.facebook.com/sharer/sharer.php?u=${encoded}`}
        target="_blank"
        rel="noopener noreferrer"
        className="hover:text-slate-900"
      >
        Share on Facebook
      </a>
    </div>
  );
}
