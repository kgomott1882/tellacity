import SolutionPageLayout, {
  type SolutionPageContent,
} from "@/components/solutions/SolutionPageLayout";

export const metadata = {
  title:
    "Review Widgets | Verified Review Display Infrastructure | Tellacity",
  description:
    "Tellacity Review Widgets are a live verified-review display layer for modern websites. Embed real customer reviews on product, pricing, checkout, and landing pages with one snippet — synchronised with your Tellacity dashboard, accessible, SEO-friendly, and built for performance.",
  alternates: {
    canonical: "https://tellacity.com/solutions/review-widgets",
  },
  openGraph: {
    title: "Review Widgets | Tellacity",
    description:
      "Live verified-review display infrastructure for modern websites — one snippet, multiple layouts, brand-matched, accessible, real-time.",
    url: "https://tellacity.com/solutions/review-widgets",
    siteName: "Tellacity",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Review Widgets | Tellacity",
    description:
      "Verified-review display infrastructure for modern websites and storefronts.",
  },
};

const content: SolutionPageContent = {
  kicker: "Review Widgets",
  headline: {
    lead: "Show real trust",
    accent: "on every page of your site.",
  },
  valueProp:
    "Display verified customer reviews directly across your storefront, product pages, landing pages, checkout flows, and marketing campaigns using Tellacity's live widget infrastructure. Every widget stays synchronised with your Tellacity dashboard automatically — including review counts, trust score, recent reviews, verified badges, and moderation updates — without manual maintenance or rebuilding pages.",
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

  problems: [
    {
      title: "Visitors can't see your reviews where it matters",
      description:
        "Customers compare and decide on your product, checkout, and pricing pages — not on a third-party site. Without on-page social proof, you lose conversions exactly where you need them.",
    },
    {
      title: "Embedding reviews usually means copy-pasting forever",
      description:
        "Manual screenshots, static HTML blocks, or hand-edited testimonials go stale the moment a new review comes in and never reflect your live reputation.",
    },
    {
      title: "Generic widgets break your brand",
      description:
        "Most widget libraries don't match your typography, spacing, or palette and end up looking like an ad rather than a native part of your product.",
    },
    {
      title: "Trust signals disappear during checkout",
      description:
        "Many businesses collect reviews successfully but fail to surface trust signals during high-conversion moments like pricing, cart, and checkout flows.",
    },
    {
      title: "Static testimonials lose credibility",
      description:
        "Hardcoded testimonials quickly become outdated and don't reflect current customer sentiment, recent reviews, or changing trust scores.",
    },
    {
      title: "Different websites create inconsistent trust experiences",
      description:
        "When reviews are embedded manually across multiple sites, brands lose consistency in messaging, styling, and review freshness.",
    },
    {
      title: "Most widgets aren't optimised for performance",
      description:
        "Heavy third-party scripts, bloated embeds, and poorly optimised review widgets can negatively affect page speed and user experience.",
    },
  ],

  solution: {
    title: "Embeddable widgets that stay in sync with your dashboard.",
    description:
      "Every Tellacity widget reads directly from your verified review feed, so the rating, count, and most recent reviews update automatically. You configure styling once in the dashboard and ship the same lightweight snippet to every site you run.",
    bullets: [
      "Multiple layouts: rating badge, floating button, sidebar, and full carousel.",
      "Theme controls for colours, radius, density, and dark/light mode.",
      "Single-tag install — copy from the dashboard, paste into your site.",
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
    title: "From verified review to live trust signal — automatically.",
    description:
      "Every Tellacity widget pulls from the same verified review pipeline so the rating, count, and recent reviews are always current. No redeploys, no manual sync, no stale testimonials.",
    steps: [
      {
        icon: "📥",
        title: "Reviews collected in Tellacity",
        description:
          "Verified reviews flow in from invitations, profile submissions, and authenticated review forms — all tied to a customer record.",
      },
      {
        icon: "🛡",
        title: "Reviews verified & moderated",
        description:
          "Identity checks, proof-of-purchase signals, and policy moderation run automatically before reviews are eligible to display.",
      },
      {
        icon: "🔄",
        title: "Widget feed updates automatically",
        description:
          "Approved reviews enter the live widget feed, with the trust score, count, and recent reviews refreshing within a minute.",
      },
      {
        icon: "🌐",
        title: "Widgets sync across all websites",
        description:
          "The same snippet on every domain, storefront, and landing page reads from the same feed — so trust signals stay consistent.",
      },
      {
        icon: "🛒",
        title: "Customers see live trust signals",
        description:
          "Visitors see verified social proof on product, pricing, cart, and checkout pages — exactly where decisions are made.",
      },
      {
        icon: "📊",
        title: "Analytics & engagement tracked",
        description:
          "Impressions, clicks, conversions, and engagement metrics flow back into the dashboard for every widget placement.",
      },
    ],
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
    title: "Trust customers can see at the moment of decision.",
    description:
      "Modern customers expect trust signals directly inside the buying journey — not hidden on separate review pages. Tellacity widgets surface verified customer experiences exactly where customers make decisions, while keeping review data synchronised automatically across every page.",
    bullets: [
      "Live review synchronisation across every domain you run.",
      "Verified review signals tied to authenticated customer accounts.",
      "Centralised moderation with policy enforcement on every widget.",
      "Real-time trust visibility on product, pricing, and checkout pages.",
      "Consistent reputation display — same data, same brand, every site.",
      "Cross-site review consistency that holds up under public scrutiny.",
    ],
    surface: "widget-preview",
  },

  trust: {
    title: "Verified-review display infrastructure, built to scale.",
    description:
      "From single landing pages to global storefront ecosystems, Tellacity widgets are designed to deliver verified review data consistently across high-traffic environments. Every widget is optimised for lightweight delivery, centralised management, and live synchronisation across multiple sites and teams.",
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
    title: "Drop into any frontend stack without slowing it down.",
    description:
      "Tellacity widgets are designed to integrate cleanly into modern frontend stacks without compromising speed, accessibility, or visual consistency. The same single snippet works across stacks and ships only what each page needs.",
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
    title: "Configure once. Deploy everywhere.",
    description:
      "All Tellacity widgets share one control plane. Update branding, layouts, review rules, or moderation policies in the dashboard and every embed across every site reflects the change in real time — no redeploys, no per-site code changes, no drift.",
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
          "Configuration changes propagate to live widgets immediately — no redeploys, no cache busting.",
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
    title: "Trust placed where decisions actually happen.",
    description:
      "Trust works best when customers see it during decision-making moments. Tellacity widgets place verified customer feedback directly inside product pages, pricing flows, and conversion paths where reputation has the highest impact.",
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
          "Live, recent, authenticated reviews — not stale testimonials picked years ago.",
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
        "Yes. Widgets can be configured to show only verified reviews — those tied to authenticated customer accounts or proof-of-purchase signals — so visitors see only the most credible feedback.",
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

const productJsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Tellacity Review Widgets",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  description:
    "Verified-review display infrastructure for modern websites. Embed live, brand-matched, accessible review widgets on product, pricing, and checkout pages with one snippet.",
  brand: { "@type": "Organization", name: "Tellacity" },
  url: "https://tellacity.com/solutions/review-widgets",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
    availability: "https://schema.org/InStock",
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
  name: "How to install a Tellacity review widget on your website",
  description:
    "Add live, verified Tellacity review widgets to any page in five steps using a single snippet of JavaScript.",
  totalTime: "PT5M",
  step: [
    {
      "@type": "HowToStep",
      position: 1,
      name: "Open the Tellacity dashboard",
      text: "Sign in to your Tellacity business dashboard and open the Widgets section.",
    },
    {
      "@type": "HowToStep",
      position: 2,
      name: "Pick a widget layout",
      text: "Choose the layout — rating badge, carousel, sidebar list, floating button, or product block — and configure brand colours and review filters.",
    },
    {
      "@type": "HowToStep",
      position: 3,
      name: "Copy the install snippet",
      text: "Copy the single-line JavaScript snippet generated by the dashboard for that widget.",
    },
    {
      "@type": "HowToStep",
      position: 4,
      name: "Paste the snippet into your site",
      text: "Paste the snippet into your site's HTML before the closing </body> tag. Works in plain HTML, React, Next.js, Shopify, WordPress, Webflow, Wix, and custom stacks.",
    },
    {
      "@type": "HowToStep",
      position: 5,
      name: "Publish and watch it update live",
      text: "Save and publish the page. The widget renders on load and stays synchronised with your Tellacity dashboard — new reviews and moderation changes appear automatically.",
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
            dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
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
