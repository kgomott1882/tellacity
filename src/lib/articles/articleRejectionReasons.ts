/**
 * Preset rejection reasons for blog & case study moderation.
 * Dropdown shows `label`; `message` is stored, emailed, and shown in the business dashboard.
 */

export type ArticleRejectionReasonPreset = {
  id: string;
  label: string;
  message: string;
  /** When true, admin must supply custom text via resolveArticleRejectionReason. */
  isCustom?: boolean;
};

const GUIDELINES_URL = "https://tellacity.com/business-guidelines";

function guidelinesFooter(): string {
  return [
    "",
    "Tellacity Business Guidelines (Blogs & Case Studies):",
    GUIDELINES_URL,
    "",
    "Edit your draft in the Blogs & Case Studies dashboard, address the points above, and submit again for review.",
  ].join("\n");
}

export const ARTICLE_REJECTION_CUSTOM_ID = "other_custom";

export const ARTICLE_REJECTION_REASON_PRESETS: ArticleRejectionReasonPreset[] = [
  {
    id: "promotional_advertorial",
    label: "Promotional / advertorial content",
    message: [
      "Your submission reads primarily as advertising or sales copy rather than informative content for readers.",
      "",
      "Under our Business Guidelines, blogs and case studies must provide genuine value, industry insights, practical guidance, or documented client outcomes, not advertorials, discount pushes, or keyword-stuffed marketing pages.",
      "",
      "Common issues we saw:",
      "• Heavy focus on promotions, pricing, or calls to buy without educational substance",
      "• Content that could work as a landing page rather than an article",
      "• Repeated self-promotion with little useful information for the reader",
      "",
      "What to do next:",
      "• Rewrite with reader-focused information your audience can apply",
      "• Lead with expertise and helpful takeaways; keep sales language minimal",
      "• Use the Preview tool before resubmitting",
      guidelinesFooter(),
    ].join("\n"),
  },
  {
    id: "low_quality_short",
    label: "Low quality or too short",
    message: [
      "Your submission does not yet meet our minimum quality bar for publication on Tellacity.",
      "",
      "Published articles should be substantive, well structured, and useful to someone researching your industry or business, not thin placeholders or unfinished drafts.",
      "",
      "Common issues we saw:",
      "• Very short body text with little detail or structure",
      "• Generic filler that does not teach the reader anything specific",
      "• Missing headings, examples, or clear narrative flow",
      "• Featured image missing or not representative of the content",
      "",
      "What to do next:",
      "• Expand the article with concrete details, examples, and clear sections",
      "• Add a relevant featured image and proofread for spelling and grammar",
      "• Aim for content you would be proud to share with a prospective customer",
      guidelinesFooter(),
    ].join("\n"),
  },
  {
    id: "guideline_violation",
    label: "General guideline violation",
    message: [
      "Your submission does not comply with Tellacity's Blogs & Case Studies content standards.",
      "",
      "All business articles are reviewed before publication. Content must be original, accurate, professional, and aligned with our Business Guidelines, the same trust standards that apply to listings and reviews.",
      "",
      "This rejection may relate to:",
      "• Content that is off-topic, inappropriate, or not relevant to your business or industry",
      "• Plagiarised, duplicated, or AI-generated filler without real value",
      "• Tone or material that conflicts with platform safety standards",
      "",
      "What to do next:",
      "• Read the Blogs & Case Studies section of our Business Guidelines in full",
      "• Revise the article to meet content, attribution, and professionalism requirements",
      "• Contact support if you need clarification on a specific rule",
      guidelinesFooter(),
    ].join("\n"),
  },
  {
    id: "misleading_claims",
    label: "Misleading or unverifiable claims",
    message: [
      "Your submission includes claims that are misleading, exaggerated, or cannot be supported.",
      "",
      "Tellacity articles must be honest and accurate. Readers rely on business-published content as an extension of your reputation on the platform.",
      "",
      "Common issues we saw:",
      "• Statistics, rankings, or results presented without context or evidence",
      "• Guarantees or outcomes that a reasonable reader could not trust",
      "• Impersonation of customers, competitors, or third-party endorsements",
      "• Case study outcomes that appear fabricated or unverifiable",
      "",
      "What to do next:",
      "• Remove or rewrite unsupported claims; use factual, defensible language",
      "• For case studies, ensure industry, challenge, solution, and results fields reflect a real engagement",
      "• If you cite data, attribute the source or describe it qualitatively instead",
      guidelinesFooter(),
    ].join("\n"),
  },
  {
    id: "link_policy",
    label: "Link policy violation",
    message: [
      "Your submission breaks Tellacity's article link rules.",
      "",
      "Link limits exist to protect readers from spam and keep articles trustworthy. These rules are enforced in the editor and checked again at review.",
      "",
      "Relevant Business Guidelines limits:",
      "• Maximum 5 external links per article (links outside Tellacity and outside your registered business website)",
      "• Links to your registered business website do not count toward that limit",
      "• Links to other Tellacity pages are unlimited",
      "• The same external URL may not appear more than 3 times",
      "• Not allowed: affiliate or referral links, URL shorteners, gambling, adult-content, or unsafe download links",
      "",
      "What to do next:",
      "• Remove or replace prohibited links; use readable anchor text instead of raw URLs",
      "• Check the link validation banner in the editor before resubmitting",
      guidelinesFooter(),
    ].join("\n"),
  },
  {
    id: "images_media",
    label: "Images or media issue",
    message: [
      "Your submission has a problem with featured or inline images.",
      "",
      "Images must follow the same standards as profile photos: owned or properly licensed, accurate, and appropriate for a business audience.",
      "",
      "Common issues we saw:",
      "• Featured image missing, low resolution, or unrelated to the article",
      "• Stock or misleading imagery that does not represent your business",
      "• Inappropriate, offensive, or copyrighted material without rights",
      "",
      "What to do next:",
      "• Upload a clear, relevant featured image",
      "• Replace inline images with owned or licensed visuals that match the article",
      "• See Business Guidelines: Photos, Logos, and Listing Content for visual content rules",
      guidelinesFooter(),
    ].join("\n"),
  },
  {
    id: "case_study_incomplete",
    label: "Case study fields incomplete",
    message: [
      "Your case study submission is missing required structure or detail.",
      "",
      "Case studies on Tellacity must tell a complete story: client industry, challenge, solution, and results, in addition to the main article body.",
      "",
      "Common issues we saw:",
      "• One or more case study fields left empty or too vague",
      "• Body content that does not align with the structured summary fields",
      "• Results section lacking measurable or descriptive outcomes",
      "",
      "What to do next:",
      "• Complete all case study fields in the editor with specific, honest detail",
      "• Ensure the main article expands on the summary rather than repeating it",
      guidelinesFooter(),
    ].join("\n"),
  },
  {
    id: "duplicate_spam",
    label: "Duplicate or spam content",
    message: [
      "Your submission appears to duplicate existing content or resembles spam submitted to manipulate visibility.",
      "",
      "Tellacity does not publish near-identical articles, cross-posted advertorials, or repetitive submissions designed to game search or internal discovery.",
      "",
      "Common issues we saw:",
      "• Substantially the same article submitted multiple times with minor changes",
      "• Content copied from other websites without original value",
      "• Keyword-stuffed or low-effort posts submitted in bulk",
      "",
      "What to do next:",
      "• Publish one distinct, original article per submission",
      "• If updating a live article, use the published-article edit flow instead of creating duplicates",
      guidelinesFooter(),
    ].join("\n"),
  },
  {
    id: ARTICLE_REJECTION_CUSTOM_ID,
    label: "Other / custom",
    message: "",
    isCustom: true,
  },
];

const presetById = new Map(
  ARTICLE_REJECTION_REASON_PRESETS.map((preset) => [preset.id, preset]),
);

/** @deprecated Legacy labels stored before preset IDs, map to full messages when possible. */
const legacyLabelToId: Record<string, string> = {
  "Promotional / advertorial content": "promotional_advertorial",
  "Low quality or too short": "low_quality_short",
  "Guideline violation": "guideline_violation",
  "Misleading claims": "misleading_claims",
  Other: ARTICLE_REJECTION_CUSTOM_ID,
  "Other / custom": ARTICLE_REJECTION_CUSTOM_ID,
};

export function getArticleRejectionPreset(id: string): ArticleRejectionReasonPreset | undefined {
  return presetById.get(id);
}

function appendAdminNotesToRejectionMessage(
  base: string,
  adminNotes?: string,
): string {
  const notes = adminNotes?.trim();
  if (!notes) return base;

  const insertion = [
    "",
    "Additional feedback from our review team:",
    notes,
  ].join("\n");

  const guidelinesMarker = `\n\nTellacity Business Guidelines`;
  const idx = base.indexOf(guidelinesMarker);
  if (idx >= 0) {
    return base.slice(0, idx) + insertion + base.slice(idx);
  }

  return `${base}${insertion}`;
}

/**
 * Resolve the full rejection text sent to the business.
 * @param presetId - preset id from ARTICLE_REJECTION_REASON_PRESETS
 * @param customText - required when preset is other_custom
 * @param adminNotes - optional extra comments appended for any preset
 */
export function resolveArticleRejectionReason(
  presetId: string,
  customText?: string,
  adminNotes?: string,
): string | null {
  const preset = presetById.get(presetId);
  if (!preset) return null;

  if (preset.isCustom) {
    const trimmed = customText?.trim() ?? "";
    if (!trimmed) return null;
    const base = [
      trimmed,
      "",
      "Please review Tellacity Business Guidelines (Blogs & Case Studies) before resubmitting:",
      GUIDELINES_URL,
    ].join("\n");
    return appendAdminNotesToRejectionMessage(base, adminNotes);
  }

  const base = preset.message.trim();
  if (!base) return null;
  return appendAdminNotesToRejectionMessage(base, adminNotes);
}

/** Upgrade a stored short label to the rich preset message when recognized. */
export function enrichStoredArticleRejectionReason(stored: string | null | undefined): string | null {
  const trimmed = stored?.trim();
  if (!trimmed) return null;

  const legacyId = legacyLabelToId[trimmed];
  if (legacyId) {
    const enriched = resolveArticleRejectionReason(legacyId);
    if (enriched) return enriched;
  }

  return trimmed;
}

export function articleRejectionReasonPreview(
  presetId: string,
  customText?: string,
  adminNotes?: string,
): string | null {
  return resolveArticleRejectionReason(presetId, customText, adminNotes);
}
