import SolutionPageLayout, {
  type SolutionPageContent,
} from "@/components/solutions/SolutionPageLayout";

export const metadata = {
  title: "Live Verified Review Widgets for Every Page of Your Site | Tellacity",
  description:
    "Show real, verified customer reviews directly on product pages, pricing, checkout, and marketing pages. Tellacity widgets stay in sync with your dashboard and update automatically. Start free.",
  alternates: {
    canonical: "https://tellacity.com/solutions/review-widgets",
  },
  openGraph: {
    title:
      "Live Verified Review Widgets for Every Page of Your Site | Tellacity",
    description:
      "Show real, verified customer reviews directly on product pages, pricing, checkout, and marketing pages. Tellacity widgets stay in sync with your dashboard and update automatically.",
    url: "https://tellacity.com/solutions/review-widgets",
    siteName: "Tellacity",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title:
      "Live Verified Review Widgets for Every Page of Your Site | Tellacity",
    description:
      "Live, verified review widgets for product, pricing, checkout, and marketing pages. Synced with your dashboard automatically.",
  },
};

const content: SolutionPageContent = {
  kicker: "Review Widgets",
  headline: {
    lead: "Live Verified Review Widgets",
    accent: "for Every Page of Your Site",
  },
  valueProp:
    "Display verified customer reviews directly across your storefront, product pages, landing pages, checkout flows, and marketing campaigns using Tellacity's live widget infrastructure. Every widget stays synchronised with your Tellacity dashboard automatically (review counts, trust score, recent reviews, verified badges, and moderation updates) without manual maintenance or rebuilding pages.",
  primaryCta: { label: "Start free", href: "/business/signup" },
  secondaryCta: { label: "Open dashboard", href: "/business/dashboard" },
  heroImage: {
    src: "/brand/Izabela.png",
    alt: "Tellacity review widget displayed on a customer's screen",
  },

  heroTrustStrip: [
    "Verified review feeds",
    "Real-time updates",
    "Lightweight embed scripts",
    "Brand customisation",
    "Accessible & SEO-friendly",
  ],

  problemSectionKicker: "The challenge",
  problemSectionTitle: "Why most businesses lose trust where it matters",
  problemSectionDescription:
    "Verified reviews only convert when visitors actually see them inside the buying journey. Without live, on-page trust signals, businesses lose conversions exactly where the customer is making the decision.",

  problems: [
    {
      icon: "👁️",
      title: "Visitors can't see your reviews where it matters",
      description:
        "Customers compare and decide on your product, checkout, and pricing pages, not on a third-party site. Without on-page social proof, you lose conversions exactly where you need them.",
    },
    {
      icon: "📋",
      title: "Embedding reviews usually means copy-pasting forever",
      description:
        "Manual screenshots, static HTML blocks, or hand-edited testimonials go stale the moment a new review comes in and never reflect your live reputation.",
    },
    {
      icon: "🎨",
      title: "Generic widgets break your brand",
      description:
        "Most widget libraries don't match your typography, spacing, or palette and end up looking like an ad rather than a native part of your product.",
    },
    {
      icon: "🛒",
      title: "Trust signals disappear during checkout",
      description:
        "Many businesses collect reviews successfully but fail to surface trust signals during high-conversion moments like pricing, cart, and checkout flows.",
    },
    {
      icon: "🪦",
      title: "Static testimonials lose credibility",
      description:
        "Hardcoded testimonials quickly become outdated and don't reflect current customer sentiment, recent reviews, or changing trust scores.",
    },
    {
      icon: "🧩",
      title: "Different websites create inconsistent trust experiences",
      description:
        "When reviews are embedded manually across multiple sites, brands lose consistency in messaging, styling, and review freshness.",
    },
    {
      icon: "🐢",
      title: "Most widgets aren't optimised for performance",
      description:
        "Heavy third-party scripts, bloated embeds, and poorly optimised review widgets can negatively affect page speed and user experience.",
    },
  ],

  solution: {
    title: "How Tellacity turns live reviews into on-page trust signals",
    description:
      "Every Tellacity widget reads directly from your verified review feed, so the rating, count, and most recent reviews update automatically. You configure styling once in the dashboard and ship the same lightweight, performance-friendly snippet to every site you run.",
    bullets: [
      "Multiple layouts: rating badge, floating button, sidebar, and full carousel.",
      "Theme controls for colours, radius, density, and dark/light mode.",
      "Single-tag install. Copy from the dashboard, paste into your site.",
      "Live updates: new reviews appear without rebuilding the page.",
      "Accessible markup with ARIA labels and keyboard navigation built in.",
    ],
    screenshot: {
      src: "/brand/Widgets.png",
      alt: "Tellacity review widgets shown on a website",
    },
  },

  workflow: {
    kicker: "How the widget system works",
    title: "How the widget system works",
    description:
      "Every Tellacity widget pulls from the same verified review pipeline so the rating, count, and recent reviews are always current. No redeploys, no manual sync, no stale testimonials.",
    steps: [
      {
        icon: "📥",
        title: "Reviews collected in Tellacity",
        description:
          "Verified reviews flow in from invitations, profile submissions, and authenticated review forms. Every review is tied to a real customer record, which is what makes the trust signal credible in the first place.",
      },
      {
        icon: "🛡",
        title: "Reviews verified & moderated",
        description:
          "Identity checks, proof-of-purchase signals, and policy moderation run automatically before reviews are eligible to display. Centralised moderation is what keeps the on-page trust signal consistent across every widget.",
      },
      {
        icon: "🔄",
        title: "Widget feed updates automatically",
        description:
          "Approved reviews enter the live widget feed, with the trust score, count, and recent reviews refreshing within a minute. Real-time synchronisation preserves trust and reduces stale content signals for search engines and LLMs.",
      },
      {
        icon: "🌐",
        title: "Widgets sync across all websites",
        description:
          "The same snippet on every domain, storefront, and landing page reads from the same centralised feed. Cross-site consistency is what makes your reputation citable for both buyers and AI search engines.",
      },
      {
        icon: "🛒",
        title: "Customers see live trust signals",
        description:
          "Visitors see verified social proof on product, pricing, cart, and checkout pages, exactly where decisions are made. Trust placed at the moment of decision is where it actually moves the conversion needle.",
      },
      {
        icon: "📊",
        title: "Analytics & engagement tracked",
        description:
          "Impressions, clicks, conversions, and engagement metrics flow back into the dashboard for every widget placement. A closed feedback loop tells you which placements pay off and which to retire.",
      },
    ],
  },

  featuresSectionKicker: "Built into the dashboard",
  featuresSectionTitle: "Key widget features at a glance",
  featuresSectionDescription:
    "Every widget capability below is part of the live Tellacity business dashboard and is available the moment you claim your profile. Lightweight, conversion-driven, and centralised, so you ship the same on-page trust signals across every property you run.",

  featuresImage: {
    src: "/brand/Real%20capabilities.jpeg",
    alt: "Tellacity review widgets displayed across web and mobile storefronts",
  },

  features: [
    {
      badge: "⭐",
      title: "Rating badge",
      description:
        "Compact badge showing your live trust score and verified review count.",
    },
    {
      badge: "🗂",
      title: "Review carousel",
      description:
        "Full-width carousel that rotates through your most recent verified reviews.",
    },
    {
      badge: "🪟",
      title: "Floating widget",
      description:
        "Persistent corner button that opens a panel of recent reviews on demand.",
    },
    {
      badge: "🎨",
      title: "Brand theming",
      description:
        "Colours, radius, fonts, and density configurable from the dashboard.",
    },
    {
      badge: "⚡",
      title: "Lightweight & cached",
      description:
        "Edge-cached payloads keep load times small even with heavy traffic.",
    },
    {
      badge: "🔌",
      title: "Works everywhere",
      description:
        "Plain HTML, React, Next.js, Shopify, WordPress, and custom storefronts.",
    },
    {
      badge: "🌍",
      title: "Multi-site deployment",
      description:
        "Manage widgets across multiple domains, storefronts, landing pages, and regional websites from one dashboard.",
    },
    {
      badge: "🧩",
      title: "Product-level widgets",
      description:
        "Display reviews for specific products, services, or business locations using filtered widget feeds.",
    },
    {
      badge: "📈",
      title: "Widget analytics",
      description:
        "Track impressions, engagement, clicks, and interaction performance across widget placements.",
    },
    {
      badge: "♿",
      title: "Accessibility controls",
      description:
        "Accessible markup, keyboard support, semantic structure, and screen-reader compatibility built in.",
    },
    {
      badge: "🔁",
      title: "Moderation synchronisation",
      description:
        "Widgets automatically reflect approved reviews, moderation changes, and review visibility settings.",
    },
    {
      badge: "🎛",
      title: "Centralised widget management",
      description:
        "Update branding, styling, layouts, and review rules once from the dashboard and deploy everywhere instantly.",
    },
    {
      badge: "🔍",
      title: "Review filtering",
      description:
        "Choose which reviews appear based on rating, location, product, recency, or verification status.",
    },
  ],

  verifiedTrust: {
    kicker: "Why live verified widgets matter",
    title: "Why live verified widgets matter",
    description:
      "Proof-of-purchase reviews are what earn the verified badge that visitors trust on sight. Centralised moderation is what keeps that badge meaningful by enforcing the same policy across every widget. And cross-site synchronisation is what turns those trust signals into reliable, citable data that holds up for both human buyers and AI search engines.",
    bullets: [
      "Live review synchronisation across every domain you run.",
      "Verified review signals tied to authenticated customer accounts.",
      "Centralised moderation with policy enforcement on every widget.",
      "Real-time trust visibility on product, pricing, and checkout pages.",
      "Consistent reputation display. Same data, same brand, every site.",
      "Cross-site review consistency that holds up under public scrutiny.",
    ],
    surface: "widget-preview",
  },

  trust: {
    title: "Built for scale: Widgets across high-traffic sites",
    description:
      "From single landing pages to global storefront ecosystems, Tellacity widgets deliver verified review data consistently across high-traffic environments. Every embed is performance-friendly, edge-cached, and centrally managed, so trust signals stay live without burning your page speed budget.",
    stats: [
      { value: "Live", label: "Widget feed" },
      { value: "1-tag", label: "Drop-in install" },
      { value: "Global", label: "Edge-cached delivery" },
      { value: "600K+", label: "Business profiles" },
      { value: "200+", label: "Industry categories" },
    ],
  },

  platforms: {
    kicker: "Built for modern websites",
    title: "Built for modern websites (any frontend stack)",
    description:
      "Tellacity widgets integrate cleanly into modern frontend stacks without compromising speed, accessibility, or visual consistency. The same single snippet works across stacks and ships only what each page needs.",
    frameworks: [
      { name: "HTML", icon: "🧾" },
      { name: "React", icon: "⚛" },
      { name: "Next.js", icon: "▲" },
      { name: "Shopify", icon: "🛍" },
      { name: "WooCommerce", icon: "🛒" },
      { name: "WordPress", icon: "📰" },
      { name: "Webflow", icon: "✺" },
      { name: "Wix", icon: "◆" },
      { name: "Custom stacks", icon: "🧱" },
    ],
    attributes: [
      "Async, non-blocking loading",
      "Lightweight payloads, gzipped",
      "Edge caching for low latency",
      "Responsive, mobile-first rendering",
      "Lazy loading for off-screen widgets",
      "Core Web Vitals friendly",
    ],
  },

  controlPlane: {
    kicker: "One dashboard, every widget",
    title: "One dashboard, every widget",
    description:
      "All Tellacity widgets share one centralised control plane. Update branding, layouts, review rules, or moderation policies in the dashboard and every embed on every site reflects the change in real time. No redeploys, no per-site code changes, no drift.",
    tagline: "Configure once. Deploy everywhere.",
    capabilities: [
      {
        icon: "🎛",
        title: "Dashboard-controlled layouts",
        description:
          "Choose layout, density, and behaviour per placement from a single configuration panel.",
      },
      {
        icon: "🎨",
        title: "Theme synchronisation",
        description:
          "Brand colour, typography, radius, and dark/light mode are saved once and pushed to every widget.",
      },
      {
        icon: "⚙️",
        title: "Widget-level settings",
        description:
          "Per-widget overrides for rating thresholds, recency, languages, and review counts when you need them.",
      },
      {
        icon: "🔄",
        title: "Live updates",
        description:
          "Configuration changes propagate to live widgets immediately, with no redeploys and no cache busting.",
      },
      {
        icon: "🛡",
        title: "Moderation sync",
        description:
          "Reviews removed or hidden from your dashboard disappear from every widget within seconds.",
      },
      {
        icon: "🌐",
        title: "Deployment consistency",
        description:
          "The same snippet on every page guarantees identical data, identical branding, identical performance.",
      },
      {
        icon: "🏢",
        title: "Cross-site management",
        description:
          "Manage widgets across regions, brands, and subsidiaries from one tenant with scoped permissions.",
      },
    ],
  },

  outcomes: {
    kicker: "Designed for conversion",
    title: "Designed for conversion: Trust at the point of decision",
    description:
      "Trust works best when customers see it during decision-making moments. Tellacity widgets place verified customer feedback directly inside product pages, pricing flows, and conversion paths, where on-page reputation has the highest conversion-driven impact.",
    items: [
      {
        icon: "💳",
        title: "Increase buyer confidence",
        description:
          "Verified reviews next to the buy button reassure visitors at the moment they commit.",
      },
      {
        icon: "🧭",
        title: "Reduce hesitation in checkout",
        description:
          "Trust badges and recent reviews on cart and checkout pages reduce drop-off and recover indecision.",
      },
      {
        icon: "🧱",
        title: "Strengthen product trust",
        description:
          "Product-level widgets surface the reviews that matter for the exact item being considered.",
      },
      {
        icon: "📈",
        title: "Improve conversion signals",
        description:
          "Impression and engagement analytics show which placements move the needle on conversion.",
      },
      {
        icon: "👥",
        title: "Reinforce social proof",
        description:
          "Real, verified customer voices repeated across the journey carry more weight than any marketing copy.",
      },
      {
        icon: "🔎",
        title: "Surface real customer experience",
        description:
          "Live, recent, authenticated reviews, not stale testimonials picked years ago.",
      },
    ],
  },

  related: [
    {
      title: "Review Invitations",
      href: "/solutions/review-invitations",
      description:
        "Fill your widgets with fresh, verified reviews from every customer.",
    },
    {
      title: "Business Analytics",
      href: "/solutions/business-analytics",
      description:
        "See how widgets influence engagement and conversion across pages.",
    },
    {
      title: "Reputation Management",
      href: "/solutions/reputation-management",
      description:
        "Reply, moderate, and protect the reviews that appear in your widget.",
    },
    {
      title: "Photo Uploads",
      href: "/solutions/photo-uploads",
      description:
        "Surface product-level reviews and verified customer photos in the same widget.",
    },
  ],

  faqSectionTitle: "Common questions about review widgets",
  faqSectionDescription:
    "Short answers to the most common questions about Tellacity's live, verified review widgets and how they integrate into modern websites.",

  faqs: [
    {
      question: "How do I install a Tellacity widget on my website?",
      answer:
        "Copy a single line of JavaScript from the dashboard and paste it into your site's HTML before the closing </body> tag. The widget renders on page load with no build step, no framework lock-in, and no server changes.",
    },
    {
      question: "Which widget layouts are available?",
      answer:
        "Floating trust badge, full grid carousel, sidebar review list, hero star summary, and an embedded product-page block. Every layout is mobile-responsive and configurable from the dashboard.",
    },
    {
      question: "Do widgets update in real time?",
      answer:
        "Yes. New reviews appear in the widget within about a minute of being published, so you never need to redeploy your site to refresh content.",
    },
    {
      question: "Will widgets slow down my website?",
      answer:
        "No. The script is loaded asynchronously and is a few kilobytes gzipped. It doesn't block page render, isn't on the critical path, and is designed to keep Core Web Vitals in the green.",
    },
    {
      question: "Can I match the widget to my brand?",
      answer:
        "Yes. Brand colour, accent, fonts, border radius, language, and dark or light mode are all configurable from the dashboard. No CSS overrides required.",
    },
    {
      question: "Does it work on Shopify, WordPress, Webflow, and custom frameworks?",
      answer:
        "Yes. The same snippet works on Shopify, WordPress, Webflow, Wix, Next.js, Astro, and any plain HTML site. Platform-specific helpers are available where the host supports them.",
    },
    {
      question: "Can I display only verified reviews?",
      answer:
        "Yes. Widgets can be configured to show only verified reviews (those tied to authenticated customer accounts or proof-of-purchase signals) so visitors see only the most credible feedback.",
    },
    {
      question: "Can widgets be filtered by product or location?",
      answer:
        "Yes. Use product-level widgets to show reviews for a specific SKU, service, or branch. Filters support rating thresholds, recency windows, languages, and verification status.",
    },
    {
      question: "Can I customise colours, fonts, and layouts?",
      answer:
        "Yes. Brand colour, accent, fonts, density, border radius, and layout variant are all configurable from the dashboard with no CSS or theme overrides required.",
    },
    {
      question: "Do widgets update automatically?",
      answer:
        "Yes. The widget feed pulls from the same verified review pipeline as your dashboard. New reviews, replies, moderation changes, and theme updates appear without any redeploy.",
    },
    {
      question: "Will widgets affect page performance?",
      answer:
        "No. Widgets are async, lazy-loaded, edge-cached, and gzipped to a few kilobytes. They are designed to be Core Web Vitals friendly and not block render or layout.",
    },
    {
      question: "Can I manage widgets across multiple websites?",
      answer:
        "Yes. Multi-site deployment lets you manage widgets across domains, storefronts, regional sites, and landing pages from one dashboard with scoped permissions.",
    },
    {
      question: "Are widgets mobile responsive?",
      answer:
        "Yes. Every widget layout is mobile-first and adapts to small screens, touch interactions, and constrained connections.",
    },
    {
      question: "Can Tellacity widgets support dark mode?",
      answer:
        "Yes. Dark and light modes are both supported, with optional automatic adaptation to the host site's colour scheme.",
    },
    {
      question: "Can I control which reviews appear publicly?",
      answer:
        "Yes. From the dashboard you can hide, surface, or filter reviews based on visibility rules, rating thresholds, recency, or moderation status. Changes propagate to every widget immediately.",
    },
    {
      question: "Are widgets accessible for screen readers?",
      answer:
        "Yes. Widgets ship with accessible markup, ARIA labels, semantic headings, focusable controls, and full keyboard navigation. They are designed to meet WCAG 2.1 AA expectations.",
    },
  ],
};

const softwareJsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Tellacity Review Widgets",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  description:
    "Show live, verified customer reviews directly on storefronts, product pages, pricing, checkout, and marketing pages using lightweight, embeddable widgets.",
  brand: { "@type": "Organization", name: "Tellacity" },
  url: "https://tellacity.com/solutions/review-widgets",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
    availability: "https://schema.org/InStock",
    url: "https://tellacity.com/business/signup",
  },
};

const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    {
      "@type": "ListItem",
      position: 1,
      name: "Home",
      item: "https://tellacity.com/",
    },
    {
      "@type": "ListItem",
      position: 2,
      name: "Solutions",
      item: "https://tellacity.com/solutions",
    },
    {
      "@type": "ListItem",
      position: 3,
      name: "Review Widgets",
      item: "https://tellacity.com/solutions/review-widgets",
    },
  ],
};

const howToJsonLd = {
  "@context": "https://schema.org",
  "@type": "HowTo",
  name: "How Tellacity review widgets turn verified reviews into live trust signals",
  description:
    "The six-step pipeline that turns verified customer reviews into live, on-page trust signals across every Tellacity widget placement.",
  totalTime: "PT5M",
  step: [
    {
      "@type": "HowToStep",
      position: 1,
      name: "Reviews collected in Tellacity",
      text: "Verified reviews flow in from invitations, profile submissions, and authenticated review forms. Every review is tied to a real customer record.",
    },
    {
      "@type": "HowToStep",
      position: 2,
      name: "Reviews verified and moderated",
      text: "Identity checks, proof-of-purchase signals, and policy moderation run automatically before reviews are eligible to display in a widget.",
    },
    {
      "@type": "HowToStep",
      position: 3,
      name: "Widget feed updates automatically",
      text: "Approved reviews enter the live widget feed; trust score, count, and recent reviews refresh within a minute, with no redeploys.",
    },
    {
      "@type": "HowToStep",
      position: 4,
      name: "Widgets sync across all websites",
      text: "The same snippet on every domain, storefront, and landing page reads from the same centralised feed, so trust signals stay consistent everywhere.",
    },
    {
      "@type": "HowToStep",
      position: 5,
      name: "Customers see live trust signals",
      text: "Visitors see verified social proof on product, pricing, cart, and checkout pages, exactly where buying decisions are made.",
    },
    {
      "@type": "HowToStep",
      position: 6,
      name: "Analytics and engagement tracked",
      text: "Impressions, clicks, conversions, and engagement metrics flow back into the Tellacity dashboard for every widget placement.",
    },
  ],
};

export default function ReviewWidgetsSolutionPage() {
  return (
    <SolutionPageLayout
      content={content}
      jsonLd={
        <>
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify(softwareJsonLd),
            }}
          />
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify(breadcrumbJsonLd),
            }}
          />
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(howToJsonLd) }}
          />
        </>
      }
    />
  );
}
