import type {
  FeatureAccent,
  FeatureIconType,
  ForBusinessFeature,
} from "@/lib/forBusinessFeatureTypes";

export type { FeatureAccent, FeatureIconType, ForBusinessFeature };

export const FOR_BUSINESS_FEATURES: ForBusinessFeature[] = [
  {
    slug: "automated-review-collection",
    title: "Automated Review Collection",
    copy: "Collect verified customer feedback through email, QR codes, and automated workflows.",
    detail:
      "Send review requests after purchases or appointments via email and SMS, share QR codes in-store, and trigger requests from your existing workflows so collection happens consistently without manual follow-up.",
    image: "/brand/Branded_review_requests.jpeg",
    icon: "send",
    accent: "teal",
    eyebrow: "Collection automation",
    metrics: [
      { value: "3+", label: "Invite channels" },
      { value: "Auto", label: "Workflow triggers" },
      { value: "Free", label: "To get started" },
    ],
    outcome:
      "Stop chasing customers for reviews. Let timely, branded invites do the work across every touchpoint.",
    metaDescription:
      "Automate Tellacity review requests by email, SMS, and QR codes. Trigger invites after purchases or appointments without manual follow-up.",
    lead:
      "Turn every completed interaction into a chance for verified feedback. Tellacity helps you request reviews at the right moment by email, SMS, QR code, or connected workflow, so collection scales with your business instead of relying on one-off reminders.",
    sections: [
      {
        title: "Email review invitations",
        body:
          "Send branded review invites from your dashboard with custom subject lines and messaging on Grow and above. Track who was invited, who opened, and who completed a review.",
        bullets: [
          "Bulk or individual invites from your customer list",
          "Custom email templates with your wording and brand voice",
          "Automatic reminders for customers who have not responded",
        ],
      },
      {
        title: "QR codes and in-person collection",
        body:
          "Place QR codes at checkout, on receipts, or in follow-up materials so customers can leave a review on the spot, ideal for retail, hospitality, and service visits.",
        bullets: [
          "Downloadable QR assets tied to your business profile",
          "Works for walk-in customers without an email address",
          "Same verified review flow as email invitations",
        ],
      },
      {
        title: "Workflow and integration triggers",
        body:
          "Connect Tellacity to tools you already use so review requests fire automatically after orders, appointments, or support tickets, with no copy-pasting customer details.",
        bullets: [
          "Shopify, WooCommerce, and Zapier connections",
          "Trigger invites after fulfilment or service completion",
          "Keep collection consistent across locations and teams",
        ],
      },
    ],
    highlights: [
      "Fewer manual follow-ups for your team",
      "Higher response rates with timely asks",
      "One verified pipeline for every channel",
    ],
    relatedLinks: [
      { href: "/business/dashboard/get-reviews/overview", label: "Send review invites" },
      { href: "/pricing", label: "Plans & pricing" },
      { href: "/for-business", label: "Reputation platform overview" },
    ],
  },
  {
    slug: "verified-credible-feedback",
    title: "Verified & Credible Feedback",
    copy: "Ensure feedback is attributable, accountable, and aligned with transparent moderation standards.",
    detail:
      "Verification and moderation standards help ensure reviews come from real customers and meet our fairness guidelines, making feedback more dependable for you and future buyers.",
    image: "/brand/Man_inspired_by_picture.jpeg",
    icon: "badgeCheck",
    accent: "forest",
    eyebrow: "Trust & verification",
    metrics: [
      { value: "OTP", label: "Verified submissions" },
      { value: "Fair", label: "Moderation policy" },
      { value: "Open", label: "Right of reply" },
    ],
    outcome:
      "Prospects read reviews with confidence because every piece of feedback is attributable, moderated fairly, and open to your response.",
    metaDescription:
      "Tellacity verification and moderation keeps reviews attributable and fair. Real customers, transparent standards, no pay-to-hide.",
    lead:
      "Trust starts with knowing feedback is real. Tellacity ties reviews to verified customer interactions, applies published moderation standards, and gives businesses a fair right of reply, so prospects can rely on what they read.",
    sections: [
      {
        title: "Verification at submission",
        body:
          "Reviewers confirm their identity through email verification and invite links tied to real transactions or invitations. That reduces anonymous noise and makes feedback accountable.",
        bullets: [
          "OTP verification for public review submissions",
          "Invite tokens linked to customers you already served",
          "Clear attribution on every published review",
        ],
      },
      {
        title: "Fair moderation standards",
        body:
          "Our team and automated checks enforce reviewer and business guidelines. Reviews that violate policy are flagged or hidden, not because a business paid, but because the content breaks published rules.",
        bullets: [
          "Published reviewer and business guidelines",
          "No pay-to-hide or paid removal of legitimate reviews",
          "Consistent treatment across all businesses on Tellacity",
        ],
      },
      {
        title: "Right of reply",
        body:
          "When feedback raises questions, you can respond publicly or follow up privately. Transparent replies show future customers how you handle praise and concerns alike.",
        bullets: [
          "Public replies visible on your profile",
          "Demonstrate responsiveness without erasing criticism",
          "Build long-term credibility through open dialogue",
        ],
      },
    ],
    highlights: [
      "Reviews tied to real customers",
      "Transparent, published policies",
      "Fair treatment for businesses and buyers",
    ],
    relatedLinks: [
      { href: "/reviewer-guidelines", label: "Reviewer guidelines" },
      { href: "/business-guidelines", label: "Business guidelines" },
      { href: "/safety-trust", label: "Safety & trust" },
    ],
  },
  {
    slug: "reputation-management",
    title: "Reputation Management",
    copy:
      "Monitor, respond to, and manage reviews from one dashboard, plus a structured public profile with photos, business details, and trust signals.",
    detail:
      "Centralise review monitoring, response, and your public Tellacity profile in one platform. Your team addresses feedback quickly while prospects find verified reviews, photos, and business details in one discoverable home.",
    image: "/brand/woman%20on%20laptop.png",
    icon: "shield",
    accent: "teal",
    eyebrow: "Reputation & profile",
    metrics: [
      { value: "1", label: "Unified workspace" },
      { value: "SEO", label: "Profile URLs" },
      { value: "Team", label: "Collaboration ready" },
    ],
    outcome:
      "Every review, reply, and trust signal lives in one workspace and one public profile, so your team moves faster and prospects see a complete picture of your business.",
    metaDescription:
      "Manage Tellacity reviews, responses, and your public business profile from one dashboard. Photos, trust signals, and verified feedback in one place.",
    lead:
      "Your reputation is a living asset, and your Tellacity profile is its public home. Centralise every review, notification, and reply in one workspace while prospects discover verified feedback, photos, business details, and trust signals on a structured profile built to compound over time.",
    sections: [
      {
        title: "Unified review inbox",
        body:
          "See new reviews as they arrive, filter by rating or status, and prioritise responses that need attention without switching between inboxes or spreadsheets.",
        bullets: [
          "Email notifications when new reviews publish",
          "Dashboard view of recent and historical feedback",
          "Activity log for team accountability",
        ],
      },
      {
        title: "Public and private responses",
        body:
          "Reply on your public profile for transparency, or reach out when a situation needs a direct conversation. Either way, customers see you are engaged.",
        bullets: [
          "Public replies on your Tellacity business profile",
          "Consistent tone guidelines for your team",
          "Faster resolution of recurring issues",
        ],
      },
      {
        title: "Public business profile",
        body:
          "Claim and customise your profile with logo, description, category, location, and contact details. Every element supports discovery and conversion when prospects research your brand.",
        bullets: [
          "SEO-friendly profile URLs on tellacity.com",
          "Consistent branding across widgets and profile",
          "Free to claim; grow with optional paid features",
        ],
      },
      {
        title: "Photos and visual proof",
        body:
          "Upload and organise business photos from your dashboard, from team and location shots to products or work samples, so visitors see the real business behind the reviews.",
        bullets: [
          "Photo uploads from your dashboard",
          "Product and service imagery on your profile",
          "Visual trust alongside written reviews",
        ],
      },
      {
        title: "Reputation at scale",
        body:
          "Growing and multi-location businesses use the same system to monitor feedback across brands or branches, with plan limits that scale as you do.",
        bullets: [
          "Team access on Premium and Elite plans",
          "One profile per location or brand",
          "Policies that apply fairly everywhere you operate",
        ],
      },
    ],
    highlights: [
      "Respond faster to new feedback",
      "One canonical home for trust signals",
      "Photos, reviews, and replies together",
    ],
    relatedLinks: [
      { href: "/business/dashboard", label: "Business dashboard" },
      { href: "/pricing", label: "Team & plan limits" },
      { href: "/for-business/features/blogs-case-studies-publishing", label: "Blogs & case studies" },
    ],
  },
  {
    slug: "trust-distribution-widgets",
    title: "Trust Distribution Widgets",
    copy: "Showcase verified feedback across your website and marketing channels.",
    detail:
      "Embed verified ratings and reviews on your website, landing pages, and emails so prospects see credible social proof wherever they evaluate your business.",
    image: "/brand/Widgets.png",
    icon: "globe",
    accent: "forest",
    eyebrow: "Social proof distribution",
    metrics: [
      { value: "Live", label: "Widget sync" },
      { value: "Any", label: "Site builder" },
      { value: "Always", label: "Up to date" },
    ],
    outcome:
      "Put verified ratings and fresh reviews where decisions happen: on your site, in campaigns, and across every marketing channel.",
    metaDescription:
      "Embed Tellacity trust widgets on your website and landing pages. Show verified ratings and reviews where prospects decide.",
    lead:
      "Your best reviews should not live in only one place. Tellacity widgets pull verified ratings and recent feedback into your website, landing pages, and campaigns, so social proof appears exactly where visitors are deciding whether to trust you.",
    sections: [
      {
        title: "Embeddable review widgets",
        body:
          "Add a lightweight script or snippet to your site and display your live Tellacity rating, review count, and selected testimonials without manual updates.",
        bullets: [
          "Carousel, grid, and badge layout options",
          "Always synced with your Tellacity profile",
          "Mobile-friendly embeds for any site builder",
        ],
      },
      {
        title: "Email and campaign use",
        body:
          "Include trust signals in newsletters and sales emails so recipients see verified proof before they click through to your offer.",
        bullets: [
          "Shareable profile and widget links",
          "Consistent branding with your public profile",
          "Credibility at every marketing touchpoint",
        ],
      },
      {
        title: "Structured trust for search",
        body:
          "Public profiles and widgets reinforce consistent trust signals. Where applicable, structured data helps search systems understand your ratings alongside your on-site proof.",
        bullets: [
          "Profile pages designed for discovery",
          "Aggregate rating visible on embeds",
          "Results depend on your site and implementation",
        ],
      },
    ],
    highlights: [
      "Social proof on your own domain",
      "No manual copy-paste of reviews",
      "Widgets stay current automatically",
    ],
    relatedLinks: [
      { href: "/business/dashboard/integrations", label: "Widgets & integrations" },
      { href: "/pricing", label: "Widget plan limits" },
      { href: "/for-business", label: "Full platform tour" },
    ],
  },
  {
    slug: "performance-insight-analytics",
    title: "Performance & Insight Analytics",
    copy: "Understand trends, performance, and feedback patterns in one central dashboard.",
    detail:
      "Track rating trends, review volume, response times, and recurring themes so you can spot issues early and measure how reputation performance improves over time.",
    image: "/brand/Analytics%20PC.jpeg",
    icon: "barChart2",
    accent: "teal",
    eyebrow: "Performance intelligence",
    metrics: [
      { value: "Trends", label: "Rating history" },
      { value: "Speed", label: "Response tracking" },
      { value: "Themes", label: "Feedback patterns" },
    ],
    outcome:
      "Turn review volume into actionable insight. Spot dips early, measure improvement, and align teams around what customers actually say.",
    metaDescription:
      "Tellacity analytics: rating trends, review volume, response times, and feedback themes in one dashboard.",
    lead:
      "Reputation is measurable. Tellacity analytics show how ratings, volume, and response behaviour change over time, so you can spot issues early, celebrate improvement, and tie customer feedback to business decisions.",
    sections: [
      {
        title: "Rating and volume trends",
        body:
          "See how your average rating and review count move week over week. Compare periods to understand whether campaigns, seasonality, or operational changes are affecting perception.",
        bullets: [
          "Historical charts in your dashboard",
          "Breakdowns by time range",
          "Export-friendly summaries for reporting",
        ],
      },
      {
        title: "Response performance",
        body:
          "Track how quickly your team replies to new reviews. Faster, thoughtful responses correlate with stronger trust signals for future visitors.",
        bullets: [
          "Visibility into unanswered reviews",
          "Team workflows on higher plans",
          "Benchmark your own improvement over time",
        ],
      },
      {
        title: "Themes and recurring feedback",
        body:
          "Identify topics that appear again and again, like shipping, support, or product quality, so product and operations teams can act on what customers actually say.",
        bullets: [
          "Surface patterns from review text",
          "Inform training and process changes",
          "Close the loop between feedback and action",
        ],
      },
    ],
    highlights: [
      "Data-backed reputation decisions",
      "Early warning on emerging issues",
      "Proof that improvements are working",
    ],
    relatedLinks: [
      { href: "/business/dashboard/analytics/performance", label: "Performance analytics" },
      { href: "/pricing", label: "Analytics by plan" },
      { href: "/for-business", label: "Platform capabilities" },
    ],
  },
  {
    slug: "blogs-case-studies-publishing",
    title: "Blogs & Case Study Publishing",
    copy:
      "Publish industry blogs and client case studies from your dashboard, reviewed, attributed to your business, and live on your public profile.",
    detail:
      "Share expertise beyond star ratings. Tellacity gives verified businesses a full editor for blogs and case studies, with quality review before publish, business attribution, and discoverable content on your profile.",
    image: "/brand/Man_writing_in_travel_journal.jpeg",
    icon: "fileText",
    accent: "teal",
    eyebrow: "Content publishing",
    metrics: [
      { value: "Blogs", label: "Industry insights" },
      { value: "Cases", label: "Client outcomes" },
      { value: "Grow+", label: "Monthly credits" },
    ],
    outcome:
      "Show prospects how you think and what you deliver with long-form blogs and case studies that compound trust alongside your verified reviews.",
    metaDescription:
      "Publish Tellacity blogs and case studies from your business dashboard. Editorial review, business attribution, and live content on your public profile.",
    lead:
      "Reviews prove what customers say; blogs and case studies prove what you know. Tellacity lets verified businesses publish industry insights and documented client outcomes from one dashboard, with editorial review, featured images, and a permanent home on your public profile.",
    sections: [
      {
        title: "Blog and case study editor",
        body:
          "Write in a WordPress-style editor with headings, anchor links, featured images, and dedicated case study fields for client context, challenge, solution, and results.",
        bullets: [
          "Rich text editor with formatting and anchor links",
          "Case study templates with structured outcome fields",
          "Featured images and previews before you submit",
        ],
      },
      {
        title: "Tellacity review before publish",
        body:
          "Every submission is reviewed against Business Guidelines, including link rules, attribution, and quality standards, so published content stays credible for readers and fair across the platform.",
        bullets: [
          "Link validation and policy checks before going live",
          "Free plans can save drafts; Grow and above include monthly credits",
          "Clear feedback if revisions are needed",
        ],
      },
      {
        title: "Live on your public profile",
        body:
          "Approved articles appear on your Tellacity business profile with business attribution, optional author byline, related content suggestions, and social sharing, keeping visitors on your trust hub longer.",
        bullets: [
          "Discoverable on tellacity.com/articles and your profile",
          "Related articles keep readers exploring your expertise",
          "Shareable links for email, social, and sales follow-up",
        ],
      },
    ],
    highlights: [
      "Thought leadership beside verified reviews",
      "Editorial quality without a separate CMS",
      "Content that compounds profile authority",
    ],
    relatedLinks: [
      { href: "/articles", label: "Browse published articles" },
      { href: "/business-guidelines", label: "Blogs & case study guidelines" },
      { href: "/pricing", label: "Plans with article credits" },
    ],
  },
];

/** Card fields used on /for-business grid (includes slug for links). */
export const FEATURES = FOR_BUSINESS_FEATURES.map(
  ({ slug, title, copy, detail, image, icon, accent }) => ({
    slug,
    title,
    copy,
    detail,
    image,
    icon,
    accent,
  }),
);

export const FEATURE_SLUGS = FOR_BUSINESS_FEATURES.map((f) => f.slug);

export function getFeatureBySlug(slug: string): ForBusinessFeature | undefined {
  const normalized = slug.trim().toLowerCase();
  return FOR_BUSINESS_FEATURES.find((f) => f.slug === normalized);
}

export function getOtherFeatures(slug: string, limit = 3): ForBusinessFeature[] {
  const normalized = slug.trim().toLowerCase();
  return FOR_BUSINESS_FEATURES.filter((f) => f.slug !== normalized).slice(0, limit);
}

export function featureDetailHref(slug: string): string {
  return `/for-business/features/${slug}`;
}
