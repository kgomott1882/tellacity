"use client";

import { useEffect, useState } from "react";
import { BookOpen, ChevronDown, Lightbulb } from "lucide-react";
import type { ArticleContentType } from "@/lib/articles/types";
import { ARTICLE_EDITOR_GUIDES } from "@/lib/articles/articleEditorGuideContent";
import type {
  ArticleEditorGuideSection,
  ArticleEditorGuideStep,
} from "@/lib/articles/articleEditorGuideContent";
import { isEditorGuideCollapsed, setEditorGuideCollapsed } from "@/lib/articles/articleEditorGuide";

type Props = {
  articleId: string;
  contentType: ArticleContentType;
  autoCollapsed?: boolean;
};

function GuideSectionList({ section }: { section: ArticleEditorGuideSection }) {
  const ListTag = section.ordered ? "ol" : "ul";
  const listClass = section.ordered
    ? "mt-2 list-decimal space-y-1.5 pl-5 text-sm text-slate-700"
    : "mt-2 list-disc space-y-1.5 pl-4 text-sm text-slate-700";

  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {section.title}
      </h3>
      {section.description ? (
        <p className="mt-1 text-sm text-slate-500">{section.description}</p>
      ) : null}
      <ListTag className={listClass}>
        {section.items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ListTag>
    </div>
  );
}

function GuidedStepCard({ step, index }: { step: ArticleEditorGuideStep; index: number }) {
  return (
    <div className="rounded-lg border border-slate-200/90 bg-white/80 p-3.5">
      <div className="flex items-start gap-2.5">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#1FAF9E]/10 text-xs font-semibold text-[#0E4E45]">
          {index + 1}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-slate-900">{step.title}</h3>
          <p className="mt-1 text-sm leading-relaxed text-slate-600">{step.prompt}</p>
          <ul className="mt-2.5 space-y-1">
            {step.starters.map((starter) => (
              <li
                key={starter}
                className="rounded-md bg-amber-50/80 px-2.5 py-1.5 text-sm italic text-slate-700"
              >
                {starter}
              </li>
            ))}
          </ul>
          {step.editorHint ? (
            <p className="mt-2 text-xs text-slate-500">
              <span className="font-medium text-slate-600">Tip:</span> {step.editorHint}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default function ArticleEditorGuidePanel({
  articleId,
  contentType,
  autoCollapsed = false,
}: Props) {
  const guide = ARTICLE_EDITOR_GUIDES[contentType];
  const [expanded, setExpanded] = useState(() =>
    articleId ? !isEditorGuideCollapsed(articleId) : false,
  );

  useEffect(() => {
    if (autoCollapsed) {
      setExpanded(false);
      if (articleId) setEditorGuideCollapsed(articleId, true);
    }
  }, [autoCollapsed, articleId]);

  const toggleExpanded = (next: boolean) => {
    setExpanded(next);
    if (articleId) setEditorGuideCollapsed(articleId, !next);
  };

  const isCaseStudyGuide = Boolean(guide.guidedSteps?.length);

  return (
    <section
      className="mb-4 rounded-lg border border-slate-200 bg-slate-50/90"
      aria-label="Writing guide"
    >
      <div className="px-4 py-3 sm:px-5">
        <button
          type="button"
          onClick={() => toggleExpanded(!expanded)}
          className="flex w-full min-w-0 items-center gap-2.5 text-left"
          aria-expanded={expanded}
        >
          <BookOpen className="h-4 w-4 shrink-0 text-[#1FAF9E]" aria-hidden />
          <span className="truncate text-sm font-semibold text-slate-900">{guide.heading}</span>
          <ChevronDown
            className={`ml-auto h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200 ${
              expanded ? "rotate-180" : ""
            }`}
            aria-hidden
          />
        </button>
      </div>

      {expanded ? (
        <div className="border-t border-slate-200/80 px-4 pb-4 pt-3 sm:px-5">
          <p className="text-sm leading-relaxed text-slate-600">{guide.intro}</p>

          {isCaseStudyGuide && guide.guidedSteps ? (
            <>
              <p className="mt-4 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-slate-500">
                <Lightbulb className="h-3.5 w-3.5 text-amber-500" aria-hidden />
                Write it like a story, use these prompts as you go
              </p>
              <div className="mt-3 space-y-3">
                {guide.guidedSteps.map((step, index) => (
                  <GuidedStepCard key={step.title} step={step} index={index} />
                ))}
              </div>
              {guide.visualsNote ? (
                <p className="mt-4 rounded-lg border border-slate-200/80 bg-white/60 px-3 py-2.5 text-sm text-slate-600">
                  {guide.visualsNote}
                </p>
              ) : null}
              {guide.example ? (
                <details className="group mt-4 rounded-lg border border-slate-200/80 bg-white/70">
                  <summary className="cursor-pointer list-none px-3 py-2.5 text-sm font-medium text-[#0E4E45] marker:content-none [&::-webkit-details-marker]:hidden">
                    <span className="inline-flex items-center gap-2">
                      {guide.example.title}
                      <ChevronDown
                        className="h-4 w-4 text-slate-400 transition-transform group-open:rotate-180"
                        aria-hidden
                      />
                    </span>
                  </summary>
                  <div className="space-y-3 border-t border-slate-100 px-3 py-3 text-sm leading-relaxed text-slate-600">
                    {guide.example.paragraphs.map((paragraph) => (
                      <p key={paragraph}>{paragraph}</p>
                    ))}
                  </div>
                </details>
              ) : null}
            </>
          ) : guide.sections ? (
            <>
              <div
                className={`mt-4 grid gap-5 ${
                  guide.sections.length > 1 ? "sm:grid-cols-2" : "grid-cols-1"
                }`}
              >
                {guide.sections.map((section) => (
                  <GuideSectionList key={section.title} section={section} />
                ))}
              </div>
              {guide.advancedSeo ? (
                <details className="group mt-4 rounded-md border border-slate-200/80 bg-white/70">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-3 py-2.5 text-sm font-medium text-slate-700 marker:content-none [&::-webkit-details-marker]:hidden">
                    <span>{guide.advancedSeo.title}</span>
                    <ChevronDown
                      className="h-4 w-4 shrink-0 text-slate-400 transition-transform group-open:rotate-180"
                      aria-hidden
                    />
                  </summary>
                  <ul className="space-y-1.5 border-t border-slate-100 px-3 py-3 text-sm leading-relaxed text-slate-600">
                    {guide.advancedSeo.items.map((item) => (
                      <li key={item} className="flex gap-2">
                        <span className="text-slate-300" aria-hidden>
                          ·
                        </span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </details>
              ) : null}
            </>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
