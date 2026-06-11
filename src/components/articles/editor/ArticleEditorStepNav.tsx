"use client";

type Props = {
  step: number;
  stepCount: number;
  linkValidationBlocked: boolean;
  onPrevious: () => void;
  onNext: () => void;
  pinned?: boolean;
};

export default function ArticleEditorStepNav({
  step,
  stepCount,
  linkValidationBlocked,
  onPrevious,
  onNext,
  pinned = false,
}: Props) {
  return (
    <div
      className={
        pinned
          ? "flex shrink-0 justify-between border-t border-gray-200 bg-[#F5F4F0] px-1 pb-4 pt-4"
          : "mt-8 flex justify-between pb-8"
      }
    >
      <button
        type="button"
        disabled={step === 0 || linkValidationBlocked}
        onClick={onPrevious}
        className="rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-white/80 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Previous
      </button>
      <button
        type="button"
        disabled={step >= stepCount - 1 || linkValidationBlocked}
        onClick={onNext}
        className="rounded-lg px-3 py-2 text-sm font-semibold text-[#1FAF9E] transition-colors hover:bg-white/80 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Next
      </button>
    </div>
  );
}
