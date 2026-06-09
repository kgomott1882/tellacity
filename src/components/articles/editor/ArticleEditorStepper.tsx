"use client";

import { Check } from "lucide-react";

type Props = {
  steps: readonly string[];
  currentStep: number;
  maxReachableStep: number;
  onStepClick: (index: number) => void;
  compact?: boolean;
  variant?: "horizontal" | "vertical";
};

export default function ArticleEditorStepper({
  steps,
  currentStep,
  maxReachableStep,
  onStepClick,
  compact = false,
  variant = "horizontal",
}: Props) {
  if (variant === "vertical") {
    return (
      <nav aria-label="Editor steps" className="h-full px-3 py-4 sm:px-4">
        <ol className="flex flex-col">
          {steps.map((label, index) => {
            const isComplete = index < currentStep;
            const isCurrent = index === currentStep;
            const isClickable = index <= maxReachableStep;
            const isLast = index === steps.length - 1;

            return (
              <li key={label} className="relative flex items-start gap-3 pb-6 last:pb-0">
                {!isLast ? (
                  <span
                    aria-hidden
                    className={`absolute left-[13px] top-7 h-[calc(100%-12px)] w-0.5 ${
                      index < currentStep ? "bg-[#1FAF9E]" : "bg-gray-200"
                    }`}
                  />
                ) : null}
                <button
                  type="button"
                  disabled={!isClickable}
                  onClick={() => isClickable && onStepClick(index)}
                  className={`relative z-[1] flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 text-xs font-semibold transition-colors ${
                    isCurrent
                      ? "border-[#1FAF9E] bg-[#1FAF9E] text-white shadow-sm shadow-[#1FAF9E]/20"
                      : isComplete
                        ? "border-[#1FAF9E] bg-[#1FAF9E] text-white"
                        : "border-gray-300 bg-white text-gray-500"
                  } ${isClickable ? "cursor-pointer hover:border-[#169786]" : "cursor-default opacity-60"}`}
                >
                  {isComplete && !isCurrent ? (
                    <Check className="h-3 w-3" strokeWidth={3} />
                  ) : (
                    index + 1
                  )}
                </button>
                <button
                  type="button"
                  disabled={!isClickable}
                  onClick={() => isClickable && onStepClick(index)}
                  className={`hidden min-w-0 pt-0.5 text-left text-sm font-medium leading-tight transition-colors sm:block ${
                    isCurrent ? "text-[#0E4E45]" : "text-gray-500"
                  } ${isClickable ? "cursor-pointer hover:text-[#1FAF9E]" : "cursor-default opacity-60"}`}
                >
                  {label}
                </button>
              </li>
            );
          })}
        </ol>
      </nav>
    );
  }

  const circleSize = compact ? "h-7 w-7 text-xs" : "h-9 w-9 text-sm";
  const connectorTop = compact ? "top-3.5" : "top-4";
  const labelClass = compact
    ? "mt-1 max-w-[4.5rem] text-[10px] leading-tight sm:max-w-[5rem] sm:text-xs"
    : "mt-2 max-w-[5.5rem] text-xs leading-tight";

  return (
    <nav
      aria-label="Editor steps"
      className={compact ? "w-full px-3 py-2 sm:px-6" : "w-full px-6 py-5"}
    >
      <ol className="mx-auto flex max-w-4xl items-start justify-between">
        {steps.map((label, index) => {
          const isComplete = index < currentStep;
          const isCurrent = index === currentStep;
          const isClickable = index <= maxReachableStep;
          const isLast = index === steps.length - 1;

          return (
            <li key={label} className="relative flex flex-1 flex-col items-center">
              {!isLast ? (
                <span
                  aria-hidden
                  className={`absolute ${connectorTop} h-px sm:h-0.5 ${
                    compact
                      ? "left-[calc(50%+14px)] w-[calc(100%-28px)]"
                      : "left-[calc(50%+18px)] w-[calc(100%-36px)]"
                  } ${index < currentStep ? "bg-[#1FAF9E]" : "bg-gray-200"}`}
                />
              ) : null}
              <button
                type="button"
                disabled={!isClickable}
                onClick={() => isClickable && onStepClick(index)}
                className={`relative z-[1] flex ${circleSize} items-center justify-center rounded-full border-2 font-semibold transition-colors ${
                  isCurrent
                    ? "border-[#1FAF9E] bg-[#1FAF9E] text-white shadow-sm shadow-[#1FAF9E]/20"
                    : isComplete
                      ? "border-[#1FAF9E] bg-[#1FAF9E] text-white"
                      : "border-gray-300 bg-white text-gray-500"
                } ${isClickable ? "cursor-pointer hover:border-[#169786]" : "cursor-default opacity-60"}`}
              >
                {isComplete && !isCurrent ? (
                  <Check className={compact ? "h-3 w-3" : "h-4 w-4"} strokeWidth={3} />
                ) : (
                  index + 1
                )}
              </button>
              <span
                className={`${labelClass} text-center font-medium ${
                  isCurrent ? "text-[#0E4E45]" : "text-gray-500"
                } ${compact ? "hidden sm:block" : ""}`}
              >
                {label}
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
