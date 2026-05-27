import Link from "next/link";
import type { ReactNode } from "react";
import { faqItems, type FaqItem, type FaqSegment } from "@/lib/faqItems";

function FaqAnswer({ segments }: { segments: FaqSegment[] }) {
  const nodes: ReactNode[] = [];

  segments.forEach((segment, index) => {
    if (segment.type === "text") {
      nodes.push(segment.value);
      return;
    }

    nodes.push(
      <Link
        key={`${segment.href}-${index}`}
        href={segment.href}
        className="font-medium text-[#124541] underline underline-offset-2 hover:text-[#1FAF9E]"
      >
        {segment.label}
      </Link>,
    );
  });

  return <>{nodes}</>;
}

type FaqAccordionListProps = {
  items?: FaqItem[];
  className?: string;
};

export default function FaqAccordionList({
  items = faqItems,
  className = "",
}: FaqAccordionListProps) {
  const midpoint = Math.ceil(items.length / 2);
  const columns = [items.slice(0, midpoint), items.slice(midpoint)];

  return (
    <div className={`grid gap-6 lg:grid-cols-2 ${className}`.trim()}>
      {columns.map((column, columnIndex) => (
        <dl key={`faq-column-${columnIndex}`} className="space-y-4">
          {column.map((item) => (
            <details
              key={item.question}
              className="group rounded-md border border-gray-200 bg-white"
            >
              <summary className="flex cursor-pointer items-center justify-between px-5 py-3 text-left text-sm text-[#0E0E0E] hover:bg-gray-50 [&::-webkit-details-marker]:hidden">
                <dt className="font-normal group-open:font-semibold">
                  {item.question}
                </dt>
                <svg
                  viewBox="0 0 24 24"
                  className="h-4 w-4 shrink-0 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </summary>
              <dd className="px-5 pb-4 text-sm leading-relaxed text-gray-600">
                <FaqAnswer segments={item.segments} />
              </dd>
            </details>
          ))}
        </dl>
      ))}
    </div>
  );
}
