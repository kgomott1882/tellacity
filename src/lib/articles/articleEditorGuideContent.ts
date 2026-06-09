import type { ArticleContentType } from "./types";

export type ArticleEditorGuideSection = {
  title: string;
  description?: string;
  items: string[];
  ordered?: boolean;
};

export type ArticleEditorGuideStep = {
  title: string;
  prompt: string;
  starters: string[];
  /** Where this step fits in the editor, if applicable. */
  editorHint?: string;
};

export type ArticleEditorGuideExample = {
  title: string;
  paragraphs: string[];
};

export type ArticleEditorGuideAdvancedSection = {
  title: string;
  items: string[];
};

export type ArticleEditorGuideContent = {
  heading: string;
  intro: string;
  sections?: ArticleEditorGuideSection[];
  guidedSteps?: ArticleEditorGuideStep[];
  visualsNote?: string;
  example?: ArticleEditorGuideExample;
  advancedSeo?: ArticleEditorGuideAdvancedSection;
};

export const ARTICLE_EDITOR_GUIDES: Record<ArticleContentType, ArticleEditorGuideContent> = {
  article: {
    heading: "How to write a blog post people actually find helpful",
    intro:
      "Good formatting matters, but usefulness comes first. Pick one topic, answer real questions, and make it easy for readers to skim, trust, and take action.",
    sections: [
      {
        title: "Structure and clarity",
        items: [
          "Start with a strong title that clearly matches what the article is about.",
          "Use one H1 only — that's your title. Break the rest into logical H2 and H3 headings.",
          "For longer posts, add a short table of contents so readers can jump to what they need.",
          "End with a clear summary and one call-to-action so people know what to do next.",
        ],
      },
      {
        title: "Make it useful and credible",
        items: [
          "Link to related content on your site so readers can go deeper.",
          "Add external links or references to credible sources when they support your points.",
          "Use images, screenshots, charts, or videos when they help explain — not just decorate.",
        ],
      },
    ],
    advancedSeo: {
      title: "SEO basics (optional)",
      items: [
        "Set a canonical URL, meta title, and meta description that match what's on the page.",
        "Show the author and publish date so readers know who wrote it and when it was updated.",
        "Structured data (such as BlogPosting) is helpful when it reflects real on-page content.",
      ],
    },
  },
  case_study: {
    heading: "How to write a strong case study",
    intro:
      "A good case study reads like a before-and-after story — who you helped, what was going wrong, what you did, and what changed. Write it the way you'd explain it to a colleague, with real results wherever you can.",
    guidedSteps: [
      {
        title: "Client context",
        prompt: "Set the scene. Who is the client, what do they do, and why did they come to you?",
        starters: [
          "Our client is a…",
          "They serve… and came to us because…",
          "At the time, they were…",
        ],
        editorHint: "Use the Client industry field or open your article with a short intro paragraph.",
      },
      {
        title: "The challenge",
        prompt: "Describe the problem in everyday language. What was frustrating, slow, or costly?",
        starters: [
          "The client was struggling with…",
          "Before we got involved, their team faced…",
          "The main pain point was…",
        ],
        editorHint: "Add this to the Challenge field or as an H2 section in your article.",
      },
      {
        title: "What we did",
        prompt: "Walk through your approach — the key steps, tools, or changes you made.",
        starters: [
          "We started by…",
          "We implemented…",
          "Our team worked with them to…",
        ],
        editorHint: "Use the Solution field and expand with detail in the body.",
      },
      {
        title: "Results and impact",
        prompt: "Share measurable outcomes. Numbers make the story believable.",
        starters: [
          "As a result, the team saw…",
          "Within three months, they achieved…",
          "This led to a…% improvement in…",
        ],
        editorHint: "Put your headline numbers in the Results field and highlight them in the article.",
      },
      {
        title: "Quote or testimonial",
        prompt: "Let the client speak in their own words — even one sentence builds trust.",
        starters: [
          "\"Working with [company] helped us…\"",
          "\"We finally felt confident that…\"",
          "\"The biggest change was…\"",
        ],
        editorHint: "Add a pull-quote or blockquote in your article content.",
      },
      {
        title: "Final CTA",
        prompt: "Tell the reader what to do next if they want similar results.",
        starters: [
          "If you're facing something similar,…",
          "Ready to see what this could look like for your team?",
          "Get in touch to…",
        ],
        editorHint: "End your article with a clear next step.",
      },
    ],
    visualsNote:
      "Screenshots, charts, or photos can strengthen your story when you have something real to show — a before/after, dashboard, or team in action.",
    example: {
      title: "Example case study (short)",
      paragraphs: [
        "Brightline Logistics is a regional delivery company with 120 drivers. They were losing repeat customers because late deliveries and poor communication eroded trust.",
        "The challenge was clear: dispatchers spent hours on manual follow-ups, and customers rarely knew when a package would arrive.",
        "We implemented automated delivery notifications and a live tracking page tied to their existing routes. Drivers received simpler daily manifests on mobile.",
        "Within 90 days, on-time deliveries rose from 82% to 96%, customer complaints dropped by 41%, and the operations team saved roughly 12 hours per week.",
        "\"We finally had one place to see what was happening on the road,\" said their Operations Director. \"Customers stopped calling to ask where their order was.\"",
        "If delayed deliveries are hurting your reputation, book a short walkthrough to see how a similar setup could work for your fleet.",
      ],
    },
  },
};

/** Placeholders for case study sidebar fields — aligned with guided steps. */
export const CASE_STUDY_FIELD_PLACEHOLDERS = {
  clientIndustry:
    "e.g. Our client is a mid-sized retail chain serving…",
  challenge:
    "e.g. The client was struggling with… Before we stepped in, their team faced…",
  solution:
    "e.g. We implemented… Our team worked with them to…",
  results:
    "e.g. As a result, the team saw… Within three months, they achieved…",
} as const;
