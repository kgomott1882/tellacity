/**
 * Grow-tier invite message styling (subject/body). Stored as JSON on review_invite_email_templates.
 * Values are sanitized before save and before inline CSS in HTML emails.
 */

export const INVITE_FONT_KEYS = ["system", "georgia", "arial", "verdana", "tahoma"] as const;
export type InviteFontKey = (typeof INVITE_FONT_KEYS)[number];

/** Stacks avoid quotes so they are safe inside double-quoted HTML style attributes. */
export const INVITE_FONT_CSS: Record<InviteFontKey, string> = {
  system: "system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
  georgia: "Georgia, Times New Roman, serif",
  arial: "Arial, Helvetica, sans-serif",
  verdana: "Verdana, Geneva, sans-serif",
  tahoma: "Tahoma, Geneva, sans-serif",
};

/** Safe preset text colours (hex). */
export const INVITE_TEXT_COLOR_PRESETS = [
  "#111827",
  "#0E4E45",
  "#1d4ed8",
  "#b45309",
  "#7c3aed",
  "#be123c",
] as const;

export type GrowMessageStyle = {
  subjectFont: InviteFontKey;
  subjectColor: string;
  subjectBold: boolean;
  bodyFont: InviteFontKey;
  bodyColor: string;
  bodyBold: boolean;
};

export const DEFAULT_GROW_MESSAGE_STYLE: GrowMessageStyle = {
  subjectFont: "system",
  subjectColor: "#111827",
  subjectBold: false,
  bodyFont: "system",
  bodyColor: "#111827",
  bodyBold: false,
};

const HEX_RE = /^#[0-9A-Fa-f]{6}$/;

function isFontKey(v: string): v is InviteFontKey {
  return (INVITE_FONT_KEYS as readonly string[]).includes(v);
}

export function parseGrowMessageStyle(raw: unknown): GrowMessageStyle {
  const base = { ...DEFAULT_GROW_MESSAGE_STYLE };
  if (!raw || typeof raw !== "object") return base;
  const o = raw as Record<string, unknown>;
  const sfRaw = o.subjectFont ?? o.subject_font;
  const scRaw = o.subjectColor ?? o.subject_color;
  const sbRaw = o.subjectBold ?? o.subject_bold;
  const bfRaw = o.bodyFont ?? o.body_font;
  const bcRaw = o.bodyColor ?? o.body_color;
  const bbRaw = o.bodyBold ?? o.body_bold;

  const sf = typeof sfRaw === "string" && isFontKey(sfRaw) ? sfRaw : base.subjectFont;
  const sc = typeof scRaw === "string" && HEX_RE.test(scRaw) ? scRaw : base.subjectColor;
  const sb = Boolean(sbRaw);
  const bf = typeof bfRaw === "string" && isFontKey(bfRaw) ? bfRaw : base.bodyFont;
  const bc = typeof bcRaw === "string" && HEX_RE.test(bcRaw) ? bcRaw : base.bodyColor;
  const bb = Boolean(bbRaw);
  return {
    subjectFont: sf,
    subjectColor: sc,
    subjectBold: sb,
    bodyFont: bf,
    bodyColor: bc,
    bodyBold: bb,
  };
}

export function sanitizeGrowMessageStyleForDb(input: GrowMessageStyle): Record<string, unknown> {
  const p = parseGrowMessageStyle(input);
  return {
    subjectFont: p.subjectFont,
    subjectColor: p.subjectColor,
    subjectBold: p.subjectBold,
    bodyFont: p.bodyFont,
    bodyColor: p.bodyColor,
    bodyBold: p.bodyBold,
  };
}

export function buildInviteBodyInlineStyle(style: GrowMessageStyle): string {
  const p = parseGrowMessageStyle(style);
  const weight = p.bodyBold ? "700" : "400";
  const family = INVITE_FONT_CSS[p.bodyFont];
  return `margin:0 0 14px 0; font-family:${family}; color:${p.bodyColor}; font-weight:${weight};`;
}

/** Styled “headline” line inside HTML body (inbox subject stays plain). */
export function buildSubjectLeadInlineStyle(style: GrowMessageStyle): string {
  const p = parseGrowMessageStyle(style);
  const weight = p.subjectBold ? "700" : "600";
  const family = INVITE_FONT_CSS[p.subjectFont];
  return `margin:0 0 12px 0; font-family:${family}; color:${p.subjectColor}; font-weight:${weight}; font-size:18px; line-height:1.3;`;
}
