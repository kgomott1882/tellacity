"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { dashboardApiPost } from "@/lib/dashboardApiFetch";
import {
  formatBusinessTagLabel,
  normalizeBusinessTags,
  toBusinessTagSlug,
} from "@/lib/businessTags";
import {
  BUSINESS_TAGS_SAVE_ERROR_FALLBACK,
  userFacingErrorMessage,
} from "@/lib/userFacingError";

const MAX_TAGS = 10;

function inputToTagSlug(raw: string): string {
  return toBusinessTagSlug(raw);
}

export type BusinessTagsInputProps = {
  businessId: string;
  initialTags?: string[];
  className?: string;
  /** When the parent provides a section heading, hide the built-in field label. */
  hideLabel?: boolean;
};

export default function BusinessTagsInput({
  businessId,
  initialTags = [],
  className = "",
  hideLabel = false,
}: BusinessTagsInputProps) {
  const [tags, setTags] = useState<string[]>(() =>
    normalizeBusinessTags(initialTags)
  );
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const initialTagsSerialized = JSON.stringify(
    normalizeBusinessTags(initialTags ?? [])
  );

  useEffect(() => {
    try {
      const parsed: unknown = JSON.parse(initialTagsSerialized);
      setTags(normalizeBusinessTags(parsed));
    } catch {
      setTags([]);
    }
  }, [businessId, initialTagsSerialized]);

  const addTag = () => {
    const value = inputToTagSlug(input);
    if (!value || tags.includes(value) || tags.length >= MAX_TAGS) return;
    setTags((prev) => [...prev, value]);
    setInput("");
    setMessage(null);
  };

  const removeTag = (tag: string) => {
    setTags((prev) => prev.filter((t) => t !== tag));
    setMessage(null);
  };

  const saveTags = async () => {
    if (!businessId.trim()) return;
    setLoading(true);
    setMessage(null);
    try {
      const json = await dashboardApiPost<{ tags: string[] }>(
        "/api/business/update-tags",
        { businessId, tags }
      );
      const next = normalizeBusinessTags(json.tags);
      setTags(next);
      setMessage({ type: "success", text: "Tags saved." });
    } catch (e) {
      const text = userFacingErrorMessage(
        e instanceof Error ? e.message : e,
        BUSINESS_TAGS_SAVE_ERROR_FALLBACK,
      );
      setMessage({ type: "error", text });
    } finally {
      setLoading(false);
    }
  };

  const atLimit = tags.length >= MAX_TAGS;
  const trimmedBusinessId = businessId.trim();
  const canSave = !!trimmedBusinessId && !loading;

  const inputId = `business-tags-input-${trimmedBusinessId || "new"}`;

  return (
    <div className={`space-y-2 ${className}`.trim()}>
      <div
        className={`flex flex-wrap items-end justify-between gap-2 ${
          hideLabel ? "justify-end" : ""
        }`}
      >
        {!hideLabel && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-[#0E0E0E]"
          >
            Keywords / category tags
          </label>
        )}
        <span className="text-xs tabular-nums text-gray-500">
          {tags.length}/{MAX_TAGS}
        </span>
      </div>

      {message && (
        <p
          className={`text-sm ${
            message.type === "success" ? "text-green-700" : "text-red-600"
          }`}
          role="status"
        >
          {message.text}
        </p>
      )}

      <div
        className={`flex min-h-[42px] flex-wrap items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-2 py-1.5 focus-within:border-[#124541] focus-within:ring-2 focus-within:ring-[#124541]/20 ${
          atLimit ? "opacity-90" : ""
        }`}
      >
        {tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex max-w-full items-center gap-0.5 rounded-full border border-gray-200 bg-gray-50 pl-2.5 pr-1 py-0.5 text-xs font-medium text-gray-800"
          >
            <span className="truncate">{formatBusinessTagLabel(tag)}</span>
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-gray-500 hover:bg-gray-200 hover:text-gray-800"
              aria-label={`Remove ${formatBusinessTagLabel(tag)}`}
            >
              <X className="h-3 w-3" strokeWidth={2.5} />
            </button>
          </span>
        ))}

        <input
          id={inputId}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addTag();
            }
          }}
          aria-label={hideLabel ? "Add keyword or category tag" : undefined}
          disabled={atLimit || !trimmedBusinessId}
          placeholder={
            atLimit
              ? "Maximum tags reached"
              : trimmedBusinessId
                ? "Add tag…"
                : "Select a business first"
          }
          className="min-w-[8rem] flex-1 border-0 bg-transparent py-1 text-sm outline-none placeholder:text-gray-400 disabled:cursor-not-allowed"
        />
      </div>

      <p className="text-xs text-gray-500">
        Press Enter to add. Click the × on a tag to remove.
      </p>

      <button
        type="button"
        onClick={saveTags}
        disabled={!canSave}
        className="rounded-lg bg-[#2fb2a8] px-4 py-2 text-sm font-semibold text-white hover:bg-[#269a91] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? "Saving…" : "Save tags"}
      </button>
    </div>
  );
}
