import { ThumbsUp } from "lucide-react";

type ReviewReactionButtonsProps = {
  reviewId: string;
  initialLikeCount?: number;
};

export default function ReviewReactionButtons({
  initialLikeCount = 0,
}: ReviewReactionButtonsProps) {
  return (
    <button
      type="button"
      className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-[#124541]"
    >
      <ThumbsUp className="h-4 w-4" />
      Helpful ({initialLikeCount})
    </button>
  );
}
