"use client";

import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { CASE_STUDY_FIELD_PLACEHOLDERS } from "@/lib/articles/articleEditorGuideContent";

type FieldProps = {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
};

function FieldCard({ label, placeholder, value, onChange, disabled }: FieldProps) {
  const [open, setOpen] = useState(true);

  return (
    <div className="rounded-lg border border-gray-200 bg-[#FAFAF8]">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
      >
        <span className="text-sm font-semibold text-gray-900">{label}</span>
        {open ? (
          <ChevronUp className="h-4 w-4 text-gray-500" />
        ) : (
          <ChevronDown className="h-4 w-4 text-gray-500" />
        )}
      </button>
      {open ? (
        <div className="border-t border-gray-200 px-4 pb-4 pt-3">
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            rows={4}
            placeholder={placeholder}
            className="w-full resize-y rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#1FAF9E] focus:outline-none focus:ring-2 focus:ring-[#1FAF9E]/20"
          />
        </div>
      ) : null}
    </div>
  );
}

type Props = {
  clientIndustry: string;
  challenge: string;
  solution: string;
  results: string;
  onClientIndustry: (v: string) => void;
  onChallenge: (v: string) => void;
  onSolution: (v: string) => void;
  onResults: (v: string) => void;
  disabled?: boolean;
};

export default function ArticleCaseStudyFields(props: Props) {
  const { disabled } = props;

  return (
    <div className="mb-8 grid gap-4 sm:grid-cols-2">
      <FieldCard
        label="Client context"
        placeholder={CASE_STUDY_FIELD_PLACEHOLDERS.clientIndustry}
        value={props.clientIndustry}
        onChange={props.onClientIndustry}
        disabled={disabled}
      />
      <FieldCard
        label="The challenge"
        placeholder={CASE_STUDY_FIELD_PLACEHOLDERS.challenge}
        value={props.challenge}
        onChange={props.onChallenge}
        disabled={disabled}
      />
      <FieldCard
        label="What we did"
        placeholder={CASE_STUDY_FIELD_PLACEHOLDERS.solution}
        value={props.solution}
        onChange={props.onSolution}
        disabled={disabled}
      />
      <FieldCard
        label="Results and impact"
        placeholder={CASE_STUDY_FIELD_PLACEHOLDERS.results}
        value={props.results}
        onChange={props.onResults}
        disabled={disabled}
      />
    </div>
  );
}
