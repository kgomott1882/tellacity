/** Matches public article page: `max-w-3xl` + horizontal padding. */
export const ARTICLE_CONTENT_MAX_WIDTH_PX = 768;
export const ARTICLE_CONTENT_HORIZONTAL_PADDING_PX = 24;
export const ARTICLE_CONTENT_INNER_WIDTH_PX =
  ARTICLE_CONTENT_MAX_WIDTH_PX - ARTICLE_CONTENT_HORIZONTAL_PADDING_PX * 2;

/** A4 page height at ~96 DPI — used for min page height in the editor. */
export const ARTICLE_PAGE_MIN_HEIGHT_PX = 1123;

export const ARTICLE_PAGE_CLASS =
  "mx-auto w-full max-w-3xl bg-white px-6 shadow-[0_2px_8px_rgba(0,0,0,0.08),0_12px_40px_rgba(0,0,0,0.06)]";

export const ARTICLE_WORKSPACE_CLASS = "bg-[#D8D5CF]";
